import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';

export default function ResidenceManager({ open: openProp, onToggle }) {
  const [items, setItems] = useState([]);
  const [countries, setCountries] = useState([]);
  const [openState, setOpenState] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : openState;
  const toggleOpen = () => { if (isControlled) onToggle?.(); else setOpenState(o => !o); };
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', city: '', address: '', countryId: '' });

  async function load() {
    setItems((await api.get('/residences')).data);
    setCountries((await api.get('/countries')).data);
  }
  useEffect(() => { load(); }, []);

  async function add(e) {
    e.preventDefault();
    if (!form.countryId) return alert('Country is required for a residence');
    if (busy) return;
    setBusy(true);
    try {
      const { data } = await api.post('/residences', form);
      setItems(prev => [...prev, data]);
      setForm({ name: '', city: '', address: '', countryId: '' });
      load();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
    finally { setBusy(false); }
  }
  async function remove(id) {
    if (!confirm('Delete residence?')) return;
    const prev = items;
    setItems(items.filter(r => r.id !== id));
    try { await api.delete(`/residences/${id}`); }
    catch { setItems(prev); }
  }

  const inp = "border rounded-xl px-3 py-2 text-sm";
  const countryName = (id) => countries.find(c => c.id === id)?.name || '—';

  return (
    <div className="glass-card p-4 fade-up" style={{ borderRadius: 18 }}>
      <button onClick={toggleOpen} className="w-full text-left font-serif text-lg text-ink flex justify-between items-center" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
        <span>Residences</span>
        <span className="text-sm" style={{ color: 'var(--muted)' }}>{items.length} items {open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="mt-4 space-y-3">
          <form onSubmit={add} className="grid gap-2 p-3 rounded-xl" style={{ background: '#fffaf4', border: '1px solid var(--line)' }}>
            <div className="flex gap-2 flex-wrap">
              <input placeholder="Residence name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={`${inp} flex-1 min-w-[140px]`} style={{ borderColor: 'var(--line)' }} required />
              <select value={form.countryId} onChange={e => setForm({ ...form, countryId: e.target.value })} className={inp} style={{ borderColor: 'var(--line)' }} required>
                <option value="">Country * ...</option>
                {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2 flex-wrap">
              <input placeholder="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className={`${inp} flex-1`} style={{ borderColor: 'var(--line)' }} />
              <input placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className={`${inp} flex-1`} style={{ borderColor: 'var(--line)' }} />
            </div>
            <button disabled={busy} className="pill-btn pill-btn-primary text-sm justify-self-start" style={{ opacity: busy ? 0.6 : 1 }}>{busy ? 'Saving…' : '+ Add Residence'}</button>
          </form>
          <div className="space-y-2">
            {items.map(r => (
              <div key={r.id} className="rounded-xl border p-3 bg-white flex items-center justify-between" style={{ borderColor: 'var(--line)' }}>
                <div>
                  <strong className="text-ink text-sm">{r.name}</strong>
                  <span className="text-xs ml-2" style={{ color: 'var(--muted)' }}>🌍 {r.country?.name || countryName(r.countryId)}{r.city ? ` · ${r.city}` : ''} · {r.residents?.length || 0} residents</span>
                </div>
                <button onClick={() => remove(r.id)} className="text-xs font-bold" style={{ color: 'var(--danger)', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
