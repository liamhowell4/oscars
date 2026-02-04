export default function NomineeCard({ nominee, isSelected, isWinner, onSelect, disabled }) {
  return (
    <button
      onClick={() => !disabled && onSelect(nominee.id)}
      disabled={disabled}
      className={`
        w-full p-4 text-left transition-all duration-300 border
        ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}
        ${isSelected
          ? 'nominee-selected border-gold-light'
          : 'border-cream/20 hover:border-gold/50'
        }
        ${isWinner ? 'ring-2 ring-gold-light' : ''}
      `}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className={`font-display text-lg ${isSelected ? 'text-gold-light' : 'text-cream'}`}>
            {nominee.title}
          </h3>
          <p className="text-cream/60 text-sm mt-1">{nominee.info}</p>
        </div>

        {/* Selection indicator */}
        <div className={`
          w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
          transition-all duration-300
          ${isSelected
            ? 'border-gold-light bg-gold'
            : 'border-cream/30'
          }
        `}>
          {isSelected && (
            <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>

      {/* Winner badge */}
      {isWinner && (
        <div className="mt-3 inline-flex items-center gap-1 text-gold-light text-sm">
          <span>★</span>
          <span className="uppercase tracking-wider text-xs">Winner</span>
        </div>
      )}
    </button>
  );
}
