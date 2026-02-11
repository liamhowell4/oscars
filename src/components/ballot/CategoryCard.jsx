import NomineeCard from './NomineeCard';

export default function CategoryCard({ category, selectedPick, winner, onSelect, disabled }) {
  return (
    <div className="card-deco animate-scale-in">
      {/* Category header */}
      <div className="text-center mb-8">
        <div className="deco-divider mb-4">
          <span className="text-gold/50 text-[10px] uppercase tracking-[0.3em] font-body">Category</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-display text-gold-gradient leading-tight">
          {category.name}
        </h2>
      </div>

      {/* Nominees grid */}
      <div className="grid gap-2">
        {category.nominees.map((nominee, i) => (
          <div key={nominee.id} className={`animate-fade-in-up delay-${Math.min(i, 5)}`}>
            <NomineeCard
              nominee={nominee}
              isSelected={selectedPick === nominee.id}
              isWinner={winner === nominee.id}
              onSelect={onSelect}
              disabled={disabled}
            />
          </div>
        ))}
      </div>

      {/* Lock indicator */}
      {disabled && (
        <div className="mt-6 text-center">
          <span className="inline-flex items-center gap-2 text-cream/30 text-xs uppercase tracking-widest">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
            Ballot locked
          </span>
        </div>
      )}
    </div>
  );
}
