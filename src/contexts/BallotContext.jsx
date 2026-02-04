import { createContext, useContext, useEffect, useState } from 'react';
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import nominees from '../data/nominees2026.json';

const BallotContext = createContext(null);

export function BallotProvider({ children }) {
  const { user } = useAuth();
  const [picks, setPicks] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    lockTime: null,
    isLocked: false,
    ceremonyStarted: false,
  });
  const [winners, setWinners] = useState({});
  const [ballotId, setBallotId] = useState(null);

  // Listen to config changes
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'config', 'ceremony'), (snapshot) => {
      if (snapshot.exists()) {
        setConfig(snapshot.data());
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to winners changes
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'config', 'winners'), (snapshot) => {
      if (snapshot.exists()) {
        setWinners(snapshot.data());
      }
    });
    return () => unsubscribe();
  }, []);

  // Load user's ballot
  useEffect(() => {
    if (!user) {
      setPicks({});
      setBallotId(null);
      setLoading(false);
      return;
    }

    const loadBallot = async () => {
      setLoading(true);
      try {
        const ballotsRef = collection(db, 'ballots');
        const q = query(ballotsRef, where('userId', '==', user.uid));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const ballotDoc = snapshot.docs[0];
          setBallotId(ballotDoc.id);
          setPicks(ballotDoc.data().picks || {});
        } else {
          setPicks({});
          setBallotId(null);
        }
      } catch (error) {
        console.error('Error loading ballot:', error);
      }
      setLoading(false);
    };

    loadBallot();
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
    if (!user || isLocked()) return;

    setSaving(true);
    const newPicks = { ...picks, [categoryId]: nomineeId };
    setPicks(newPicks);

    try {
      if (ballotId) {
        // Update existing ballot
        await setDoc(doc(db, 'ballots', ballotId), {
          userId: user.uid,
          picks: newPicks,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } else {
        // Create new ballot
        const newBallotRef = doc(collection(db, 'ballots'));
        await setDoc(newBallotRef, {
          userId: user.uid,
          picks: newPicks,
          score: 0,
          updatedAt: serverTimestamp(),
        });
        setBallotId(newBallotRef.id);
      }
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
