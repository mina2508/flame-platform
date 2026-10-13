import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import DateField from '../DateField.jsx';

// Lets the admin either SELECT an existing person or CREATE a new one.
// Shows availability. Calls onSelect(personId).
export default function PersonPicker({ value, onSelect, label = 'Person', filter = {} }) {
  const [people, setPeople] = useState([]);
  const [mode, setMode] = useState('select'); // select | create
  const [form, setForm] = useState({ fullName: '', position: '', nationality: '', contact: '', email: '' });

  async function load() {
    const params = new URLSearchParams(filter).toString();
    setPeople((await api.get('/people' + (params ? `?${params}` : ''))).data);
  }
  useEffect(() => { load(); }, []);

  async function create(e) {
    e.preventDefault();
    const { data } = await api.post('/people', form);
    setForm({ fullName: '', birthdate: '', position: '', nationality: '', contact: '', email: '' });
    await load();
    onSelect(data.id);
    setMode('select');
  }

  return (
    <div className="rounded-xl border p-3" style={{ borderColor: 'var(--line)', background: '#fffaf4' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-black uppercase" style={{ color: 'var(--muted)' }}>{label}</span>
        <div className="flex gap-1 text-xs">
          <button type="button" onClick={() => setMode('select')} className="px-2 py-1 rounded-lg font-bold"
            style={mode === 'select' ? { background: 'var(--sky)', color: '#fff', border: 'none' } : { background: '#fff', border: '1px solid var(--line)', color: 'var(--muted)' }}>Select existing</button>
          <button type="button" onClick={() => setMode('create')} className="px-2 py-1 rounded-lg font-bold"
            style={mode === 'create' ? { background: 'var(--sky)', color: '#fff', border: 'none' } : { background: '#fff', border: '1px solid var(--line)', color: 'var(--muted)' }}>Create new</button>
        </div>
      </div>

      {mode === 'select' ? (
        <select value={value || ''} onChange={e => onSelect(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: 'var(--line)' }}>
          <option value="">— none —</option>
          {people.map(p => (
            <option key={p.id} value={p.id}>
              {p.fullName}{p.position ? ` (${p.position})` : ''} {p.available ? '🟢' : '🔴'}
            </option>
          ))}
        </select>
      ) : (
        <div className="grid gap-2">
          <input placeholder="Full name *" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" style={{ borderColor: 'var(--line)' }} />
          <div>
            <span className="text-xs font-black uppercase block mb-1" style={{ color: 'var(--muted)' }}>Birthdate</span>
            <DateField value={form.birthdate} onChange={v => setForm({ ...form, birthdate: v })} max={today} placeholder="Birthdate" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <input placeholder="Position" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[100px]" style={{ borderColor: 'var(--line)' }} />
            <input placeholder="Nationality" value={form.nationality} onChange={e => setForm({ ...form, nationality: e.target.value })} className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[100px]" style={{ borderColor: 'var(--line)' }} />
          </div>
          <div className="flex gap-2 flex-wrap">
            <input placeholder="Contact" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[100px]" style={{ borderColor: 'var(--line)' }} />
            <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[100px]" style={{ borderColor: 'var(--line)' }} />
          </div>
          <button type="button" onClick={create} disabled={!form.fullName} className="pill-btn pill-btn-primary text-sm justify-self-start">+ Create & Select</button>
        </div>
      )}
    </div>
  );
}
