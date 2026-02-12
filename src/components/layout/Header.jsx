import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Header() {
  const { user, userData, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/ballot', label: 'Ballot' },
    { path: '/films', label: 'Films' },
    { path: '/leaderboard', label: 'Leaderboard' },
    { path: '/groups', label: 'Groups' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="border-b border-gold/20 bg-black/98 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 border border-gold/60 flex items-center justify-center rotate-45 group-hover:border-gold-light transition-colors duration-300">
              <span className="text-gold-light text-sm -rotate-45 leading-none">★</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-display text-gold-gradient tracking-wide leading-tight">
                Oscar Ballot
              </h1>
              <span className="text-[10px] uppercase tracking-[0.3em] text-cream/30 font-body">
                2026
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-4 py-2 text-xs uppercase tracking-[0.2em] transition-colors duration-300 ${
                  isActive(link.path)
                    ? 'text-gold-light'
                    : 'text-cream/50 hover:text-cream/90'
                }`}
              >
                {link.label}
                {isActive(link.path) && (
                  <span className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
                )}
              </Link>
            ))}
            {userData?.isAdmin && (
              <Link
                to="/admin"
                className={`relative px-4 py-2 text-xs uppercase tracking-[0.2em] transition-colors duration-300 ${
                  isActive('/admin')
                    ? 'text-gold-light'
                    : 'text-cream/50 hover:text-cream/90'
                }`}
              >
                Admin
                {isActive('/admin') && (
                  <span className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
                )}
              </Link>
            )}
          </nav>

          {/* User Menu + Mobile Toggle */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-8 h-8 rounded-full border border-gold/30 ring-1 ring-gold/10"
                    referrerPolicy="no-referrer"
                  />
                )}
                <span className="hidden sm:block text-cream/60 text-xs uppercase tracking-wider">
                  {user.displayName?.split(' ')[0]}
                </span>
                <button
                  onClick={logout}
                  className="text-[11px] uppercase tracking-wider text-cream/30 hover:text-cream/70 transition-colors duration-300 border-l border-cream/10 pl-3"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link to="/" className="btn-gold text-xs py-2 px-4">
                Sign In
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-cream/50 hover:text-cream transition-colors p-1"
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileOpen && (
          <nav className="md:hidden flex flex-col gap-1 mt-3 pt-3 border-t border-gold/10 animate-slide-down">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2 text-xs uppercase tracking-[0.2em] transition-colors ${
                  isActive(link.path)
                    ? 'text-gold-light bg-gold/5'
                    : 'text-cream/50 hover:text-cream/80'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {userData?.isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2 text-xs uppercase tracking-[0.2em] transition-colors ${
                  isActive('/admin')
                    ? 'text-gold-light bg-gold/5'
                    : 'text-cream/50 hover:text-cream/80'
                }`}
              >
                Admin
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
