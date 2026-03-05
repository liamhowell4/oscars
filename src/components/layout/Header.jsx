import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

const THEME_CYCLE = ['system', 'light', 'dark'];
const THEME_LABELS = { system: 'Auto', light: 'Light', dark: 'Dark' };
const THEME_ICONS = { system: <MonitorIcon />, light: <SunIcon />, dark: <MoonIcon /> };

export default function Header() {
  const { user, userData, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system');

  useEffect(() => {
    if (theme === 'system') {
      localStorage.removeItem('theme');
      document.documentElement.removeAttribute('data-theme');
    } else {
      localStorage.setItem('theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  const cycleTheme = () => {
    setTheme((t) => {
      const next = THEME_CYCLE[(THEME_CYCLE.indexOf(t) + 1) % THEME_CYCLE.length];
      return next;
    });
  };

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/ballot', label: 'Ballot' },
    { path: '/films', label: 'Films' },
    { path: '/leaderboard', label: 'Leaderboard' },
    { path: '/groups', label: 'Groups' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="border-b border-cream/10 bg-black/98 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 border border-gold/50 flex items-center justify-center rotate-45 group-hover:border-gold transition-colors duration-300">
              <span className="text-gold text-xs -rotate-45 leading-none">★</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-display italic text-gold tracking-wide leading-tight">
                Oscar Ballot
              </h1>
              <span className="text-[10px] uppercase tracking-[0.3em] text-cream/65 font-body">
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
                className={`relative px-4 py-2 text-xs uppercase tracking-[0.15em] transition-colors duration-300 ${
                  isActive(link.path)
                    ? 'text-gold'
                    : 'text-cream/70 hover:text-cream'
                }`}
              >
                {link.label}
                {isActive(link.path) && (
                  <span className="absolute bottom-0 left-4 right-4 h-px bg-gold opacity-60" />
                )}
              </Link>
            ))}
            {userData?.isAdmin && (
              <Link
                to="/admin"
                className={`relative px-4 py-2 text-xs uppercase tracking-[0.15em] transition-colors duration-300 ${
                  isActive('/admin')
                    ? 'text-gold'
                    : 'text-cream/70 hover:text-cream'
                }`}
              >
                Admin
                {isActive('/admin') && (
                  <span className="absolute bottom-0 left-4 right-4 h-px bg-gold opacity-60" />
                )}
              </Link>
            )}
          </nav>

          {/* Right: theme toggle + user */}
          <div className="flex items-center gap-3">
            {/* Theme cycle toggle: auto → light → dark → auto */}
            <button
              onClick={cycleTheme}
              className="flex items-center gap-1.5 text-cream/65 hover:text-cream transition-colors duration-300 px-1.5 py-1"
              aria-label={`Theme: ${THEME_LABELS[theme]}`}
              title={`Theme: ${THEME_LABELS[theme]} — click to cycle`}
            >
              {THEME_ICONS[theme]}
              <span className="text-[10px] uppercase tracking-[0.18em] font-body hidden sm:block">
                {THEME_LABELS[theme]}
              </span>
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-7 h-7 border border-gold/25"
                    referrerPolicy="no-referrer"
                  />
                )}
                <span className="hidden sm:block text-cream/75 text-xs uppercase tracking-wider">
                  {user.displayName?.split(' ')[0]}
                </span>
                <button
                  onClick={logout}
                  className="text-xs uppercase tracking-wider text-cream/55 hover:text-cream/80 transition-colors duration-300 border-l border-cream/15 pl-3"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link to="/" className="btn-gold py-2 px-4">
                Sign In
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-cream/65 hover:text-cream transition-colors p-1"
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
          <nav className="md:hidden flex flex-col gap-1 mt-3 pt-3 border-t border-cream/10 animate-slide-down">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2 text-xs uppercase tracking-[0.15em] transition-colors ${
                  isActive(link.path)
                    ? 'text-gold bg-gold/5'
                    : 'text-cream/70 hover:text-cream'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {userData?.isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2 text-xs uppercase tracking-[0.15em] transition-colors ${
                  isActive('/admin')
                    ? 'text-gold bg-gold/5'
                    : 'text-cream/70 hover:text-cream'
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
