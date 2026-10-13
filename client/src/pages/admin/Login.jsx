import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault(); setError('');
    try { await login(email, password); navigate('/admin'); }
    catch { setError('Invalid credentials'); }
  }

  return (
    <div className="max-w-sm mx-auto glass-card p-8 mt-10 fade-up" style={{ borderRadius: 24 }}>
      <h1 className="font-serif font-bold text-ink text-xl mb-5">Admin Login</h1>
      <form onSubmit={submit} className="space-y-4">
        <input className="w-full px-4 py-2.5 rounded-full border text-sm outline-none" style={{ borderColor: 'var(--line)' }}
          value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
        <input type="password" className="w-full px-4 py-2.5 rounded-full border text-sm outline-none" style={{ borderColor: 'var(--line)' }}
          value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
        {error && <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>}
        <button className="pill-btn pill-btn-primary w-full text-sm">Login</button>
      </form>
    </div>
  );
}
