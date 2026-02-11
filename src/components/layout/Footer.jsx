export default function Footer() {
  return (
    <footer className="mt-auto pt-12 pb-8">
      {/* Decorative divider */}
      <div className="max-w-6xl mx-auto px-4 mb-8">
        <div className="deco-divider">
          <div className="w-1.5 h-1.5 bg-gold rotate-45 shrink-0" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-gold/60 text-xs">★</span>
            <span className="text-cream/35 text-xs uppercase tracking-[0.2em] font-body">
              98th Academy Awards
            </span>
            <span className="text-gold/30 text-xs">·</span>
            <span className="text-cream/35 text-xs font-body">
              March 2, 2026
            </span>
          </div>
          <p className="text-cream/20 text-[11px] tracking-wider font-body">
            Not affiliated with the Academy of Motion Picture Arts and Sciences
          </p>
        </div>
      </div>
    </footer>
  );
}
