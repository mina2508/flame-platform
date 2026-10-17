import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import Modal from './Modal.jsx';

const ROLES = ['admin', 'content_editor', 'reviewer', 'form_manager'];
const ROLE_LABELS = {
  admin: 'Admin (full access + manage users)',
  content_editor: 'Content Editor (edit content)',
  reviewer: 'Reviewer (review applications)',
  form_manager: 'Form Manager (edit application form)',
};

export default function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [busy, setBusy] = useState(false);
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
    if (busy) return;
    setBusy(true);
    try {
      const { data } = await api.post('/users', form);
      if (data && data.id) setUsers(prev => [...prev, data]); else load();
      setForm({ name: '', email: '', password: '', roles: ['reviewer'] });
      setAddOpen(false);
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
    finally { setBusy(false); }
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
      <div className="flex justify-between items-start gap-2 mb-4">
        <div>
          <h2 className="font-serif text-lg text-ink mb-1">Users & Roles</h2>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>A user can hold multiple roles. Only admins can manage users.</p>
        </div>
        <button onClick={() => { setForm({ name: '', email: '', password: '', roles: ['reviewer'] }); setAddOpen(true); }} className="pill-btn pill-btn-primary text-sm whitespace-nowrap">+ Add New</button>
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add User" subtitle="New account">
        <form onSubmit={add} className="space-y-3">
          <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="border rounded-xl px-3 py-2 text-sm w-full" style={{ borderColor: 'var(--line)' }} required />
          <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="border rounded-xl px-3 py-2 text-sm w-full" style={{ borderColor: 'var(--line)' }} required />
          <input placeholder="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="border rounded-xl px-3 py-2 text-sm w-full" style={{ borderColor: 'var(--line)' }} required />
          <div>
            <span className="text-xs font-black uppercase block mb-2" style={{ color: 'var(--muted)' }}>Roles</span>
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
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={() => setAddOpen(false)} className="pill-btn text-sm">Cancel</button>
            <button type="submit" disabled={busy} className="pill-btn pill-btn-primary text-sm" style={{ opacity: busy ? 0.6 : 1 }}>{busy ? 'Saving…' : 'Add User'}</button>
          </div>
        </form>
      </Modal>

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
