import { createContext, useContext, useEffect, useState, useRef } from 'react';
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, firebaseConfigured } from '../lib/firebase';
import { useAuth } from './AuthContext';
import nominees from '../data/nominees2026.json';

const BallotContext = createContext(null);

export function BallotProvider({ children }) {
  const { user } = useAuth();
  const [picks, setPicks] = useState({});
  const [loading, setLoading] = useState(firebaseConfigured);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    lockTime: null,
    isLocked: false,
    ceremonyStarted: false,
  });
  const [winners, setWinners] = useState({});
  const picksRef = useRef({});

  // Listen to config changes
  useEffect(() => {
    if (!db) return;
    const unsubscribe = onSnapshot(doc(db, 'config', 'ceremony'), (snapshot) => {
      if (snapshot.exists()) {
        setConfig(snapshot.data());
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to winners changes
  useEffect(() => {
    if (!db) return;
    const unsubscribe = onSnapshot(doc(db, 'config', 'winners'), (snapshot) => {
      if (snapshot.exists()) {
        setWinners(snapshot.data());
      }
    });
    return () => unsubscribe();
  }, []);

  // Load user's ballot (keyed by user UID)
  useEffect(() => {
    if (!user || !db) {
      setPicks({});
      picksRef.current = {};
      setLoading(false);
      return;
    }

    setLoading(true);
    getDoc(doc(db, 'ballots', user.uid))
      .then((snapshot) => {
        if (snapshot.exists()) {
          const ballotPicks = snapshot.data().picks || {};
          setPicks(ballotPicks);
          picksRef.current = ballotPicks;
        }
      })
      .catch((error) => {
        console.error('Error loading ballot:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  const isLocked = () => {
    if (config.isLocked) return true;
    if (config.lockTime) {
      const lockDate = config.lockTime.toDate ? config.lockTime.toDate() : new Date(config.lockTime);
      return new Date() >= lockDate;
    }
    return false;
  };

  const savePick = async (categoryId, nomineeId) => {
    if (!user || !db || isLocked()) return;

    // Use ref to get latest picks, avoiding stale closure on rapid saves
    const newPicks = { ...picksRef.current, [categoryId]: nomineeId };
    setPicks(newPicks);
    picksRef.current = newPicks;
    setSaving(true);

    try {
      await setDoc(
        doc(db, 'ballots', user.uid),
        {
          userId: user.uid,
          picks: newPicks,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Error saving pick:', error);
    }
    setSaving(false);
  };

  const calculateScore = () => {
    let score = 0;
    for (const categoryId of Object.keys(winners)) {
      if (picks[categoryId] === winners[categoryId]) {
        score++;
      }
    }
    return score;
  };

  const value = {
    picks,
    loading,
    saving,
    savePick,
    isLocked: isLocked(),
    config,
    winners,
    nominees,
    categories: nominees.categories,
    score: calculateScore(),
    totalCategories: nominees.categories.length,
    completedCategories: Object.keys(picks).length,
  };

  return (
    <BallotContext.Provider value={value}>
      {children}
    </BallotContext.Provider>
  );
}

export function useBallot() {
  const context = useContext(BallotContext);
  if (!context) {
    throw new Error('useBallot must be used within a BallotProvider');
  }
  return context;
}
