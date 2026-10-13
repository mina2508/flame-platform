import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../lib/auth.jsx';

const links = [
  { to: '/', label: 'Home' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/activities', label: 'Activities' },
  { to: '/news', label: 'News' },
  { to: '/curriculum', label: 'Curriculum' },
  { to: '/birthdays', label: 'Birthdays' },
  { to: '/missions', label: 'Missions' },
  { to: '/map', label: 'Map' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const linkStyle = (active) => active
    ? { background: 'linear-gradient(135deg, var(--flame), var(--flame-deep))', color: '#fff' }
    : { color: 'var(--ink)' };

  return (
    <header
      className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between gap-3"
      style={{ width: 'min(1180px, calc(100% - 20px))' }}
    >
      {/* Brand */}
      <Link to="/" className="glass-card flex items-center gap-2 px-3 py-2 shrink-0" style={{ borderRadius: 14 }}>
        <span className="flame-logo-nav">
          <img src="/flame-logo.png" alt="FLAME" className="w-9 h-9 object-contain" />
        </span>
        <span className="font-serif font-bold hidden sm:inline" style={{ background: 'linear-gradient(135deg, var(--flame), var(--flame-deep))', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', letterSpacing: '0.02em' }}>FLAME</span>
      </Link>

      {/* Desktop links */}
      <nav className="glass-card hidden lg:flex items-center gap-1 px-2 py-1.5" style={{ borderRadius: 999 }}>
        {links.map((l) => (
          <Link key={l.to} to={l.to} className="px-3 py-1.5 rounded-full text-sm font-bold transition-all" style={linkStyle(pathname === l.to)}>
            {l.label}
          </Link>
        ))}
        {user ? (
          <>
            <Link to="/admin" className="px-3 py-1.5 rounded-full text-sm font-bold" style={{ color: 'var(--sky)' }}>Admin</Link>
            <button onClick={() => { logout(); navigate('/'); }} className="px-3 py-1.5 rounded-full text-sm font-bold" style={{ color: 'var(--danger)', border: 'none', background: 'none', cursor: 'pointer' }}>Logout</button>
          </>
        ) : (
          <Link to="/login" className="px-3 py-1.5 rounded-full text-sm font-bold" style={{ color: 'var(--sky)' }}>Admin Login</Link>
        )}
      </nav>

      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(!open)}
        className="glass-card lg:hidden grid place-items-center w-11 h-11 shrink-0"
        style={{ borderRadius: 14, border: '1px solid var(--line)', cursor: 'pointer' }}
        aria-label="Menu"
      >
        <span className="text-xl">{open ? '✕' : '☰'}</span>
      </button>

      {/* Mobile menu */}
      {open && (
        <nav className="glass-card lg:hidden absolute top-16 right-0 flex flex-col gap-1 p-3 w-56" style={{ borderRadius: 18 }}>
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="px-3 py-2 rounded-xl text-sm font-bold" style={linkStyle(pathname === l.to)}>
              {l.label}
            </Link>
          ))}
          <div className="h-px my-1" style={{ background: 'var(--line)' }} />
          {user ? (
            <>
              <Link to="/admin" onClick={() => setOpen(false)} className="px-3 py-2 rounded-xl text-sm font-bold" style={{ color: 'var(--sky)' }}>Admin</Link>
              <button onClick={() => { logout(); navigate('/'); setOpen(false); }} className="px-3 py-2 rounded-xl text-sm font-bold text-left" style={{ color: 'var(--danger)', border: 'none', background: 'none', cursor: 'pointer' }}>Logout</button>
            </>
          ) : (
            <Link to="/login" onClick={() => setOpen(false)} className="px-3 py-2 rounded-xl text-sm font-bold" style={{ color: 'var(--sky)' }}>Admin Login</Link>
          )}
        </nav>
      )}
    </header>
  );
}
