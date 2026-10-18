import { useEffect, useState } from 'react';
import { api, cachedGet } from '../../api/client.js';
import DateField from '../DateField.jsx';

const SECTIONS = [
  { key: 'openingPrayer', label: 'Opening Prayer' },
  { key: 'physicalExercise', label: 'Physical Exercise' },
  { key: 'radio', label: 'Radio' },
  { key: 'nationalAnthem', label: 'National Anthem' },
  { key: 'inspection', label: 'Inspection' },
  { key: 'announcement', label: 'Announcement' },
];

export default function MorningAssemblyAdmin() {
  const [items, setItems] = useState([]);
  const [schools, setSchools] = useState([]);
  const [form, setForm] = useState({ schoolId: '', date: '' });
  const [texts, setTexts] = useState({});
  const [files, setFiles] = useState({});

  async function load() {
    const [items, schools] = await Promise.all([
      api.get('/morning-assembly').then(r => r.data),
      cachedGet('/schools'),
    ]);
    setItems(items); setSchools(schools);
  }
  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    if (!form.schoolId) return alert('Select a school');
    const fd = new FormData();
    fd.append('schoolId', form.schoolId);
    fd.append('date', form.date || new Date().toISOString().slice(0, 10));
    SECTIONS.forEach(s => {
      if (texts[s.key]) fd.append(s.key, texts[s.key]);
      if (files[s.key]) {
        if (files[s.key].size > 2 * 1024 * 1024) { alert(`${s.label} file must be ≤ 2MB`); return; }
        fd.append(`${s.key}File`, files[s.key]);
      }
    });
    await api.post('/morning-assembly', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    setForm({ schoolId: '', date: '' }); setTexts({}); setFiles({});
    load();
  }
  async function remove(id) { if (confirm('Delete?')) { await api.delete(`/morning-assembly/${id}`); load(); } }

  const inp = "border rounded-xl px-3 py-2 text-sm";
  const schoolName = (id) => schools.find(s => s.id === id)?.name || id;

  return (
    <div>
      <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
        Each section accepts text OR a file (≤2MB). Select a school and date, fill the sections, and submit.
      </p>

      <form onSubmit={submit} className="grid gap-3 p-4 rounded-2xl mb-4" style={{ background: '#fffaf4', border: '1px solid var(--line)' }}>
        <div className="flex gap-2 flex-wrap">
          <select value={form.schoolId} onChange={e => setForm({ ...form, schoolId: e.target.value })} className={inp} style={{ borderColor: 'var(--line)' }} required>
            <option value="">School * ...</option>
            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <DateField value={form.date} onChange={v => setForm({ ...form, date: v })} placeholder="Date" />
        </div>

        {SECTIONS.map(s => (
          <div key={s.key} className="rounded-xl p-3" style={{ background: '#fff', border: '1px solid var(--line)' }}>
            <label className="text-xs font-black uppercase block mb-2" style={{ color: 'var(--muted)' }}>{s.label}</label>
            <div className="flex gap-2 flex-wrap items-start">
              <textarea placeholder={`${s.label} text...`} value={texts[s.key] || ''} onChange={e => setTexts({ ...texts, [s.key]: e.target.value })}
                className={`${inp} flex-1 min-w-[200px]`} rows={2} style={{ borderColor: 'var(--line)' }} />
              <div className="text-xs" style={{ color: 'var(--muted)' }}>
                <span>or file (≤2MB):</span>
                <input type="file" onChange={e => setFiles({ ...files, [s.key]: e.target.files[0] })} className="block mt-1" />
              </div>
            </div>
          </div>
        ))}

        <button className="pill-btn pill-btn-primary text-sm justify-self-start">+ Create Morning Assembly</button>
      </form>

      <div className="space-y-2">
        {items.map(a => (
          <div key={a.id} className="rounded-xl border p-3 bg-white flex items-start justify-between flex-wrap gap-2" style={{ borderColor: 'var(--line)' }}>
            <div>
              <strong className="text-ink text-sm">☀ {schoolName(a.schoolId)}</strong>
              <span className="text-xs ml-2" style={{ color: 'var(--muted)' }}>{a.date?.slice(0, 10)}</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {SECTIONS.map(s => {
                  const hasText = a[s.key];
                  const hasFile = a[`${s.key}File`];
                  if (!hasText && !hasFile) return null;
                  return (
                    <span key={s.key} className="badge badge-info text-xs">
                      {s.label}{hasFile ? ' 📎' : ''}
                    </span>
                  );
                })}
              </div>
            </div>
            <button onClick={() => remove(a.id)} className="text-xs font-bold" style={{ color: 'var(--danger)', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
