import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';

const ROLES = ['admin', 'content_editor', 'reviewer', 'form_manager'];
const ROLE_LABELS = {
  admin: 'Admin (full access + manage users)',
  content_editor: 'Content Editor (edit content)',
  reviewer: 'Reviewer (review applications)',
  form_manager: 'Form Manager (edit application form)',
};

export default function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', roles: ['reviewer'] });

  async function load() { setUsers((await api.get('/users')).data); }
  useEffect(() => { load(); }, []);

  function toggleRole(r) {
    setForm(f => ({
      ...f,
      roles: f.roles.includes(r) ? f.roles.filter(x => x !== r) : [...f.roles, r],
    }));
  }

  async function add(e) {
    e.preventDefault();
    if (form.roles.length === 0) return alert('Select at least one role');
    try {
      await api.post('/users', form);
      setForm({ name: '', email: '', password: '', roles: ['reviewer'] });
      load();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  }

  async function toggleUserRole(user, r) {
    const roles = user.roles.includes(r) ? user.roles.filter(x => x !== r) : [...user.roles, r];
    if (roles.length === 0) return alert('User must have at least one role');
    await api.patch(`/users/${user.id}`, { roles });
    load();
  }

  async function remove(id) { if (confirm('Delete this user?')) { await api.delete(`/users/${id}`); load(); } }

  const inp = "border rounded-xl px-3 py-2 text-sm flex-1 min-w-[120px]";

  return (
    <div className="glass-card p-5 fade-up" style={{ borderRadius: 18 }}>
      <h2 className="font-serif text-lg text-ink mb-1">Users & Roles</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>A user can hold multiple roles. Only admins can manage users.</p>

      <form onSubmit={add} className="p-4 rounded-2xl mb-4 space-y-3" style={{ background: '#fffaf4', border: '1px solid var(--line)' }}>
        <div className="flex gap-2 flex-wrap">
          <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inp} style={{ borderColor: 'var(--line)' }} required />
          <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inp} style={{ borderColor: 'var(--line)' }} required />
          <input placeholder="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className={inp} style={{ borderColor: 'var(--line)' }} required />
        </div>
        <div className="flex flex-wrap gap-2">
          {ROLES.map(r => (
            <button key={r} type="button" onClick={() => toggleRole(r)}
              className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              style={form.roles.includes(r)
                ? { background: 'linear-gradient(135deg, var(--flame), var(--flame-deep))', color: '#fff', border: 'none', cursor: 'pointer' }
                : { background: '#fff', color: 'var(--muted)', border: '1px solid var(--line)', cursor: 'pointer' }}>
              {form.roles.includes(r) ? '✓ ' : ''}{ROLE_LABELS[r]}
            </button>
          ))}
        </div>
        <button className="pill-btn pill-btn-primary text-sm">+ Add User</button>
      </form>

      <div className="space-y-2">
        {users.map(u => (
          <div key={u.id} className="rounded-xl border p-3 bg-white" style={{ borderColor: 'var(--line)' }}>
            <div className="flex justify-between items-start gap-2 flex-wrap">
              <div>
                <strong className="text-ink">{u.name}</strong>
                <span className="text-sm ml-2" style={{ color: 'var(--muted)' }}>{u.email}</span>
              </div>
              <button onClick={() => remove(u.id)} className="text-xs font-bold" style={{ color: 'var(--danger)', border: 'none', background: 'none', cursor: 'pointer' }}>✕ Delete</button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {ROLES.map(r => (
                <button key={r} type="button" onClick={() => toggleUserRole(u, r)}
                  className="px-2.5 py-1 rounded-full text-xs font-bold transition-all"
                  style={u.roles.includes(r)
                    ? { background: 'rgba(39,149,106,0.12)', color: 'var(--good)', border: 'none', cursor: 'pointer' }
                    : { background: '#f7efe5', color: 'var(--muted)', border: 'none', cursor: 'pointer' }}>
                  {u.roles.includes(r) ? '✓ ' : '+ '}{r}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
