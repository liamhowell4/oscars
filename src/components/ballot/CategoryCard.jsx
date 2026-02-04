import NomineeCard from './NomineeCard';

export default function CategoryCard({ category, selectedPick, winner, onSelect, disabled }) {
  return (
    <div className="card-deco">
      {/* Category header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 mb-2">
          <span className="text-gold">★</span>
          <span className="text-gold/50 text-xs uppercase tracking-widest">Category</span>
          <span className="text-gold">★</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-display text-gold-gradient">
          {category.name}
        </h2>
      </div>

      {/* Nominees grid */}
      <div className="grid gap-3">
        {category.nominees.map((nominee) => (
          <NomineeCard
            key={nominee.id}
            nominee={nominee}
            isSelected={selectedPick === nominee.id}
            isWinner={winner === nominee.id}
            onSelect={onSelect}
            disabled={disabled}
          />
        ))}
      </div>

      {/* Lock indicator */}
      {disabled && (
        <div className="mt-6 text-center">
          <span className="inline-flex items-center gap-2 text-cream/50 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            Ballot locked
          </span>
        </div>
      )}
    </div>
  );
}
