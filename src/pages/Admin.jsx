import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useBallot } from '../contexts/BallotContext';
import { db } from '../lib/firebase';
import { doc, setDoc, collection, getDocs, Timestamp, deleteField } from 'firebase/firestore';
import ArtDecoFrame from '../components/layout/ArtDecoFrame';

export default function Admin() {
  const { isAdmin } = useAuth();
  const { config, winners, categories, totalCategories } = useBallot();

  // Track only local unsaved overrides per category
  const [localOverrides, setLocalOverrides] = useState({});
  const [ballotCount, setBallotCount] = useState(0);
  const [savingCategory, setSavingCategory] = useState(null);

  // Derive displayed selection: local override if set, otherwise saved winner
  const getSelection = (categoryId) => localOverrides[categoryId] ?? winners[categoryId];

  // Fetch ballot count
  useEffect(() => {
    const fetchBallotCount = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'ballots'));
        setBallotCount(snapshot.size);
      } catch (error) {
        console.error('Error fetching ballot count:', error);
      }
    };
    fetchBallotCount();
  }, []);

  if (!isAdmin) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">
        <h1 className="font-display text-gold-gradient text-3xl mb-4">Access Denied</h1>
        <p className="text-cream/40 font-body">You do not have admin privileges.</p>
      </div>
    );
  }

  const handleToggleLock = async () => {
    await setDoc(doc(db, 'config', 'ceremony'), { isLocked: !config.isLocked }, { merge: true });
  };

  const handleToggleCeremony = async () => {
    if (!config.ceremonyStarted) {
      if (!window.confirm('Are you sure? This will reveal all picks to everyone.')) return;
    }
    await setDoc(doc(db, 'config', 'ceremony'), { ceremonyStarted: !config.ceremonyStarted }, { merge: true });
  };

  const handleLockTimeChange = async (e) => {
    const value = e.target.value;
    if (!value) return;
    await setDoc(doc(db, 'config', 'ceremony'), { lockTime: Timestamp.fromDate(new Date(value)) }, { merge: true });
  };

  const handleSetWinner = async (categoryId) => {
    const nomineeId = getSelection(categoryId);
    if (!nomineeId) return;
    setSavingCategory(categoryId);
    try {
      await setDoc(doc(db, 'config', 'winners'), { [categoryId]: nomineeId }, { merge: true });
    } catch (error) {
      console.error('Error setting winner:', error);
    }
    setSavingCategory(null);
  };

  const handleClearWinner = async (categoryId) => {
    setSavingCategory(categoryId);
    try {
      await setDoc(doc(db, 'config', 'winners'), { [categoryId]: deleteField() }, { merge: true });
      setLocalOverrides(prev => {
        const next = { ...prev };
        delete next[categoryId];
        return next;
      });
    } catch (error) {
      console.error('Error clearing winner:', error);
    }
    setSavingCategory(null);
  };

  // Convert Firestore Timestamp to datetime-local format string
  const getLockTimeValue = () => {
    if (!config.lockTime) return '';
    const date = config.lockTime.toDate ? config.lockTime.toDate() : new Date(config.lockTime);
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60 * 1000);
    return local.toISOString().slice(0, 16);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8 animate-fade-in-up">
        <div className="deco-divider mb-4">
          <span className="text-gold/50 text-xs">★</span>
        </div>
        <h1 className="font-display text-gold-gradient text-4xl">Admin Panel</h1>
      </div>

      {/* Ceremony Controls */}
      <div className="animate-fade-in-up delay-1">
        <ArtDecoFrame className="mb-10">
          <h2 className="font-display text-gold/80 text-xl mb-6">Ceremony Controls</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Lock Ballots Toggle */}
            <div className="flex items-center justify-between bg-black/50 border border-gold/15 rounded-lg px-4 py-3">
              <div>
                <span className="text-cream/80 font-body text-sm font-semibold">Lock Ballots</span>
                <span className={`ml-3 text-xs font-body ${config.isLocked ? 'text-red-400/80' : 'text-green-400/80'}`}>
                  {config.isLocked ? 'Locked' : 'Unlocked'}
                </span>
              </div>
              <button
                onClick={handleToggleLock}
                className={`relative w-12 h-6 rounded-full transition-colors ${config.isLocked ? 'bg-gold' : 'bg-cream/15'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-black transition-transform ${config.isLocked ? 'translate-x-6' : 'translate-x-0'}`}
                />
              </button>
            </div>

            {/* Start Ceremony Toggle */}
            <div className="flex items-center justify-between bg-black/50 border border-gold/15 rounded-lg px-4 py-3">
              <div>
                <span className="text-cream/80 font-body text-sm font-semibold">Ceremony Started</span>
                <span className={`ml-3 text-xs font-body ${config.ceremonyStarted ? 'text-green-400/80' : 'text-cream/30'}`}>
                  {config.ceremonyStarted ? 'Live' : 'Not Started'}
                </span>
              </div>
              <button
                onClick={handleToggleCeremony}
                className={`relative w-12 h-6 rounded-full transition-colors ${config.ceremonyStarted ? 'bg-gold' : 'bg-cream/15'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-black transition-transform ${config.ceremonyStarted ? 'translate-x-6' : 'translate-x-0'}`}
                />
              </button>
            </div>
          </div>

          {/* Lock Time Picker */}
          <div className="mb-6">
            <label className="block text-cream/60 font-body text-xs uppercase tracking-wider mb-2">Ballot Lock Time</label>
            <input
              type="datetime-local"
              value={getLockTimeValue()}
              onChange={handleLockTimeChange}
              className="bg-black border border-gold/20 rounded-md text-cream/80 px-4 py-2 font-body text-sm focus:border-gold focus:outline-none transition-colors"
            />
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/50 border border-gold/15 rounded-lg px-4 py-3 text-center">
              <p className="text-cream/30 text-[10px] uppercase tracking-wider font-body mb-1">Winners Set</p>
              <p className="text-gold font-display text-xl">
                {Object.keys(winners).length} / {totalCategories}
              </p>
            </div>
            <div className="bg-black/50 border border-gold/15 rounded-lg px-4 py-3 text-center">
              <p className="text-cream/30 text-[10px] uppercase tracking-wider font-body mb-1">Total Ballots</p>
              <p className="text-gold font-display text-xl">{ballotCount}</p>
            </div>
          </div>
        </ArtDecoFrame>
      </div>

      {/* Winners Grid */}
      <div className="animate-fade-in-up delay-2">
        <div className="deco-divider mb-6">
          <span className="text-gold/50 text-xs uppercase tracking-[0.2em] font-body">Set Winners</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {categories.map((category, i) => {
          const hasWinner = !!winners[category.id];
          const isSaving = savingCategory === category.id;

          return (
            <div
              key={category.id}
              className="card-deco animate-fade-in-up"
              style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
            >
              {/* Category Header */}
              <div className="flex items-center gap-2 mb-3">
                {hasWinner && (
                  <div className="w-4 h-4 bg-green-500/20 border border-green-500/40 flex items-center justify-center shrink-0">
                    <svg className="w-2.5 h-2.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                <h3 className="font-display text-gold/80 text-sm">{category.name}</h3>
              </div>

              {/* Nominees List */}
              <div className="space-y-1 mb-4">
                {category.nominees.map(nominee => {
                  const isSelected = getSelection(category.id) === nominee.id;
                  return (
                    <button
                      key={nominee.id}
                      onClick={() => setLocalOverrides(prev => ({ ...prev, [category.id]: nominee.id }))}
                      className={`w-full text-left px-3 py-1.5 border rounded transition-all font-body text-xs ${
                        isSelected
                          ? 'border-gold/40 bg-gold/10 text-gold-light'
                          : 'border-transparent hover:border-gold/15 text-cream/50 hover:text-cream/80'
                      }`}
                    >
                      {nominee.title}
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleSetWinner(category.id)}
                  disabled={!getSelection(category.id) || isSaving}
                  className="btn-gold flex-1 text-[10px] py-1.5 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:transform-none"
                >
                  {isSaving ? 'Saving...' : hasWinner ? 'Update' : 'Set Winner'}
                </button>
                {hasWinner && (
                  <button
                    onClick={() => handleClearWinner(category.id)}
                    disabled={isSaving}
                    className="border border-red-400/30 text-red-400/70 px-3 py-1.5 text-[10px] font-body uppercase tracking-wider hover:bg-red-400/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
