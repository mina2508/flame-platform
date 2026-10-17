import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import Modal from './Modal.jsx';

function DocManager({ title, endpoint, maxMB = 12 }) {
  const [items, setItems] = useState([]);
  const [schools, setSchools] = useState([]);
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', language: 'en' });
  const [file, setFile] = useState(null);
  const [schoolIds, setSchoolIds] = useState([]);
  const [classIds, setClassIds] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load() {
    setItems((await api.get(endpoint)).data);
    setSchools((await api.get('/schools')).data);
    setClasses((await api.get('/classes')).data);
  }
  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    if (file && file.size > maxMB * 1024 * 1024) return alert(`File must be ≤ ${maxMB}MB`);
    if (busy) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('language', form.language);
      fd.append('schoolIds', JSON.stringify(schoolIds));
      fd.append('classIds', JSON.stringify(classIds));
      if (file) fd.append('file', file);
      await api.post(endpoint, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm({ title: '', description: '', language: 'en' }); setFile(null); setSchoolIds([]); setClassIds([]);
      setAddOpen(false);
      load();
    } finally { setBusy(false); }
  }
  async function remove(id) {
    if (!confirm('Delete?')) return;
    const prev = items;
    setItems(items.filter(it => it.id !== id));
    try { await api.delete(`${endpoint}/${id}`); }
    catch { setItems(prev); }
  }

  const toggle = (arr, set, id) => set(arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]);
  const inp = "border rounded-xl px-3 py-2 text-sm";

  // Inline editor for assigning an existing item to schools (and classes).
  const [editId, setEditId] = useState(null);
  const [editSchools, setEditSchools] = useState([]);
  const [editClasses, setEditClasses] = useState([]);

  function startEdit(it) {
    setEditId(it.id);
    setEditSchools((it.schools || []).map(s => s.schoolId || s.school?.id).filter(Boolean));
    setEditClasses((it.classes || []).map(c => c.classId || c.classLevel?.id).filter(Boolean));
  }
  async function saveEdit(id) {
    await api.patch(`${endpoint}/${id}`, { schoolIds: editSchools, classIds: editClasses });
    setEditId(null); load();
  }

  return (
    <div className="glass-card p-5 fade-up" style={{ borderRadius: 18 }}>
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className="font-serif text-lg text-ink">{title}</h2>
          <span className="badge badge-info text-xs">{items.length} items</span>
        </div>
        <button onClick={() => { setForm({ title: '', description: '', language: 'en' }); setFile(null); setSchoolIds([]); setClassIds([]); setAddOpen(true); }} className="pill-btn pill-btn-primary text-sm whitespace-nowrap">+ Add New</button>
      </div>
      <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>Upload a PDF (≤{maxMB}MB) and assign it to multiple classes and schools.</p>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={`Add — ${title}`} subtitle="Upload & assign" maxWidth={620}>
        <form onSubmit={submit} className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <input placeholder="Title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={`${inp} flex-1 min-w-[140px]`} style={{ borderColor: 'var(--line)' }} required />
            <select value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} className={inp} style={{ borderColor: 'var(--line)' }}>
              <option value="en">English</option><option value="ar">Arabic</option><option value="fr">French</option>
            </select>
          </div>
          <input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={`${inp} w-full`} style={{ borderColor: 'var(--line)' }} />
          <input type="file" accept="application/pdf" onChange={e => setFile(e.target.files[0])} className="text-sm" />
          <div>
            <span className="text-xs font-black uppercase block mb-1" style={{ color: 'var(--muted)' }}>Assign to Schools</span>
            <div className="flex gap-2 flex-wrap">
              {schools.map(s => (
                <button key={s.id} type="button" onClick={() => toggle(schoolIds, setSchoolIds, s.id)}
                  className="px-2.5 py-1 rounded-full text-xs font-bold" style={schoolIds.includes(s.id) ? { background: 'var(--sky)', color: '#fff', border: 'none' } : { background: '#fff', border: '1px solid var(--line)', color: 'var(--muted)' }}>
                  {s.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs font-black uppercase block mb-1" style={{ color: 'var(--muted)' }}>Assign to Classes {schoolIds.length === 0 && <em style={{ textTransform: 'none', fontWeight: 400 }}>(select schools first)</em>}</span>
            <div className="flex gap-2 flex-wrap max-h-28 overflow-auto">
              {classes.filter(c => schoolIds.includes(c.schoolId)).map(c => (
                <button key={c.id} type="button" onClick={() => toggle(classIds, setClassIds, c.id)}
                  className="px-2.5 py-1 rounded-full text-xs font-bold" style={classIds.includes(c.id) ? { background: 'var(--leaf)', color: '#fff', border: 'none' } : { background: '#fff', border: '1px solid var(--line)', color: 'var(--muted)' }}>
                  {c.name}{c.school ? ` (${c.school.name})` : ''}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={() => setAddOpen(false)} className="pill-btn text-sm">Cancel</button>
            <button type="submit" disabled={busy} className="pill-btn pill-btn-primary text-sm" style={{ opacity: busy ? 0.6 : 1 }}>{busy ? 'Uploading…' : 'Upload & Assign'}</button>
          </div>
        </form>
      </Modal>

      <div className="space-y-2">
        {items.map(it => (
          <div key={it.id} className="rounded-xl border p-3 bg-white" style={{ borderColor: 'var(--line)' }}>
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <strong className="text-ink text-sm">{it.title}</strong>
                {it.language && <span className="badge badge-info text-xs ml-2">{it.language}</span>}
                <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                  {it.schools?.length || 0} schools · {it.classes?.length || 0} classes
                  {it.fileUrl && <> · <a href={it.fileUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--sky)' }}>📄 PDF</a></>}
                </div>
                {it.schools?.length > 0 && (
                  <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                    Schools: {it.schools.map(s => s.school?.name).filter(Boolean).join(', ')}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => editId === it.id ? setEditId(null) : startEdit(it)} className="text-xs font-bold" style={{ color: 'var(--sky)', border: 'none', background: 'none', cursor: 'pointer' }}>
                  {editId === it.id ? 'Close' : 'Edit assignments'}
                </button>
                <button onClick={() => remove(it.id)} className="text-xs font-bold" style={{ color: 'var(--danger)', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
              </div>
            </div>

            {editId === it.id && (
              <div className="mt-3 p-3 rounded-xl grid gap-3" style={{ background: '#fffaf4', border: '1px solid var(--line)' }}>
                <div>
                  <span className="text-xs font-black uppercase block mb-1" style={{ color: 'var(--muted)' }}>Schools</span>
                  <div className="flex gap-2 flex-wrap">
                    {schools.map(s => (
                      <button key={s.id} type="button" onClick={() => toggle(editSchools, setEditSchools, s.id)}
                        className="px-2.5 py-1 rounded-full text-xs font-bold" style={editSchools.includes(s.id) ? { background: 'var(--sky)', color: '#fff', border: 'none' } : { background: '#fff', border: '1px solid var(--line)', color: 'var(--muted)' }}>
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
                {endpoint !== '/formation' && (
                  <div>
                    <span className="text-xs font-black uppercase block mb-1" style={{ color: 'var(--muted)' }}>Classes {editSchools.length === 0 && <em style={{ textTransform: 'none', fontWeight: 400 }}>(select schools first)</em>}</span>
                    <div className="flex gap-2 flex-wrap max-h-28 overflow-auto">
                      {classes.filter(c => editSchools.includes(c.schoolId)).map(c => (
                        <button key={c.id} type="button" onClick={() => toggle(editClasses, setEditClasses, c.id)}
                          className="px-2.5 py-1 rounded-full text-xs font-bold" style={editClasses.includes(c.id) ? { background: 'var(--leaf)', color: '#fff', border: 'none' } : { background: '#fff', border: '1px solid var(--line)', color: 'var(--muted)' }}>
                          {c.name}{c.school ? ` (${c.school.name})` : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <button onClick={() => saveEdit(it.id)} className="pill-btn pill-btn-primary text-xs justify-self-start">Save assignments</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DocumentsAdmin() {
  return (
    <div className="space-y-4">
      <DocManager title="Curriculum" endpoint="/curriculum-docs" maxMB={12} />
      <DocManager title="Values Classes" endpoint="/values-classes" maxMB={12} />
      <DocManager title="Formation" endpoint="/formation" maxMB={12} />
    </div>
  );
}
