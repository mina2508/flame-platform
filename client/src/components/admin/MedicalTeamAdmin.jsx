import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';

export default function MedicalTeamAdmin() {
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({ fullName: '', specialty: '', contact: '', email: '' });

  async function load() { setMembers((await api.get('/medical-team')).data); }
  useEffect(() => { load(); }, []);

  async function add(e) {
    e.preventDefault();
    await api.post('/medical-team', form);
    setForm({ fullName: '', specialty: '', contact: '', email: '' });
    load();
  }
  async function toggleAvailable(m) {
    await api.patch(`/medical-team/${m.id}`, { available: !m.available });
    load();
  }
  async function remove(id) { if (confirm('Delete?')) { await api.delete(`/medical-team/${id}`); load(); } }

  const [editId, setEditId] = useState(null);
  const [editF, setEditF] = useState({});
  function startEdit(m) {
    setEditId(m.id);
    setEditF({ fullName: m.fullName || '', specialty: m.specialty || '', contact: m.contact || '', email: m.email || '' });
  }
  async function saveEdit(id) {
    await api.patch(`/medical-team/${id}`, editF);
    setEditId(null); load();
  }

  const inp = "border rounded-xl px-3 py-2 text-sm flex-1 min-w-[120px]";

  return (
    <div>
      <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>Manage medical team members. Toggle availability — shown when selecting for missions.</p>

      <form onSubmit={add} className="flex gap-2 flex-wrap mb-4 p-3 rounded-xl" style={{ background: '#fffaf4', border: '1px solid var(--line)' }}>
        <input placeholder="Full name *" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className={inp} style={{ borderColor: 'var(--line)' }} required />
        <input placeholder="Specialty" value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} className={inp} style={{ borderColor: 'var(--line)' }} />
        <input placeholder="Contact" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} className={inp} style={{ borderColor: 'var(--line)' }} />
        <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inp} style={{ borderColor: 'var(--line)' }} />
        <button className="pill-btn pill-btn-primary text-sm">+ Add</button>
      </form>

      <div className="space-y-2">
        {members.map(m => (
          <div key={m.id} className="rounded-xl border p-3 bg-white" style={{ borderColor: 'var(--line)' }}>
            {editId === m.id ? (
              <div className="flex gap-2 flex-wrap items-center">
                <input value={editF.fullName} onChange={e => setEditF({ ...editF, fullName: e.target.value })} className={inp} style={{ borderColor: 'var(--line)' }} placeholder="Full name" />
                <input value={editF.specialty} onChange={e => setEditF({ ...editF, specialty: e.target.value })} className={inp} style={{ borderColor: 'var(--line)' }} placeholder="Specialty" />
                <input value={editF.contact} onChange={e => setEditF({ ...editF, contact: e.target.value })} className={inp} style={{ borderColor: 'var(--line)' }} placeholder="Contact" />
                <input value={editF.email} onChange={e => setEditF({ ...editF, email: e.target.value })} className={inp} style={{ borderColor: 'var(--line)' }} placeholder="Email" />
                <button onClick={() => saveEdit(m.id)} className="pill-btn pill-btn-primary text-xs">Save</button>
                <button onClick={() => setEditId(null)} className="pill-btn text-xs">Cancel</button>
              </div>
            ) : (
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-[150px]">
                  <strong className="text-ink text-sm">{m.fullName}</strong>
                  {m.specialty && <span className="text-xs ml-2" style={{ color: 'var(--muted)' }}>{m.specialty}</span>}
                  {m.contact && <span className="text-xs ml-2" style={{ color: 'var(--muted)' }}>📞 {m.contact}</span>}
                </div>
                <button onClick={() => toggleAvailable(m)} className="px-3 py-1 rounded-full text-xs font-bold"
                  style={m.available
                    ? { background: 'rgba(39,149,106,0.12)', color: 'var(--good)', border: 'none', cursor: 'pointer' }
                    : { background: 'rgba(199,53,53,0.12)', color: 'var(--danger)', border: 'none', cursor: 'pointer' }}>
                  {m.available ? '🟢 Available' : '🔴 Unavailable'}
                </button>
                <button onClick={() => startEdit(m)} className="text-xs font-bold" style={{ color: 'var(--sky)', border: 'none', background: 'none', cursor: 'pointer' }}>Edit</button>
                <button onClick={() => remove(m.id)} className="text-xs font-bold" style={{ color: 'var(--danger)', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
