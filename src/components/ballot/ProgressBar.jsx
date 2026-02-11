export default function ProgressBar({ current, total, categories, picks }) {
  const pickCount = Object.keys(picks).length;

  return (
    <div className="mb-8">
      {/* Progress text */}
      <div className="flex justify-between items-baseline mb-3">
        <div className="flex items-center gap-2">
          <span className="text-gold font-display text-lg">{current + 1}</span>
          <span className="text-cream/25 text-xs font-body">/</span>
          <span className="text-cream/30 text-sm font-body">{total}</span>
        </div>
        <span className="text-cream/40 text-xs font-body uppercase tracking-wider">
          {pickCount} of {total} picked
        </span>
      </div>

      {/* Progress segments */}
      <div className="flex gap-[3px]">
        {categories.map((category, index) => {
          const isPicked = !!picks[category.id];
          const isCurrent = index === current;

          return (
            <div
              key={category.id}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                isPicked
                  ? 'bg-gold shadow-[0_0_6px_rgba(212,175,55,0.3)]'
                  : isCurrent
                  ? 'bg-gold/40'
                  : 'bg-cream/8'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
