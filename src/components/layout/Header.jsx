import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Header() {
  const { user, userData, logout } = useAuth();
  const location = useLocation();

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/ballot', label: 'Ballot' },
    { path: '/leaderboard', label: 'Leaderboard' },
    { path: '/groups', label: 'Groups' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="border-b border-gold/30 bg-black/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 border-2 border-gold flex items-center justify-center">
              <span className="text-gold-light text-xl font-display">★</span>
            </div>
            <h1 className="text-2xl font-display text-gold-gradient tracking-wide">
              Oscar Ballot
            </h1>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm uppercase tracking-widest transition-colors ${
                  isActive(link.path)
                    ? 'text-gold-light'
                    : 'text-cream/70 hover:text-cream'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {userData?.isAdmin && (
              <Link
                to="/admin"
                className={`text-sm uppercase tracking-widest transition-colors ${
                  isActive('/admin')
                    ? 'text-gold-light'
                    : 'text-cream/70 hover:text-cream'
                }`}
              >
                Admin
              </Link>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-8 h-8 rounded-full border border-gold/50"
                  />
                )}
                <span className="hidden sm:block text-cream/80 text-sm">
                  {user.displayName?.split(' ')[0]}
                </span>
                <button
                  onClick={logout}
                  className="text-xs uppercase tracking-wider text-cream/50 hover:text-cream transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link to="/" className="btn-gold text-sm">
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden flex items-center gap-4 mt-4 pt-4 border-t border-gold/20">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-xs uppercase tracking-widest transition-colors ${
                isActive(link.path)
                  ? 'text-gold-light'
                  : 'text-cream/70 hover:text-cream'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
