import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useBallot } from '../contexts/BallotContext';
import { calculateScore, getScoreBreakdown } from '../lib/scoring';

export default function Leaderboard() {
  const { user } = useAuth();
  const { winners, config, categories } = useBallot();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('everyone');
  const [expandedUserId, setExpandedUserId] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const [ballotsSnap, usersSnap] = await Promise.all([
          getDocs(collection(db, 'ballots')),
          getDocs(collection(db, 'users')),
        ]);

        const userMap = {};
        usersSnap.forEach((doc) => {
          userMap[doc.id] = doc.data();
        });

        const rawEntries = ballotsSnap.docs.map((doc) => {
          const data = doc.data();
          const userData = userMap[data.userId] || {};
          return {
            docId: doc.id,
            userId: data.userId,
            picks: data.picks || {},
            score: calculateScore(data.picks || {}, winners),
            updatedAt: data.updatedAt,
            displayName: userData.displayName || 'Anonymous',
            photoURL: userData.photoURL || null,
          };
        });

        rawEntries.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          const aTime = a.updatedAt?.toMillis?.() ?? a.updatedAt ?? Infinity;
          const bTime = b.updatedAt?.toMillis?.() ?? b.updatedAt ?? Infinity;
          return aTime - bTime;
        });

        let currentRank = 1;
        const ranked = rawEntries.map((entry, i) => {
          if (i > 0 && entry.score < rawEntries[i - 1].score) {
            currentRank = i + 1;
          }
          return { ...entry, rank: currentRank };
        });

        setEntries(ranked);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      }
      setLoading(false);
    };

    fetchLeaderboard();
  }, [winners]);

  const announcedCount = Object.keys(winners).length;

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRankDisplay = (rank) => {
    if (rank === 1) return { bg: 'bg-gold text-black', label: '1' };
    if (rank === 2) return { bg: 'bg-cream/40 text-black', label: '2' };
    if (rank === 3) return { bg: 'bg-gold-dark/60 text-cream', label: '3' };
    return { bg: 'bg-cream/8 text-cream/50', label: String(rank) };
  };

  const getNomineeName = (categoryId, nomineeId) => {
    if (!nomineeId) return 'No pick';
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return nomineeId;
    const nominee = category.nominees.find((n) => n.id === nomineeId);
    return nominee ? nominee.title : nomineeId;
  };

  const handleRowClick = (userId) => {
    if (!config.ceremonyStarted) return;
    setExpandedUserId(expandedUserId === userId ? null : userId);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8 animate-fade-in-up">
        <div className="deco-divider mb-4">
          <span className="text-gold/50 text-xs">★</span>
        </div>
        <h1 className="text-4xl font-display text-gold-gradient">
          Leaderboard
        </h1>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-8 border-b border-gold/15">
        <button
          onClick={() => setActiveTab('everyone')}
          className={`px-5 py-2.5 text-[11px] uppercase tracking-[0.2em] font-body transition-colors ${
            activeTab === 'everyone'
              ? 'text-gold border-b border-gold'
              : 'text-cream/30 hover:text-cream/60'
          }`}
        >
          Everyone
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`px-5 py-2.5 text-[11px] uppercase tracking-[0.2em] font-body transition-colors flex items-center gap-2 ${
            activeTab === 'groups'
              ? 'text-gold border-b border-gold'
              : 'text-cream/30 hover:text-cream/60'
          }`}
        >
          Groups
          <span className="text-[9px] bg-gold/10 text-gold/60 px-1.5 py-0.5">
            Soon
          </span>
        </button>
      </div>

      {activeTab === 'groups' ? (
        <div className="card-deco text-center py-16">
          <p className="text-cream/40 font-body">
            Group leaderboards are coming soon.
          </p>
          <p className="text-cream/20 font-body text-sm mt-2">
            Create or join a group to compete with friends.
          </p>
        </div>
      ) : (
        <>
          {/* Pre-ceremony note */}
          {!config.ceremonyStarted && (
            <div className="border border-gold/15 bg-gold/[0.03] rounded-lg px-4 py-3 mb-6 flex items-start gap-3 animate-fade-in">
              <span className="text-gold/50 mt-0.5 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
                </svg>
              </span>
              <p className="text-cream/40 font-body text-sm">
                Picks will be revealed when the ceremony begins. Scores update live as winners are announced.
              </p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block w-8 h-8 border border-gold/30 border-t-gold rotate-45 animate-spin mb-4" />
              <p className="text-cream/30 font-body text-sm uppercase tracking-widest">Loading</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="card-deco text-center py-16">
              <p className="text-cream/40 font-body">
                No ballots submitted yet.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {entries.map((entry, i) => {
                const isCurrentUser = user && entry.userId === user.uid;
                const isExpanded = expandedUserId === entry.userId;
                const breakdown = isExpanded
                  ? getScoreBreakdown(entry.picks, winners, categories)
                  : [];
                const rank = getRankDisplay(entry.rank);

                return (
                  <div
                    key={entry.docId}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${Math.min(i * 50, 500)}ms` }}
                  >
                    <div
                      onClick={() => handleRowClick(entry.userId)}
                      className={`flex items-center gap-4 px-4 py-3 transition-all ${
                        isCurrentUser
                          ? 'border-l-2 border-gold bg-gold/[0.04]'
                          : 'border-l-2 border-transparent'
                      } ${
                        config.ceremonyStarted
                          ? 'cursor-pointer hover:bg-white/[0.03]'
                          : ''
                      }`}
                    >
                      {/* Rank */}
                      <div className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold shrink-0 ${rank.bg}`}>
                        {rank.label}
                      </div>

                      {/* Avatar */}
                      {entry.photoURL ? (
                        <img
                          src={entry.photoURL}
                          alt={entry.displayName}
                          className="w-9 h-9 rounded-full shrink-0 object-cover border border-cream/10"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gold/10 flex items-center justify-center text-gold/60 font-bold text-xs shrink-0 border border-gold/10">
                          {getInitials(entry.displayName)}
                        </div>
                      )}

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <p className={`font-body text-sm truncate ${
                          isCurrentUser ? 'text-gold font-semibold' : 'text-cream/80'
                        }`}>
                          {entry.displayName}
                          {isCurrentUser && (
                            <span className="text-cream/25 text-xs ml-2 font-normal">(you)</span>
                          )}
                        </p>
                      </div>

                      {/* Score */}
                      <div className="text-right shrink-0">
                        <span className="text-gold font-display text-lg font-bold">
                          {entry.score}
                        </span>
                        {announcedCount > 0 && (
                          <span className="text-cream/20 text-xs font-body">
                            {' '}/ {announcedCount}
                          </span>
                        )}
                      </div>

                      {/* Expand indicator */}
                      {config.ceremonyStarted && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className={`w-4 h-4 text-cream/15 shrink-0 transition-transform duration-300 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        >
                          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>

                    {/* Score breakdown */}
                    {isExpanded && (
                      <div className="ml-12 mr-4 mb-2 mt-1 border-l border-gold/10 pl-4 animate-slide-down">
                        {breakdown
                          .filter((item) => item.announced)
                          .map((item) => (
                            <div
                              key={item.categoryId}
                              className="flex items-center gap-2 py-1.5 text-xs font-body"
                            >
                              {item.correct ? (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-green-500/70 shrink-0">
                                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-red-400/50 shrink-0">
                                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                                </svg>
                              )}
                              <span className="text-cream/30 w-40 truncate">
                                {item.categoryName}
                              </span>
                              <span className={item.correct ? 'text-green-400/70' : 'text-cream/25'}>
                                {getNomineeName(item.categoryId, item.pickId)}
                              </span>
                            </div>
                          ))}
                        {breakdown.filter((item) => item.announced).length === 0 && (
                          <p className="text-cream/25 text-xs py-2 font-body">
                            No winners announced yet.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
