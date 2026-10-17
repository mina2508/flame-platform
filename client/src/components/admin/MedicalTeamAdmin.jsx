import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import Modal from './Modal.jsx';

export default function MedicalTeamAdmin() {
  const [addOpen, setAddOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({ fullName: '', specialty: '', contact: '', email: '' });

  async function load() { setMembers((await api.get('/medical-team')).data); }
  useEffect(() => { load(); }, []);

  const [busy, setBusy] = useState(false);

  async function add(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const { data } = await api.post('/medical-team', form);
      setMembers(prev => [...prev.filter(m => m.id !== data.id), data]);
      setForm({ fullName: '', specialty: '', contact: '', email: '' });
      setAddOpen(false);
    } finally {
      setBusy(false);
    }
  }
  async function toggleAvailable(m) {
    setMembers(prev => prev.map(x => (x.id === m.id ? { ...x, available: !x.available } : x)));
    try { await api.patch(`/medical-team/${m.id}`, { available: !m.available }); }
    catch { setMembers(prev => prev.map(x => (x.id === m.id ? { ...x, available: m.available } : x))); }
  }
  async function remove(id) {
    if (!confirm('Delete?')) return;
    const prev = members;
    setMembers(members.filter(m => m.id !== id));
    try { await api.delete(`/medical-team/${id}`); }
    catch { setMembers(prev); }
  }

  const [editId, setEditId] = useState(null);
  const [editF, setEditF] = useState({});
  function startEdit(m) {
    setEditId(m.id);
    setEditF({ fullName: m.fullName || '', specialty: m.specialty || '', contact: m.contact || '', email: m.email || '' });
  }
  async function saveEdit(id) {
    const { data } = await api.patch(`/medical-team/${id}`, editF);
    setMembers(prev => prev.map(m => (m.id === id ? { ...m, ...data } : m)));
    setEditId(null);
  }

  const inp = "border rounded-xl px-3 py-2 text-sm flex-1 min-w-[120px]";

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-4">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Manage medical team members. Toggle availability — shown when selecting for missions.</p>
        <button onClick={() => { setForm({ fullName: '', specialty: '', contact: '', email: '' }); setAddOpen(true); }} className="pill-btn pill-btn-primary text-sm whitespace-nowrap">+ Add Member</button>
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Medical Team Member" subtitle="New person">
        <form onSubmit={add} className="space-y-3">
          <input placeholder="Full name *" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className={`${inp} w-full`} style={{ borderColor: 'var(--line)' }} required />
          <input placeholder="Specialty" value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} className={`${inp} w-full`} style={{ borderColor: 'var(--line)' }} />
          <input placeholder="Contact" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} className={`${inp} w-full`} style={{ borderColor: 'var(--line)' }} />
          <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={`${inp} w-full`} style={{ borderColor: 'var(--line)' }} />
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={() => setAddOpen(false)} className="pill-btn text-sm">Cancel</button>
            <button type="submit" disabled={busy} className="pill-btn pill-btn-primary text-sm" style={{ opacity: busy ? 0.6 : 1 }}>{busy ? 'Saving…' : 'Add Member'}</button>
          </div>
        </form>
      </Modal>

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
