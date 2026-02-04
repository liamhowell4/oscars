export default function ProgressBar({ current, total, categories, picks }) {
  return (
    <div className="mb-8">
      {/* Progress text */}
      <div className="flex justify-between text-sm mb-2">
        <span className="text-cream/70">
          Category {current + 1} of {total}
        </span>
        <span className="text-gold">
          {Object.keys(picks).length} / {total} picks made
        </span>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1">
        {categories.map((category, index) => (
          <div
            key={category.id}
            className={`h-2 flex-1 transition-all duration-300 ${
              picks[category.id]
                ? 'bg-gold'
                : index === current
                ? 'bg-gold/50'
                : 'bg-cream/20'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
