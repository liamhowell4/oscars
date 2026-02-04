export default function ArtDecoFrame({ children, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-gold" />
      <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-gold" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-gold" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-gold" />

      {/* Inner content with padding to account for corners */}
      <div className="px-6 py-4">
        {children}
      </div>
    </div>
  );
}
