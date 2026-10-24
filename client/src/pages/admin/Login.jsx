import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth.jsx';
import { api } from '../../api/client.js';

export default function Login() {
  const { login, changePassword } = useAuth();
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // First-login password change state
  const [mustChange, setMustChange] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [newPass2, setNewPass2] = useState('');

  // Forgot-password state
  const [forgot, setForgot] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  async function submit(e) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const user = await login(loginId, password);
      if (user.mustChangePassword) { setMustChange(true); }
      else navigate('/admin');
    } catch { setError('Invalid credentials'); }
    finally { setBusy(false); }
  }

  async function doChange(e) {
    e.preventDefault(); setError('');
    if (newPass.length < 6) return setError('Password must be at least 6 characters');
    if (newPass !== newPass2) return setError('Passwords do not match');
    setBusy(true);
    try { await changePassword(password, newPass); navigate('/admin'); }
    catch (err) { setError(err.response?.data?.error || 'Could not change password'); }
    finally { setBusy(false); }
  }

  async function doForgot(e) {
    e.preventDefault(); setBusy(true);
    try { await api.post('/auth/forgot', { login: loginId }); setForgotSent(true); }
    catch { setForgotSent(true); } // always succeed (don't reveal accounts)
    finally { setBusy(false); }
  }

  const inp = "w-full px-4 py-2.5 rounded-full border text-sm outline-none";
  const st = { borderColor: 'var(--line)' };

  // ── First-login: set a new password ──
  if (mustChange) {
    return (
      <div className="max-w-sm mx-auto glass-card p-8 mt-10 fade-up" style={{ borderRadius: 24 }}>
        <h1 className="font-serif font-bold text-ink text-xl mb-1">Set your password</h1>
        <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>For security, choose a new password before continuing.</p>
        <form onSubmit={doChange} className="space-y-4">
          <input type="password" className={inp} style={st} value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="New password" />
          <input type="password" className={inp} style={st} value={newPass2} onChange={e => setNewPass2(e.target.value)} placeholder="Confirm new password" />
          {error && <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>}
          <button disabled={busy} className="pill-btn pill-btn-primary w-full text-sm">{busy ? 'Saving…' : 'Save & continue'}</button>
        </form>
      </div>
    );
  }

  // ── Forgot password ──
  if (forgot) {
    return (
      <div className="max-w-sm mx-auto glass-card p-8 mt-10 fade-up" style={{ borderRadius: 24 }}>
        <h1 className="font-serif font-bold text-ink text-xl mb-1">Reset password</h1>
        {forgotSent ? (
          <p className="text-sm mt-3" style={{ color: 'var(--muted)' }}>
            If an account with an email exists for that login, a reset link has been sent. Users without an email should ask an admin to reset their password.
          </p>
        ) : (
          <form onSubmit={doForgot} className="space-y-4 mt-3">
            <input className={inp} style={st} value={loginId} onChange={e => setLoginId(e.target.value)} placeholder="Username or email" />
            <button disabled={busy} className="pill-btn pill-btn-primary w-full text-sm">{busy ? 'Sending…' : 'Send reset link'}</button>
          </form>
        )}
        <button onClick={() => { setForgot(false); setForgotSent(false); }} className="text-xs mt-4" style={{ color: 'var(--flame)', border: 'none', background: 'none', cursor: 'pointer' }}>← Back to login</button>
      </div>
    );
  }

  // ── Normal login ──
  return (
    <div className="max-w-sm mx-auto glass-card p-8 mt-10 fade-up" style={{ borderRadius: 24 }}>
      <h1 className="font-serif font-bold text-ink text-xl mb-5">Sign in</h1>
      <form onSubmit={submit} className="space-y-4">
        <input className={inp} style={st} value={loginId} onChange={e => setLoginId(e.target.value)} placeholder="Username or email" autoComplete="username" />
        <input type="password" className={inp} style={st} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" autoComplete="current-password" />
        {error && <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>}
        <button disabled={busy} className="pill-btn pill-btn-primary w-full text-sm">{busy ? 'Signing in…' : 'Login'}</button>
      </form>
      <button onClick={() => setForgot(true)} className="text-xs mt-4" style={{ color: 'var(--flame)', border: 'none', background: 'none', cursor: 'pointer' }}>Forgot password?</button>
    </div>
  );
}
