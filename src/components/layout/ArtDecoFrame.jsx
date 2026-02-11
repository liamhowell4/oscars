export default function ArtDecoFrame({ children, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      {/* Outer corner brackets */}
      <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-gold/70" />
      <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-gold/70" />
      <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-gold/70" />
      <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-gold/70" />

      {/* Inner border line */}
      <div className="absolute top-2 left-2 right-2 bottom-2 border border-gold/15 pointer-events-none" />

      {/* Content */}
      <div className="px-8 py-6">
        {children}
      </div>
    </div>
  );
}
