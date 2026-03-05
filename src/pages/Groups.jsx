import { useState, useEffect } from 'react';
import {
  collection, getDocs, doc, getDoc,
  updateDoc, writeBatch, arrayUnion, arrayRemove, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useBallot } from '../contexts/BallotContext';
import { generateJoinCode, calculateScore } from '../lib/scoring';

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
};

const Avatar = ({ photoURL, displayName, size = 'sm' }) => {
  const dim = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-9 h-9 text-xs';
  return photoURL ? (
    <img src={photoURL} alt={displayName} className={`${dim} rounded-full shrink-0 object-cover border border-cream/10`} referrerPolicy="no-referrer" />
  ) : (
    <div className={`${dim} rounded-full bg-gold/10 flex items-center justify-center text-gold/60 font-bold shrink-0 border border-gold/10`}>
      {getInitials(displayName)}
    </div>
  );
};

export default function Groups() {
  const { user } = useAuth();
  const { winners, config } = useBallot();

  const [allGroups, setAllGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null); // null | 'create' | 'join'
  const [groupName, setGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [groupData, setGroupData] = useState({}); // { [groupId]: { members, pending } }
  const [copiedCode, setCopiedCode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [requesting, setRequesting] = useState(new Set());

  const announcedCount = Object.keys(winners).length;

  // Derived lists
  const myGroups = allGroups.filter((g) => g.members?.includes(user.uid));
  const discoverGroups = allGroups
    .filter((g) => !g.members?.includes(user.uid))
    .filter((g) => !searchQuery || g.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const fetchGroups = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'groups'));
      setAllGroups(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Error fetching groups:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGroups();
  }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    setWorking(true);
    setError('');
    try {
      const code = generateJoinCode();
      const batch = writeBatch(db);
      const groupRef = doc(collection(db, 'groups'));
      batch.set(groupRef, {
        name: groupName.trim(),
        createdBy: user.uid,
        joinCode: code,
        members: [user.uid],
        pendingMembers: [],
        createdAt: serverTimestamp(),
      });
      batch.set(doc(db, 'joinCodes', code), { groupId: groupRef.id });
      await batch.commit();
      setMode(null);
      setGroupName('');
      await fetchGroups();
    } catch (err) {
      setError('Failed to create group. Please try again.');
      console.error(err);
    }
    setWorking(false);
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setWorking(true);
    setError('');
    try {
      const codeDoc = await getDoc(doc(db, 'joinCodes', code));
      if (!codeDoc.exists()) {
        setError('Invalid join code. Please check and try again.');
        setWorking(false);
        return;
      }
      const { groupId } = codeDoc.data();
      const groupDoc = await getDoc(doc(db, 'groups', groupId));
      if (!groupDoc.exists()) {
        setError('Group not found.');
        setWorking(false);
        return;
      }
      if (groupDoc.data().members.includes(user.uid)) {
        setError("You're already a member of this group.");
        setWorking(false);
        return;
      }
      await updateDoc(doc(db, 'groups', groupId), { members: arrayUnion(user.uid) });
      setMode(null);
      setJoinCode('');
      await fetchGroups();
    } catch (err) {
      setError('Failed to join group. Please try again.');
      console.error(err);
    }
    setWorking(false);
  };

  const handleExpand = async (groupId) => {
    if (expandedId === groupId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(groupId);
    if (groupData[groupId]) return;

    const group = allGroups.find((g) => g.id === groupId);
    if (!group) return;

    try {
      const userDocs = await Promise.all(
        group.members.map((uid) => getDoc(doc(db, 'users', uid)))
      );
      const memberUsers = userDocs.map((d) => ({ uid: d.id, ...(d.data() || {}) }));

      // Fetch pending member user docs (for creator's approval UI)
      const pendingUids = group.pendingMembers || [];
      const pendingDocs = pendingUids.length > 0
        ? await Promise.all(pendingUids.map((uid) => getDoc(doc(db, 'users', uid))))
        : [];
      const pending = pendingDocs.map((d) => ({
        uid: d.id,
        displayName: d.data()?.displayName || 'Anonymous',
        photoURL: d.data()?.photoURL || null,
      }));

      let members;
      if (config.ceremonyStarted) {
        const ballotDocs = await Promise.all(
          group.members.map((uid) => getDoc(doc(db, 'ballots', uid)))
        );
        const rawEntries = memberUsers.map((mu, i) => {
          const ballot = ballotDocs[i].exists() ? ballotDocs[i].data() : {};
          const picks = ballot.picks || {};
          return {
            uid: mu.uid,
            displayName: mu.displayName || 'Anonymous',
            photoURL: mu.photoURL || null,
            score: calculateScore(picks, winners),
            updatedAt: ballot.updatedAt || null,
          };
        });
        rawEntries.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          const aTime = a.updatedAt?.toMillis?.() ?? Infinity;
          const bTime = b.updatedAt?.toMillis?.() ?? Infinity;
          return aTime - bTime;
        });
        let currentRank = 1;
        members = rawEntries.map((entry, i) => {
          if (i > 0 && entry.score < rawEntries[i - 1].score) currentRank = i + 1;
          return { ...entry, rank: currentRank };
        });
      } else {
        members = memberUsers.map((mu) => ({
          uid: mu.uid,
          displayName: mu.displayName || 'Anonymous',
          photoURL: mu.photoURL || null,
        }));
      }

      setGroupData((prev) => ({ ...prev, [groupId]: { members, pending } }));
    } catch (err) {
      console.error('Error fetching group data:', err);
    }
  };

  const handleRequest = async (groupId) => {
    setRequesting((prev) => new Set(prev).add(groupId));
    try {
      await updateDoc(doc(db, 'groups', groupId), { pendingMembers: arrayUnion(user.uid) });
      setAllGroups((prev) => prev.map((g) => g.id === groupId
        ? { ...g, pendingMembers: [...(g.pendingMembers || []), user.uid] }
        : g
      ));
    } catch (err) {
      console.error('Error requesting to join:', err);
    }
    setRequesting((prev) => { const s = new Set(prev); s.delete(groupId); return s; });
  };

  const handleApprove = async (groupId, uid) => {
    try {
      await updateDoc(doc(db, 'groups', groupId), {
        members: arrayUnion(uid),
        pendingMembers: arrayRemove(uid),
      });
      setAllGroups((prev) => prev.map((g) => g.id === groupId
        ? {
            ...g,
            members: [...g.members, uid],
            pendingMembers: (g.pendingMembers || []).filter((m) => m !== uid),
          }
        : g
      ));
      // Invalidate cache so expanded view re-fetches with new member
      setGroupData((prev) => { const next = { ...prev }; delete next[groupId]; return next; });
    } catch (err) {
      console.error('Error approving request:', err);
    }
  };

  const handleReject = async (groupId, uid) => {
    try {
      await updateDoc(doc(db, 'groups', groupId), { pendingMembers: arrayRemove(uid) });
      setAllGroups((prev) => prev.map((g) => g.id === groupId
        ? { ...g, pendingMembers: (g.pendingMembers || []).filter((m) => m !== uid) }
        : g
      ));
      setGroupData((prev) => { const next = { ...prev }; delete next[groupId]; return next; });
    } catch (err) {
      console.error('Error rejecting request:', err);
    }
  };

  const handleCopyLink = (code) => {
    const url = `${window.location.origin}/groups/join/${code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedCode(`${code}-link`);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(`${code}-code`);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  const getRankDisplay = (rank) => {
    if (rank === 1) return { bg: 'bg-gold text-black', label: '1' };
    if (rank === 2) return { bg: 'bg-cream/40 text-black', label: '2' };
    if (rank === 3) return { bg: 'bg-gold-dark/60 text-cream', label: '3' };
    return { bg: 'bg-cream/8 text-cream/50', label: String(rank) };
  };

  const MyGroupCard = ({ group, i }) => {
    const isExpanded = expandedId === group.id;
    const data = groupData[group.id];
    const isCreator = group.createdBy === user.uid;
    const pendingCount = (group.pendingMembers || []).length;

    return (
      <div className="animate-fade-in-up" style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}>
        <div className="card-deco overflow-hidden">
          {/* Header row */}
          <div className="cursor-pointer" onClick={() => handleExpand(group.id)}>
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-gold text-lg truncate">{group.name}</h3>
                  {isCreator && pendingCount > 0 && (
                    <span className="shrink-0 text-[10px] bg-gold/15 text-gold border border-gold/20 rounded-full px-2 py-0.5 font-body">
                      {pendingCount} pending
                    </span>
                  )}
                </div>
                <p className="text-cream/30 font-body text-xs mt-0.5">
                  {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
                </p>
              </div>

              {/* Copy buttons - desktop only (inline) */}
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handleCopyLink(group.joinCode); }}
                  className="flex items-center gap-1.5 bg-gold/5 border border-gold/15 rounded px-2.5 py-1 font-body text-xs text-gold/70 hover:bg-gold/10 hover:text-gold transition-colors shrink-0"
                  title="Copy invite link"
                >
                  {copiedCode === `${group.joinCode}-link` ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-green-400 shrink-0">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                      </svg>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <span>Copy Invite Link</span>
                  )}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleCopyCode(group.joinCode); }}
                  className="flex items-center gap-1.5 bg-gold/5 border border-gold/15 rounded px-2.5 py-1 font-body text-xs text-gold/70 hover:bg-gold/10 hover:text-gold transition-colors shrink-0"
                  title="Copy invite code"
                >
                  {copiedCode === `${group.joinCode}-code` ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-green-400 shrink-0">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                      </svg>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <span>Copy Invite Code</span>
                  )}
                </button>
              </div>

              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                className={`w-4 h-4 text-cream/20 shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
            </div>

            {/* Copy buttons - mobile only (separate row) */}
            <div className="flex sm:hidden items-center gap-2 mt-2">
              <button
                onClick={(e) => { e.stopPropagation(); handleCopyLink(group.joinCode); }}
                className="flex items-center gap-1.5 bg-gold/5 border border-gold/15 rounded px-2.5 py-1 font-body text-xs text-gold/70 hover:bg-gold/10 hover:text-gold transition-colors"
                title="Copy invite link"
              >
                {copiedCode === `${group.joinCode}-link` ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-green-400 shrink-0">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                    </svg>
                    <span>Copied!</span>
                  </>
                ) : (
                  <span>Copy Invite Link</span>
                )}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleCopyCode(group.joinCode); }}
                className="flex items-center gap-1.5 bg-gold/5 border border-gold/15 rounded px-2.5 py-1 font-body text-xs text-gold/70 hover:bg-gold/10 hover:text-gold transition-colors"
                title="Copy invite code"
              >
                {copiedCode === `${group.joinCode}-code` ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-green-400 shrink-0">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                    </svg>
                    <span>Copied!</span>
                  </>
                ) : (
                  <span>Copy Invite Code</span>
                )}
              </button>
            </div>
          </div>

          {/* Expanded content */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-gold/10 animate-slide-down">
              {!data ? (
                <div className="text-center py-4">
                  <div className="inline-block w-5 h-5 border border-gold/30 border-t-gold rotate-45 animate-spin" />
                </div>
              ) : (
                <>
                  {/* Pending requests (creator only) */}
                  {isCreator && data.pending.length > 0 && (
                    <div className="mb-4 pb-4 border-b border-gold/10">
                      <p className="font-body text-xs uppercase tracking-widest text-gold/50 mb-2">
                        Pending Requests
                      </p>
                      <div className="space-y-1">
                        {data.pending.map((p) => (
                          <div key={p.uid} className="flex items-center gap-3 px-2 py-2">
                            <Avatar photoURL={p.photoURL} displayName={p.displayName} />
                            <p className="font-body text-sm text-cream/70 flex-1 truncate">{p.displayName}</p>
                            <button
                              onClick={() => handleApprove(group.id, p.uid)}
                              className="text-[11px] font-body text-green-400/80 bg-green-500/10 border border-green-500/15 rounded px-2.5 py-1 hover:bg-green-500/20 transition-colors shrink-0"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(group.id, p.uid)}
                              className="text-[11px] font-body text-cream/30 hover:text-cream/60 transition-colors shrink-0"
                            >
                              Decline
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Member list / leaderboard */}
                  {config.ceremonyStarted ? (
                    <div className="space-y-1">
                      {data.members.map((member) => {
                        const isCurrentUser = member.uid === user.uid;
                        const rank = getRankDisplay(member.rank);
                        return (
                          <div key={member.uid} className={`flex items-center gap-3 px-2 py-2.5 rounded ${isCurrentUser ? 'bg-gold/[0.04]' : ''}`}>
                            <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0 ${rank.bg}`}>
                              {rank.label}
                            </div>
                            <Avatar photoURL={member.photoURL} displayName={member.displayName} />
                            <div className="flex-1 min-w-0">
                              <p className={`font-body text-sm truncate ${isCurrentUser ? 'text-gold font-semibold' : 'text-cream/80'}`}>
                                {member.displayName}
                                {isCurrentUser && <span className="text-cream/25 text-xs ml-1.5 font-normal">(you)</span>}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-gold font-display text-base font-bold">{member.score}</span>
                              {announcedCount > 0 && <span className="text-cream/20 text-xs font-body"> / {announcedCount}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {data.members.map((member) => {
                        const isCurrentUser = member.uid === user.uid;
                        return (
                          <div key={member.uid} className={`flex items-center gap-3 px-2 py-2.5 rounded ${isCurrentUser ? 'bg-gold/[0.04]' : ''}`}>
                            <Avatar photoURL={member.photoURL} displayName={member.displayName} />
                            <p className={`font-body text-sm truncate ${isCurrentUser ? 'text-gold font-semibold' : 'text-cream/80'}`}>
                              {member.displayName}
                              {isCurrentUser && <span className="text-cream/25 text-xs ml-1.5 font-normal">(you)</span>}
                            </p>
                          </div>
                        );
                      })}
                      <p className="text-cream/20 font-body text-xs mt-3 pt-3 border-t border-gold/10">
                        Scores will appear when the ceremony begins.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8 animate-fade-in-up">
        <div className="deco-divider mb-4">
          <span className="text-gold/50 text-xs">&#9733;</span>
        </div>
        <h1 className="text-4xl font-display text-gold-gradient">Groups</h1>
        <p className="text-cream/40 font-body text-sm mt-2">
          Compete with friends in private groups
        </p>
      </div>

      {/* Action buttons */}
      {mode === null && (
        <div className="flex gap-3 justify-center mb-10 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
          <button onClick={() => { setMode('create'); setError(''); }} className="btn-gold">
            Create Group
          </button>
          <button onClick={() => { setMode('join'); setError(''); }} className="btn-outline">
            Join with Code
          </button>
        </div>
      )}

      {/* Create form */}
      {mode === 'create' && (
        <div className="card-deco mb-10 animate-scale-in">
          <h2 className="font-display text-gold text-lg mb-4">Create Group</h2>
          <form onSubmit={handleCreate}>
            <div className="mb-4">
              <label className="block font-body text-xs uppercase tracking-widest text-cream/40 mb-2">Group Name</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Oscar Night 2026"
                maxLength={40}
                className="w-full bg-black/40 border border-gold/20 rounded px-4 py-2.5 text-cream font-body text-sm focus:outline-none focus:border-gold/50 placeholder:text-cream/20"
                autoFocus
              />
            </div>
            {error && <p className="text-red-400/70 font-body text-sm mb-3">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={working || !groupName.trim()} className="btn-gold">
                {working ? 'Creating...' : 'Create'}
              </button>
              <button type="button" onClick={() => { setMode(null); setGroupName(''); setError(''); }} className="btn-outline">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Join form */}
      {mode === 'join' && (
        <div className="card-deco mb-10 animate-scale-in">
          <h2 className="font-display text-gold text-lg mb-4">Join with Code</h2>
          <form onSubmit={handleJoin}>
            <div className="mb-4">
              <label className="block font-body text-xs uppercase tracking-widest text-cream/40 mb-2">Join Code</label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. XKCD42"
                maxLength={6}
                className="w-full bg-black/40 border border-gold/20 rounded px-4 py-2.5 text-cream font-body text-sm font-mono tracking-widest focus:outline-none focus:border-gold/50 placeholder:text-cream/20 uppercase"
                autoFocus
              />
            </div>
            {error && <p className="text-red-400/70 font-body text-sm mb-3">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={working || !joinCode.trim()} className="btn-gold">
                {working ? 'Joining...' : 'Join'}
              </button>
              <button type="button" onClick={() => { setMode(null); setJoinCode(''); setError(''); }} className="btn-outline">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block w-8 h-8 border border-gold/30 border-t-gold rotate-45 animate-spin mb-4" />
          <p className="text-cream/30 font-body text-sm uppercase tracking-widest">Loading</p>
        </div>
      ) : (
        <>
          {/* My Groups */}
          {myGroups.length > 0 && (
            <section className="mb-10">
              <h2 className="font-body text-xs uppercase tracking-widest text-cream/30 mb-3">My Groups</h2>
              <div className="space-y-2">
                {myGroups.map((group, i) => (
                  <MyGroupCard key={group.id} group={group} i={i} />
                ))}
              </div>
            </section>
          )}

          {/* Discover */}
          <section>
            <div className="flex items-center gap-4 mb-3">
              <h2 className="font-body text-xs uppercase tracking-widest text-cream/30 shrink-0">Discover Groups</h2>
              <div className="flex-1 relative">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                  className="w-3.5 h-3.5 text-cream/20 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search groups..."
                  className="w-full bg-black/20 border border-gold/10 rounded pl-8 pr-4 py-1.5 text-cream font-body text-xs focus:outline-none focus:border-gold/30 placeholder:text-cream/15"
                />
              </div>
            </div>

            {discoverGroups.length === 0 ? (
              <div className="card-deco text-center py-10">
                <p className="text-cream/25 font-body text-sm">
                  {searchQuery ? 'No groups match your search.' : myGroups.length > 0 ? "You're in all available groups." : 'No groups yet — be the first to create one.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {discoverGroups.map((group, i) => {
                  const isPending = (group.pendingMembers || []).includes(user.uid);
                  const isRequesting = requesting.has(group.id);

                  return (
                    <div key={group.id} className="animate-fade-in-up" style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}>
                      <div className="card-deco flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display text-cream/80 text-base truncate">{group.name}</h3>
                          <p className="text-cream/25 font-body text-xs mt-0.5">
                            {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
                          </p>
                        </div>
                        {isPending ? (
                          <span className="text-[11px] font-body text-gold/50 bg-gold/5 border border-gold/15 rounded px-3 py-1.5 shrink-0">
                            Requested
                          </span>
                        ) : (
                          <button
                            onClick={() => handleRequest(group.id)}
                            disabled={isRequesting}
                            className="btn-outline text-xs py-1.5 shrink-0"
                          >
                            {isRequesting ? 'Requesting...' : 'Request to Join'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
