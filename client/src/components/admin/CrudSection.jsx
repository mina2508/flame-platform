import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';

export default function CrudSection({ title, endpoint, fields }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({});
  const [show, setShow] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});

  async function load() { setItems((await api.get(endpoint)).data); }
  useEffect(() => { load(); }, []);

  async function add(e) {
    e.preventDefault();
    await api.post(endpoint, form);
    setForm({}); load();
  }
  async function remove(id) {
    if (!confirm('Delete this item?')) return;
    await api.delete(`${endpoint}/${id}`); load();
  }
  function startEdit(item) {
    setEditId(item.id);
    const seed = {};
    fields.forEach(f => { seed[f.key] = item[f.key] ?? ''; });
    setEditForm(seed);
  }
  async function saveEdit(id) {
    await api.patch(`${endpoint}/${id}`, editForm);
    setEditId(null); load();
  }

  return (
    <div className="glass-card p-4 fade-up" style={{ borderRadius: 18 }}>
      <button onClick={() => setShow(!show)} className="w-full text-left font-bold text-ink flex justify-between items-center"
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
        <span className="font-serif text-lg">{title}</span>
        <span className="text-sm" style={{ color: 'var(--muted)' }}>{items.length} items {show ? '▲' : '▼'}</span>
      </button>
      {show && (
        <div className="mt-4 space-y-3">
          <form onSubmit={add} className="flex gap-2 flex-wrap">
            {fields.map(f => (
              <input key={f.key} placeholder={f.label} value={form[f.key] || ''}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                className="border rounded-xl px-3 py-2 text-sm flex-1 min-w-[120px]" style={{ borderColor: 'var(--line)' }} />
            ))}
            <button className="pill-btn pill-btn-primary text-sm">+ Add</button>
          </form>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left" style={{ borderColor: 'var(--line)' }}>
                  {fields.map(f => <th key={f.key} className="px-2 py-2 text-xs uppercase font-black" style={{ color: 'var(--muted)' }}>{f.label}</th>)}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-b" style={{ borderColor: 'var(--line)' }}>
                    {editId === item.id ? (
                      <>
                        {fields.map(f => (
                          <td key={f.key} className="px-2 py-2">
                            <input value={editForm[f.key] ?? ''} onChange={e => setEditForm({ ...editForm, [f.key]: e.target.value })}
                              className="border rounded-lg px-2 py-1 text-sm w-full" style={{ borderColor: 'var(--line)' }} />
                          </td>
                        ))}
                        <td className="px-2 py-2 whitespace-nowrap">
                          <button onClick={() => saveEdit(item.id)} className="text-xs font-bold mr-2" style={{ color: 'var(--good)', border: 'none', background: 'none', cursor: 'pointer' }}>Save</button>
                          <button onClick={() => setEditId(null)} className="text-xs font-bold" style={{ color: 'var(--muted)', border: 'none', background: 'none', cursor: 'pointer' }}>Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        {fields.map(f => <td key={f.key} className="px-2 py-2">{String(item[f.key] ?? '').slice(0, 40)}</td>)}
                        <td className="px-2 py-2 whitespace-nowrap">
                          <button onClick={() => startEdit(item)} className="text-xs font-bold mr-2" style={{ color: 'var(--sky)', border: 'none', background: 'none', cursor: 'pointer' }}>Edit</button>
                          <button onClick={() => remove(item.id)} className="text-xs font-bold" style={{ color: 'var(--danger)', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
