export default function NomineeCard({ nominee, isSelected, isWinner, onSelect, disabled }) {
  return (
    <button
      onClick={() => !disabled && onSelect(nominee.id)}
      disabled={disabled}
      className={`
        group w-full p-4 text-left transition-all duration-300 border rounded-lg relative overflow-hidden
        ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
        ${isSelected
          ? 'nominee-selected border-gold'
          : 'border-cream/10 hover:border-gold/40 hover:bg-white/[0.02]'
        }
        ${isWinner ? 'ring-1 ring-gold-light ring-offset-1 ring-offset-black' : ''}
      `}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className={`font-display text-lg leading-snug transition-colors duration-300 ${
              isSelected ? 'text-gold-light' : 'text-cream/90 group-hover:text-cream'
            }`}>
              {nominee.title}
            </h3>
            <p className={`text-sm mt-1 transition-colors duration-300 ${
              isSelected ? 'text-cream/50' : 'text-cream/35 group-hover:text-cream/45'
            }`}>
              {nominee.info}
            </p>
          </div>

          {/* Selection checkmark */}
          {isSelected && !isWinner && (
            <div className="w-5 h-5 border border-gold bg-gold/20 rounded flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-gold-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>

        {/* Winner badge */}
        {isWinner && (
          <div className="mt-3 inline-flex items-center gap-1.5 text-gold-light">
            <span className="text-xs">★</span>
            <span className="uppercase tracking-[0.2em] text-[10px] font-body font-semibold">Winner</span>
          </div>
        )}
      </div>
    </button>
  );
}
