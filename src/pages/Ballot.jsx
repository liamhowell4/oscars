import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBallot } from '../contexts/BallotContext';
import CategoryCard from '../components/ballot/CategoryCard';
import ProgressBar from '../components/ballot/ProgressBar';
import ArtDecoFrame from '../components/layout/ArtDecoFrame';
import { formatTimeRemaining, getScoreBreakdown } from '../lib/scoring';

export default function Ballot() {
  const {
    picks,
    loading,
    saving,
    savePick,
    isLocked,
    config,
    winners,
    categories,
    score,
    totalCategories,
    completedCategories,
  } = useBallot();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [timerTick, setTimerTick] = useState(0);

  // Tick every 60s to refresh countdown display
  useEffect(() => {
    if (!config.lockTime || isLocked) return;
    const interval = setInterval(() => setTimerTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, [config.lockTime, isLocked]);

  // Derive countdown string from current state (no sync setState needed)
  const timeRemaining = (() => {
    void timerTick; // read to establish dependency
    if (!config.lockTime || isLocked) return '';
    const lockDate = config.lockTime.toDate
      ? config.lockTime.toDate()
      : new Date(config.lockTime);
    return formatTimeRemaining(lockDate);
  })();

  // Keyboard navigation
  useEffect(() => {
    if (showReview) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => {
          const currentCat = categories[prev];
          if (!picks[currentCat?.id]) return prev;
          return Math.min(categories.length - 1, prev + 1);
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showReview, categories.length]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border border-gold/30 border-t-gold rotate-45 animate-spin mb-4" />
        <p className="text-cream/30 text-sm font-body uppercase tracking-widest">Loading your ballot</p>
      </div>
    );
  }

  if (showReview) {
    const breakdown = getScoreBreakdown(picks, winners, categories);
    const correctCount = breakdown.filter((b) => b.correct).length;
    const announcedCount = breakdown.filter((b) => b.announced).length;

    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 animate-fade-in-up">
          <div>
            <p className="text-gold/50 uppercase tracking-[0.3em] text-[10px] font-body mb-1">Review</p>
            <h1 className="text-3xl md:text-4xl font-display text-gold-gradient">
              Your Picks
            </h1>
          </div>
          <button
            onClick={() => setShowReview(false)}
            className="btn-outline px-4 py-2 text-xs"
          >
            Back to Editing
          </button>
        </div>

        {/* Score summary */}
        {config.ceremonyStarted && (
          <div className="animate-fade-in-up delay-1">
            <ArtDecoFrame className="mb-8">
              <div className="text-center">
                <p className="text-cream/40 text-xs uppercase tracking-[0.3em] font-body mb-2">Your Score</p>
                <p className="text-5xl font-display text-gold-shimmer">
                  {score} / {totalCategories}
                </p>
                <p className="text-cream/30 text-sm mt-2 font-body">
                  {correctCount} correct out of {announcedCount} announced
                </p>
              </div>
            </ArtDecoFrame>
          </div>
        )}

        {/* Completion summary */}
        <div className="mb-6 text-center animate-fade-in">
          <p className="text-cream/40 text-sm font-body">
            {completedCategories} of {totalCategories} categories picked
          </p>
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((category, index) => {
            const picked = picks[category.id];
            const winner = winners[category.id];
            const pickedNominee = picked
              ? category.nominees.find((n) => n.id === picked)
              : null;
            const isCorrect = picked && winner && picked === winner;
            const isWrong = picked && winner && picked !== winner;
            const noPick = !picked;

            return (
              <button
                key={category.id}
                onClick={() => {
                  setTimeout(() => {
                    setCurrentIndex(index);
                    setShowReview(false);
                  }, 100);
                }}
                className={`card-deco text-left transition-all cursor-pointer hover:border-gold/50 active:scale-[0.98] group ${
                  noPick ? 'border-red-500/30' : ''
                } animate-fade-in-up`}
                style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
              >
                <h3 className="font-display text-gold/70 text-xs mb-2 uppercase tracking-wider group-hover:text-gold transition-colors">
                  {category.name}
                </h3>

                {pickedNominee ? (
                  <p className="text-cream/80 text-sm font-body">{pickedNominee.title}</p>
                ) : (
                  <p className="text-red-400/70 text-sm italic font-body">No pick yet</p>
                )}

                {winner && (
                  <div className="mt-2">
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-green-400/80">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Correct
                      </span>
                    ) : isWrong ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-red-400/70">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Incorrect
                      </span>
                    ) : null}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Back to home link */}
        <div className="mt-10 text-center">
          <Link to="/" className="text-gold/50 hover:text-gold transition-colors text-xs uppercase tracking-widest font-body">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Category stepper view
  const currentCategory = categories[currentIndex];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Progress bar */}
      <ProgressBar
        current={currentIndex}
        total={categories.length}
        categories={categories}
        picks={picks}
      />

      {/* Lock banner */}
      {isLocked && (
        <div className="mb-6 bg-gold/5 border border-gold/20 rounded-lg px-4 py-3 text-center animate-slide-down">
          <p className="text-gold/70 text-xs tracking-[0.15em] uppercase font-body">
            Ballots are locked — picks can no longer be changed
          </p>
        </div>
      )}

      {/* Countdown timer */}
      {config.lockTime && !isLocked && timeRemaining && (
        <div className="mb-6 text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 border border-gold/15 rounded-md px-4 py-2">
            <svg className="w-3.5 h-3.5 text-gold/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-cream/50 text-xs font-body tracking-wider">{timeRemaining}</span>
          </div>
        </div>
      )}

      {/* Category card */}
      {currentCategory && (
        <CategoryCard
          key={currentCategory.id}
          category={currentCategory}
          selectedPick={picks[currentCategory.id]}
          winner={winners[currentCategory.id]}
          onSelect={(nomineeId) => {
            savePick(currentCategory.id, nomineeId);
            // Auto-advance on any click
            if (!isLocked) {
              setTimeout(() => {
                if (currentIndex < categories.length - 1) {
                  setCurrentIndex((prev) => prev + 1);
                } else {
                  setShowReview(true);
                }
              }, 300);
            }
          }}
          disabled={isLocked}
        />
      )}

      {/* Navigation buttons */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex gap-3">
          <button
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="btn-outline px-5 py-2 text-xs disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-gold"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentIndex((prev) => Math.min(categories.length - 1, prev + 1))}
            disabled={currentIndex === categories.length - 1 || !picks[currentCategory?.id]}
            className="btn-gold px-5 py-2 text-xs disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
          >
            Next
          </button>
        </div>
        <button
          onClick={() => setShowReview(true)}
          className="btn-outline px-5 py-2 text-xs"
        >
          Review All Picks
        </button>
      </div>

      {/* Keyboard hint */}
      <p className="mt-8 text-center text-cream/15 text-[11px] font-body tracking-wider">
        Use arrow keys to navigate
      </p>
    </div>
  );
}
