export default function Footer() {
  return (
    <footer className="border-t border-gold/20 bg-black py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-gold">★</span>
            <span className="text-cream/50 text-sm">
              98th Academy Awards • March 2, 2026
            </span>
          </div>
          <p className="text-cream/30 text-xs">
            Not affiliated with the Academy of Motion Picture Arts and Sciences
          </p>
        </div>
      </div>
    </footer>
  );
}
