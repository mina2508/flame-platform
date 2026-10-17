import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import Modal from './Modal.jsx';

export default function CrudSection({ title, endpoint, fields }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({});
  const [show, setShow] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState(null);   // id being edited (opens edit modal)
  const [editForm, setEditForm] = useState({});
  const [busy, setBusy] = useState(false);

  async function load() { setItems((await api.get(endpoint)).data); }
  useEffect(() => { load(); }, []);

  async function add(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const { data: created } = await api.post(endpoint, form);
      if (created && created.id) setItems(prev => [...prev, created]);
      else await load();
      setForm({});
      setAddOpen(false);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    if (!confirm('Delete this item?')) return;
    const prev = items;
    setItems(items.filter(it => it.id !== id));
    try { await api.delete(`${endpoint}/${id}`); }
    catch { setItems(prev); }
  }

  function startEdit(item) {
    setEditId(item.id);
    const seed = {};
    fields.forEach(f => { seed[f.key] = item[f.key] ?? ''; });
    setEditForm(seed);
  }

  async function saveEdit(e) {
    e?.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const { data: updated } = await api.patch(`${endpoint}/${editId}`, editForm);
      if (updated && updated.id) setItems(prev => prev.map(it => (it.id === editId ? { ...it, ...updated } : it)));
      else await load();
      setEditId(null);
    } finally {
      setBusy(false);
    }
  }

  const inp = "border rounded-xl px-3 py-2 text-sm w-full";

  return (
    <div className="glass-card p-4 fade-up" style={{ borderRadius: 18 }}>
      <div className="flex justify-between items-center gap-2">
        <button onClick={() => setShow(!show)} className="text-left font-serif text-lg text-ink flex items-center gap-2 flex-1"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <span>{title}</span>
          <span className="text-sm" style={{ color: 'var(--muted)' }}>{items.length} items {show ? '▲' : '▼'}</span>
        </button>
        <button onClick={() => { setForm({}); setAddOpen(true); }} className="pill-btn pill-btn-primary text-sm whitespace-nowrap">+ Add New</button>
      </div>

      {show && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: 'var(--line)' }}>
                {fields.map(f => <th key={f.key} className="px-2 py-2 text-xs uppercase font-black" style={{ color: 'var(--muted)' }}>{f.label}</th>)}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr><td colSpan={fields.length + 1} className="px-2 py-4 text-center text-xs" style={{ color: 'var(--muted)' }}>No items yet. Click “+ Add New”.</td></tr>
              )}
              {items.map(item => (
                <tr key={item.id} className="border-b" style={{ borderColor: 'var(--line)' }}>
                  {fields.map(f => <td key={f.key} className="px-2 py-2">{String(item[f.key] ?? '').slice(0, 40)}</td>)}
                  <td className="px-2 py-2 whitespace-nowrap">
                    <button onClick={() => startEdit(item)} className="text-xs font-bold mr-2" style={{ color: 'var(--sky)', border: 'none', background: 'none', cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => remove(item.id)} className="text-xs font-bold" style={{ color: 'var(--danger)', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={`Add — ${title}`} subtitle="New entry">
        <form onSubmit={add} className="space-y-3">
          {fields.map(f => (
            <label key={f.key} className="grid gap-1.5">
              <span className="text-xs font-black uppercase" style={{ color: 'var(--muted)' }}>{f.label}</span>
              <input placeholder={f.label} value={form[f.key] || ''}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                className={inp} style={{ borderColor: 'var(--line)' }} />
            </label>
          ))}
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={() => setAddOpen(false)} className="pill-btn text-sm">Cancel</button>
            <button type="submit" disabled={busy} className="pill-btn pill-btn-primary text-sm" style={{ opacity: busy ? 0.6 : 1 }}>{busy ? 'Saving…' : 'Add'}</button>
          </div>
        </form>
      </Modal>

      {/* Edit modal */}
      <Modal open={editId != null} onClose={() => setEditId(null)} title={`Edit — ${title}`} subtitle="Update entry">
        <form onSubmit={saveEdit} className="space-y-3">
          {fields.map(f => (
            <label key={f.key} className="grid gap-1.5">
              <span className="text-xs font-black uppercase" style={{ color: 'var(--muted)' }}>{f.label}</span>
              <input value={editForm[f.key] ?? ''} onChange={e => setEditForm({ ...editForm, [f.key]: e.target.value })}
                className={inp} style={{ borderColor: 'var(--line)' }} />
            </label>
          ))}
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={() => setEditId(null)} className="pill-btn text-sm">Cancel</button>
            <button type="submit" disabled={busy} className="pill-btn pill-btn-primary text-sm" style={{ opacity: busy ? 0.6 : 1 }}>{busy ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
