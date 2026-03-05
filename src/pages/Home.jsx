import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBallot } from '../contexts/BallotContext';
import GoogleSignIn from '../components/auth/GoogleSignIn';
import { formatTimeRemaining } from '../lib/scoring';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

const features = [
  {
    title: 'Make Your Picks',
    desc: 'Pick winners across all 23 categories and lock in your predictions before the ceremony begins.',
  },
  {
    title: 'Join Groups',
    desc: 'Create or join private groups and compete with friends to see who knows the Academy best.',
  },
  {
    title: 'Live Scoring',
    desc: 'Watch your score update in real-time as winners are announced during the ceremony.',
  },
];

function UnauthenticatedHome() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-20">
      {/* Hero */}
      <div className="animate-fade-in-up text-center mb-20">
        <div className="deco-divider mb-8">
          <span className="text-gold/80 text-xs uppercase tracking-[0.4em] font-body shrink-0">
            98th Academy Awards
          </span>
        </div>
        <h1 className="font-display italic font-normal text-6xl md:text-8xl text-gold leading-none mb-4">
          Oscar Ballot
        </h1>
        <p className="text-cream/70 text-sm font-body tracking-[0.35em] uppercase mb-12">
          March 2, 2026
        </p>
        <div className="flex justify-center">
          <GoogleSignIn />
        </div>
      </div>

      {/* Feature rows */}
      <div>
        {features.map((feature, i) => (
          <div
            key={feature.title}
            className={`flex items-start gap-8 py-7 border-b border-gold/15 animate-fade-in-up delay-${i + 1}`}
          >
            <span className="font-display italic text-gold/55 text-3xl leading-none shrink-0 w-7 text-right pt-0.5">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div>
              <h3 className="font-display text-lg text-cream mb-1.5 leading-snug">{feature.title}</h3>
              <p className="text-cream/70 text-sm font-body leading-relaxed">{feature.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuthenticatedHome() {
  const { user } = useAuth();
  const {
    isLocked,
    config,
    winners,
    score,
    totalCategories,
    completedCategories,
  } = useBallot();

  const [countdown, setCountdown] = useState('');
  const [communityStats, setCommunityStats] = useState({ total: 0, complete: 0 });

  const hasLockTime = config?.lockTime && !isLocked;

  useEffect(() => {
    if (!hasLockTime) return;

    function updateCountdown() {
      const lockDate = config.lockTime.toDate
        ? config.lockTime.toDate()
        : new Date(config.lockTime);
      setCountdown(formatTimeRemaining(lockDate));
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [hasLockTime, config?.lockTime]);

  useEffect(() => {
    if (!db) return;
    getDocs(collection(db, 'users')).then((snap) => {
      let total = 0;
      let complete = 0;
      snap.forEach((d) => {
        total++;
        if (d.data().ballotComplete) complete++;
      });
      setCommunityStats({ total, complete });
    }).catch(() => {});
  }, []);

  const progressPercent =
    totalCategories > 0
      ? Math.round((completedCategories / totalCategories) * 100)
      : 0;

  const firstName = user.displayName?.split(' ')[0] || 'Oscar Fan';

  return (
    <div className="max-w-xl mx-auto px-6 py-12">
      {/* Welcome */}
      <div className="animate-fade-in-up mb-12">
        <p className="text-gold/75 uppercase tracking-[0.35em] text-xs font-body font-medium mb-1">
          Welcome back
        </p>
        <h1 className="font-display italic font-normal text-5xl md:text-6xl text-cream leading-none">
          {firstName}
        </h1>
      </div>

      {/* Stats — ruled rows */}
      <div className="mb-12 animate-fade-in-up delay-1">
        {/* Picks progress */}
        <div className="flex justify-between items-center py-4 border-b border-cream/10">
          <span className="text-cream/65 text-xs font-body font-medium uppercase tracking-widest">
            Picks Made
          </span>
          <span className="font-display italic text-2xl text-gold leading-none">
            {completedCategories}
            <span className="text-cream/55 text-sm font-body not-italic"> / {totalCategories}</span>
          </span>
        </div>

        {/* Progress bar */}
        <div className="py-4 border-b border-cream/10">
          <div className="w-full bg-cream/10 h-[3px]">
            <div
              className="bg-gold h-[3px] transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Score (post-ceremony) */}
        {config?.ceremonyStarted && (
          <div className="flex justify-between items-center py-4 border-b border-cream/10">
            <span className="text-cream/65 text-xs font-body font-medium uppercase tracking-widest">
              Your Score
            </span>
            <span className="font-display italic text-2xl text-gold leading-none">
              {score}
              <span className="text-cream/55 text-sm font-body not-italic">
                {' '}/ {Object.keys(winners).length} announced
              </span>
            </span>
          </div>
        )}

        {/* Countdown */}
        {hasLockTime && (
          <div className="flex justify-between items-center py-4 border-b border-cream/10">
            <span className="text-cream/65 text-xs font-body font-medium uppercase tracking-widest">
              Locks In
            </span>
            <span className="font-display italic text-xl text-gold leading-none">
              {countdown}
            </span>
          </div>
        )}

        {/* Community */}
        {communityStats.total > 0 && (
          <div className="flex justify-between items-center py-4 border-b border-cream/10">
            <span className="text-cream/65 text-xs font-body font-medium uppercase tracking-widest">
              Community
            </span>
            <span className="font-display italic text-2xl text-gold leading-none">
              {communityStats.complete}
              <span className="text-cream/55 text-sm font-body not-italic"> of {communityStats.total}</span>
            </span>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="animate-fade-in-up delay-3">
        <p className="text-cream/60 text-xs font-body font-medium uppercase tracking-[0.35em] mb-5">
          Quick Actions
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/ballot" className="btn-gold">
            {completedCategories === 0 ? 'Start Picking' : 'Edit Ballot'}
          </Link>
          <Link to="/leaderboard" className="btn-outline">
            Leaderboard
          </Link>
          <Link to="/films" className="btn-outline">
            Films
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-3">
        <div className="w-6 h-6 border border-gold/30 border-t-gold animate-spin" />
        <p className="text-cream/55 font-body text-xs uppercase tracking-widest">Loading</p>
      </div>
    );
  }

  return user ? <AuthenticatedHome /> : <UnauthenticatedHome />;
}
