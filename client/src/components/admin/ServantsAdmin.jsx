import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';

export default function ServantsAdmin() {
  const [servants, setServants] = useState([]);
  const [countries, setCountries] = useState([]);
  const [f, setF] = useState({ fullName: '', nationality: '', priestCountryId: '', contact: '', email: '', available: true });

  async function load() {
    setServants((await api.get('/people?type=Servant')).data);
    setCountries((await api.get('/countries')).data);
  }
  useEffect(() => { load(); }, []);

  const [busy, setBusy] = useState(false);

  async function add(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const { data } = await api.post('/people', {
        fullName: f.fullName, position: 'Servant', nationality: f.nationality,
        priestCountryId: f.priestCountryId || null, contact: f.contact, email: f.email, available: f.available,
      });
      setServants(prev => [data, ...prev.filter(s => s.id !== data.id)]);
      setF({ fullName: '', nationality: '', priestCountryId: '', contact: '', email: '', available: true });
    } finally {
      setBusy(false);
    }
  }
  async function toggleAvailable(p) {
    setServants(prev => prev.map(s => (s.id === p.id ? { ...s, available: !s.available } : s))); // optimistic
    try { await api.patch(`/people/${p.id}`, { available: !p.available }); }
    catch { setServants(prev => prev.map(s => (s.id === p.id ? { ...s, available: p.available } : s))); }
  }
  async function remove(id) {
    if (!confirm('Delete servant?')) return;
    const prev = servants;
    setServants(servants.filter(s => s.id !== id));
    try { await api.delete(`/people/${id}`); }
    catch { setServants(prev); }
  }

  const [editId, setEditId] = useState(null);
  const [editF, setEditF] = useState({});
  function startEdit(p) {
    setEditId(p.id);
    setEditF({ fullName: p.fullName || '', nationality: p.nationality || '', priestCountryId: p.priestCountryId || '', contact: p.contact || '', email: p.email || '' });
  }
  async function saveEdit(id) {
    const { data } = await api.patch(`/people/${id}`, { ...editF, priestCountryId: editF.priestCountryId || null });
    setServants(prev => prev.map(s => (s.id === id ? { ...s, ...data } : s)));
    setEditId(null);
  }

  const inp = "border rounded-xl px-3 py-2 text-sm";
  const countryName = (id) => countries.find(c => c.id === id)?.name;

  return (
    <div>
      <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>Add acting servants. Availability shows when selecting people for missions.</p>

      <form onSubmit={add} className="grid gap-2 p-4 rounded-2xl mb-4" style={{ background: '#fffaf4', border: '1px solid var(--line)' }}>
        <div className="flex gap-2 flex-wrap">
          <input placeholder="Servant name *" value={f.fullName} onChange={e => setF({ ...f, fullName: e.target.value })} className={`${inp} flex-1 min-w-[160px]`} style={{ borderColor: 'var(--line)' }} required />
          <input placeholder="Nationality" value={f.nationality} onChange={e => setF({ ...f, nationality: e.target.value })} className={inp} style={{ borderColor: 'var(--line)' }} />
          <select value={f.priestCountryId} onChange={e => setF({ ...f, priestCountryId: e.target.value })} className={inp} style={{ borderColor: 'var(--line)' }}>
            <option value="">Country (optional)...</option>
            {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input placeholder="Contact" value={f.contact} onChange={e => setF({ ...f, contact: e.target.value })} className={`${inp} flex-1`} style={{ borderColor: 'var(--line)' }} />
          <input placeholder="Email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} className={`${inp} flex-1`} style={{ borderColor: 'var(--line)' }} />
        </div>
        <button disabled={busy} className="pill-btn pill-btn-primary text-sm justify-self-start" style={{ opacity: busy ? 0.6 : 1 }}>{busy ? 'Saving…' : '+ Add Servant'}</button>
      </form>

      <div className="space-y-2">
        {servants.map(p => (
          <div key={p.id} className="rounded-xl border p-3 bg-white" style={{ borderColor: 'var(--line)' }}>
            {editId === p.id ? (
              <div className="grid gap-2">
                <div className="flex gap-2 flex-wrap">
                  <input value={editF.fullName} onChange={e => setEditF({ ...editF, fullName: e.target.value })} className={`${inp} flex-1`} style={{ borderColor: 'var(--line)' }} placeholder="Name" />
                  <input value={editF.nationality} onChange={e => setEditF({ ...editF, nationality: e.target.value })} className={inp} style={{ borderColor: 'var(--line)' }} placeholder="Nationality" />
                  <select value={editF.priestCountryId} onChange={e => setEditF({ ...editF, priestCountryId: e.target.value })} className={inp} style={{ borderColor: 'var(--line)' }}>
                    <option value="">Country (optional)...</option>
                    {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <input value={editF.contact} onChange={e => setEditF({ ...editF, contact: e.target.value })} className={`${inp} flex-1`} style={{ borderColor: 'var(--line)' }} placeholder="Contact" />
                  <input value={editF.email} onChange={e => setEditF({ ...editF, email: e.target.value })} className={`${inp} flex-1`} style={{ borderColor: 'var(--line)' }} placeholder="Email" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(p.id)} className="pill-btn pill-btn-primary text-xs">Save</button>
                  <button onClick={() => setEditId(null)} className="pill-btn text-xs">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-[150px]">
                  <strong className="text-ink text-sm">🙏 {p.fullName}</strong>
                  <span className="text-xs ml-2" style={{ color: 'var(--muted)' }}>
                    {p.nationality || ''}{p.priestCountryId ? ` · 🌍 ${countryName(p.priestCountryId) || ''}` : ''}
                  </span>
                </div>
                <button onClick={() => toggleAvailable(p)} className="px-3 py-1 rounded-full text-xs font-bold"
                  style={p.available ? { background: 'rgba(39,149,106,0.12)', color: 'var(--good)', border: 'none', cursor: 'pointer' } : { background: 'rgba(199,53,53,0.12)', color: 'var(--danger)', border: 'none', cursor: 'pointer' }}>
                  {p.available ? '🟢 Available' : '🔴 Unavailable'}
                </button>
                <button onClick={() => startEdit(p)} className="text-xs font-bold" style={{ color: 'var(--sky)', border: 'none', background: 'none', cursor: 'pointer' }}>Edit</button>
                <button onClick={() => remove(p.id)} className="text-xs font-bold" style={{ color: 'var(--danger)', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
