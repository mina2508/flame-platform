import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import Modal from './Modal.jsx';

export default function ResidenceManager({ open: openProp, onToggle }) {
  const [items, setItems] = useState([]);
  const [countries, setCountries] = useState([]);
  const [openState, setOpenState] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : openState;
  const toggleOpen = () => { if (isControlled) onToggle?.(); else setOpenState(o => !o); };
  const [addOpen, setAddOpen] = useState(false);
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
      setAddOpen(false);
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
      <div className="flex justify-between items-center gap-2">
        <button onClick={toggleOpen} className="text-left font-serif text-lg text-ink flex items-center gap-2 flex-1" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <span>Residences</span>
          <span className="text-sm" style={{ color: 'var(--muted)' }}>{items.length} items {open ? '▲' : '▼'}</span>
        </button>
        <button onClick={() => { setForm({ name: '', city: '', address: '', countryId: '' }); setAddOpen(true); }} className="pill-btn pill-btn-primary text-sm whitespace-nowrap">+ Add New</button>
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Residence" subtitle="New location">
        <form onSubmit={add} className="space-y-3">
          <input placeholder="Residence name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={`${inp} w-full`} style={{ borderColor: 'var(--line)' }} required />
          <select value={form.countryId} onChange={e => setForm({ ...form, countryId: e.target.value })} className={`${inp} w-full`} style={{ borderColor: 'var(--line)' }} required>
            <option value="">Country * ...</option>
            {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input placeholder="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className={`${inp} w-full`} style={{ borderColor: 'var(--line)' }} />
          <input placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className={`${inp} w-full`} style={{ borderColor: 'var(--line)' }} />
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={() => setAddOpen(false)} className="pill-btn text-sm">Cancel</button>
            <button type="submit" disabled={busy} className="pill-btn pill-btn-primary text-sm" style={{ opacity: busy ? 0.6 : 1 }}>{busy ? 'Saving…' : 'Add Residence'}</button>
          </div>
        </form>
      </Modal>

      {open && (
        <div className="mt-4 space-y-3">
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
