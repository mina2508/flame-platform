import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';

const TYPES = [
  { v: 'text', l: 'Text (string)' },
  { v: 'number', l: 'Number' },
  { v: 'dropdown', l: 'Dropdown (select)' },
  { v: 'toggle', l: 'Toggle (yes/no)' },
  { v: 'rating', l: 'Rating (scale)' },
];

export default function FormBuilder() {
  const [fields, setFields] = useState([]);
  const [form, setForm] = useState({ label: '', key: '', type: 'text', required: false, optionsText: '', min: 1, max: 10 });

  async function load() { setFields((await api.get('/form-fields/all')).data); }
  useEffect(() => { load(); }, []);

  function buildOptions(f) {
    if (f.type === 'dropdown') return f.optionsText.split(',').map(s => s.trim()).filter(Boolean);
    if (f.type === 'rating') return { min: Number(f.min), max: Number(f.max) };
    return null;
  }

  async function add(e) {
    e.preventDefault();
    const key = form.key || form.label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    try {
      await api.post('/form-fields', {
        label: form.label, key, type: form.type, required: form.required,
        order: fields.length + 1, options: buildOptions(form),
      });
      setForm({ label: '', key: '', type: 'text', required: false, optionsText: '', min: 1, max: 10 });
      load();
    } catch (err) { alert(err.response?.data?.error || 'Failed (key may be duplicate)'); }
  }

  async function toggleActive(f) { await api.patch(`/form-fields/${f.id}`, { active: !f.active }); load(); }
  async function toggleRequired(f) { await api.patch(`/form-fields/${f.id}`, { required: !f.required }); load(); }
  async function remove(id) { if (confirm('Delete this field?')) { await api.delete(`/form-fields/${id}`); load(); } }
  async function move(f, dir) {
    const swap = fields[fields.indexOf(f) + dir];
    if (!swap) return;
    await api.patch(`/form-fields/${f.id}`, { order: swap.order });
    await api.patch(`/form-fields/${swap.id}`, { order: f.order });
    load();
  }

  const inp = "border rounded-xl px-3 py-2 text-sm";

  return (
    <div className="glass-card p-5 fade-up" style={{ borderRadius: 18 }}>
      <h2 className="font-serif text-lg text-ink mb-1">Application Form Builder</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>Add, remove, or edit the fields shown on the public "Apply to FLAME Function" form.</p>

      {/* Add field form */}
      <form onSubmit={add} className="grid gap-2 p-4 rounded-2xl mb-5" style={{ background: '#fffaf4', border: '1px solid var(--line)' }}>
        <div className="flex gap-2 flex-wrap">
          <input placeholder="Field label (e.g. Phone Number)" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} className={`${inp} flex-1 min-w-[160px]`} style={{ borderColor: 'var(--line)' }} required />
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className={inp} style={{ borderColor: 'var(--line)' }}>
            {TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm px-3" style={{ color: 'var(--muted)' }}>
            <input type="checkbox" checked={form.required} onChange={e => setForm({ ...form, required: e.target.checked })} /> Required
          </label>
        </div>
        {form.type === 'dropdown' && (
          <input placeholder="Options, comma-separated (e.g. Teacher, Servant, Other)" value={form.optionsText} onChange={e => setForm({ ...form, optionsText: e.target.value })} className={inp} style={{ borderColor: 'var(--line)' }} />
        )}
        {form.type === 'rating' && (
          <div className="flex gap-2 items-center text-sm" style={{ color: 'var(--muted)' }}>
            Min <input type="number" value={form.min} onChange={e => setForm({ ...form, min: e.target.value })} className={`${inp} w-20`} style={{ borderColor: 'var(--line)' }} />
            Max <input type="number" value={form.max} onChange={e => setForm({ ...form, max: e.target.value })} className={`${inp} w-20`} style={{ borderColor: 'var(--line)' }} />
          </div>
        )}
        <button className="pill-btn pill-btn-primary text-sm justify-self-start">+ Add Field</button>
      </form>

      {/* Field list */}
      <div className="space-y-2">
        {fields.map((f, i) => (
          <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl border bg-white flex-wrap" style={{ borderColor: 'var(--line)', opacity: f.active ? 1 : 0.5 }}>
            <div className="flex flex-col gap-0.5">
              <button onClick={() => move(f, -1)} disabled={i === 0} className="text-xs" style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted)' }}>▲</button>
              <button onClick={() => move(f, 1)} disabled={i === fields.length - 1} className="text-xs" style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted)' }}>▼</button>
            </div>
            <div className="flex-1 min-w-[150px]">
              <strong className="text-ink text-sm">{f.label}</strong>
              <div className="flex gap-2 mt-1 flex-wrap">
                <span className="badge badge-info text-xs">{f.type}</span>
                {f.required && <span className="badge badge-danger text-xs">required</span>}
                {f.options && <span className="text-xs" style={{ color: 'var(--muted)' }}>{Array.isArray(f.options) ? f.options.join(', ') : `${f.options.min}–${f.options.max}`}</span>}
              </div>
            </div>
            <button onClick={() => toggleRequired(f)} className="text-xs font-bold px-2 py-1 rounded-lg" style={{ border: '1px solid var(--line)', background: '#fff', cursor: 'pointer', color: 'var(--muted)' }}>
              {f.required ? 'Make optional' : 'Make required'}
            </button>
            <button onClick={() => toggleActive(f)} className="text-xs font-bold px-2 py-1 rounded-lg" style={{ border: '1px solid var(--line)', background: '#fff', cursor: 'pointer', color: f.active ? 'var(--watch)' : 'var(--good)' }}>
              {f.active ? 'Hide' : 'Show'}
            </button>
            <button onClick={() => remove(f.id)} className="text-sm font-bold" style={{ color: 'var(--danger)', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
