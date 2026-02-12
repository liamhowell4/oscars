import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBallot } from '../contexts/BallotContext';
import GoogleSignIn from '../components/auth/GoogleSignIn';
import ArtDecoFrame from '../components/layout/ArtDecoFrame';
import { formatTimeRemaining } from '../lib/scoring';

const features = [
  {
    title: 'Make Your Picks',
    desc: 'Pick winners across all 23 categories and lock in your predictions before the ceremony begins.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
  },
  {
    title: 'Join Groups',
    desc: 'Create or join private groups and compete with friends to see who knows the Academy best.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
  {
    title: 'Live Scoring',
    desc: 'Watch your score update in real-time as winners are announced during the ceremony.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
];

function UnauthenticatedHome() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      {/* Hero */}
      <div className="animate-fade-in-up">
        <ArtDecoFrame className="mb-16">
          <div className="py-4">
            {/* Decorative top accent */}
            <div className="deco-divider mb-6">
              <span className="text-gold/60 text-xs">★</span>
            </div>

            <p className="text-gold/70 uppercase tracking-[0.4em] text-xs font-body mb-4">
              98th Academy Awards
            </p>
            <h1 className="text-gold-shimmer font-display text-5xl md:text-7xl font-bold mb-3 leading-tight">
              Oscar Ballot
            </h1>
            <p className="text-cream/40 text-lg font-body font-light tracking-wide mb-10">
              March 2, 2026
            </p>

            <div className="flex justify-center">
              <GoogleSignIn />
            </div>
          </div>
        </ArtDecoFrame>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature, i) => (
          <div
            key={feature.title}
            className={`card-deco text-center group animate-fade-in-up delay-${i + 1}`}
          >
            <div className="w-12 h-12 mx-auto mb-4 border border-gold/30 rotate-45 flex items-center justify-center group-hover:border-gold/60 transition-colors duration-300">
              <div className="-rotate-45 text-gold">
                {feature.icon}
              </div>
            </div>
            <h3 className="text-gold font-display text-lg mb-2">{feature.title}</h3>
            <p className="text-cream/40 text-sm font-body leading-relaxed">
              {feature.desc}
            </p>
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

  const progressPercent =
    totalCategories > 0
      ? Math.round((completedCategories / totalCategories) * 100)
      : 0;

  const firstName = user.displayName?.split(' ')[0] || 'Oscar Fan';

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Welcome */}
      <div className="animate-fade-in-up mb-10">
        <p className="text-gold/50 uppercase tracking-[0.3em] text-xs font-body mb-2">Welcome back</p>
        <h1 className="text-gold-gradient font-display text-3xl md:text-4xl font-bold">
          {firstName}
        </h1>
      </div>

      {/* Dashboard cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
        {/* Ballot Progress */}
        <div className="card-deco animate-fade-in-up delay-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-gold/80 font-display text-lg">Your Ballot</h2>
            <span className="text-cream/30 text-xs font-body">
              {progressPercent}%
            </span>
          </div>
          <p className="text-cream/50 text-sm font-body mb-4">
            {completedCategories} of {totalCategories} picks made
          </p>
          <div className="w-full bg-black/80 h-1.5 rounded-full border border-gold/15 mb-5">
            <div
              className="bg-gradient-to-r from-gold-dark to-gold h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <Link to="/ballot" className="btn-gold inline-block text-xs text-center">
            {completedCategories === 0 ? 'Start Picking' : 'Edit Ballot'}
          </Link>
        </div>

        {/* Score Card */}
        {config?.ceremonyStarted && (
          <div className="card-deco animate-fade-in-up delay-2">
            <h2 className="text-gold/80 font-display text-lg mb-4">Your Score</h2>
            <p className="text-gold-shimmer font-display text-5xl font-bold mb-1">
              {score}
            </p>
            <p className="text-cream/30 text-sm font-body">
              of {totalCategories} · {Object.keys(winners).length} announced
            </p>
          </div>
        )}

        {/* Countdown Card */}
        {hasLockTime && (
          <div className="card-deco animate-fade-in-up delay-3">
            <h2 className="text-gold/80 font-display text-lg mb-4">
              Ballots Lock In
            </h2>
            <p className="text-gold-gradient font-display text-3xl font-bold">
              {countdown}
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="animate-fade-in-up delay-4">
        <ArtDecoFrame>
          <h2 className="text-gold/80 font-display text-lg mb-5">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Link to="/ballot" className="btn-gold inline-block text-xs">
              Edit Ballot
            </Link>
            <Link to="/leaderboard" className="btn-outline inline-block text-xs">
              Leaderboard
            </Link>
            <Link to="/films" className="btn-outline inline-block text-xs">
              Films
            </Link>
          </div>
        </ArtDecoFrame>
      </div>
    </div>
  );
}

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 border border-gold/30 border-t-gold rotate-45 animate-spin" />
        <p className="text-cream/30 font-body text-sm uppercase tracking-widest">Loading</p>
      </div>
    );
  }

  return user ? <AuthenticatedHome /> : <UnauthenticatedHome />;
}
