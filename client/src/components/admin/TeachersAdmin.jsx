import { useEffect, useState } from 'react';
import { api, cachedGet } from '../../api/client.js';
import DateField from '../DateField.jsx';

export default function TeachersAdmin() {
  const [teachers, setTeachers] = useState([]);
  const [countries, setCountries] = useState([]);
  const [schools, setSchools] = useState([]);
  const [classes, setClasses] = useState([]);
  // filters
  const [fCountry, setFCountry] = useState('');
  const [fSchool, setFSchool] = useState('');
  // create form
  const [f, setF] = useState({ fullName: '', birthdate: '', nationality: '', contact: '', email: '', schoolId: '', classId: '' });
  const today = new Date().toISOString().slice(0, 10);

  async function loadBase() {
    const [c, s] = await Promise.all([cachedGet('/countries'), cachedGet('/schools')]);
    setCountries(c); setSchools(s);
  }
  useEffect(() => { loadBase(); }, []);

  async function loadTeachers(country = fCountry, school = fSchool) {
    const params = new URLSearchParams({ type: 'Teacher' });
    if (country) params.append('countryId', country);
    if (school) params.append('schoolId', school);
    setTeachers((await api.get('/people?' + params.toString())).data);
  }
  useEffect(() => { loadTeachers(); }, [fCountry, fSchool]);

  async function loadClasses(sid) {
    setClasses(sid ? (await api.get(`/classes?schoolId=${sid}`)).data : []);
  }

  const [busy, setBusy] = useState(false);

  async function add(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const chosenSchool = schools.find(s => s.id === f.schoolId);
      const chosenClass = classes.find(c => c.id === f.classId);
      const { data } = await api.post('/people', {
        fullName: f.fullName, birthdate: f.birthdate || null, position: 'Teacher',
        nationality: f.nationality, contact: f.contact, email: f.email, schoolId: f.schoolId || null,
      });
      // assign as class teacher if a class was chosen
      if (f.classId) await api.patch(`/classes/${f.classId}`, { teacherId: data.id });

      // Optimistically show the new teacher immediately (clear filters so it's visible).
      const optimistic = {
        ...data,
        school: chosenSchool ? { name: chosenSchool.name, countryRef: null } : null,
        classesTaught: chosenClass ? [{ name: chosenClass.name }] : [],
      };
      setFCountry(''); setFSchool('');
      setTeachers(prev => [optimistic, ...prev.filter(t => t.id !== data.id)]);
      setF({ fullName: '', birthdate: '', nationality: '', contact: '', email: '', schoolId: '', classId: '' });

      // Reconcile with the server (fills in nested relations) without blocking the UI.
      loadTeachers('', '');
    } finally {
      setBusy(false);
    }
  }
  async function remove(id) {
    if (!confirm('Delete teacher?')) return;
    const prev = teachers;
    setTeachers(teachers.filter(t => t.id !== id)); // optimistic
    try { await api.delete(`/people/${id}`); }
    catch { setTeachers(prev); }
  }

  const [editId, setEditId] = useState(null);
  const [editF, setEditF] = useState({});
  function startEdit(t) {
    setEditId(t.id);
    setEditF({ fullName: t.fullName || '', birthdate: t.birthdate ? t.birthdate.slice(0,10) : '', nationality: t.nationality || '', contact: t.contact || '', email: t.email || '', schoolId: t.schoolId || '' });
  }
  async function saveEdit(id) {
    const { data } = await api.patch(`/people/${id}`, { ...editF, birthdate: editF.birthdate || null, schoolId: editF.schoolId || null });
    // Merge the updated fields in place so the change shows instantly.
    setTeachers(prev => prev.map(t => (t.id === id ? { ...t, ...data } : t)));
    setEditId(null);
    loadTeachers(); // background reconcile for nested relations
  }

  const inp = "border rounded-xl px-3 py-2 text-sm";
  const schoolsForCountry = fCountry ? schools.filter(s => s.countryId === fCountry) : schools;

  return (
    <div>
      <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>Create a teacher and assign to a school/class. Filter by country and school.</p>

      {/* Create form */}
      <form onSubmit={add} className="grid gap-2 p-4 rounded-2xl mb-4" style={{ background: '#fffaf4', border: '1px solid var(--line)' }}>
        <div className="flex gap-2 flex-wrap">
          <input placeholder="Teacher name *" value={f.fullName} onChange={e => setF({ ...f, fullName: e.target.value })} className={`${inp} flex-1 min-w-[140px]`} style={{ borderColor: 'var(--line)' }} required />
          <div>
            <span className="text-xs font-black uppercase block mb-1" style={{ color: 'var(--muted)' }}>Birthdate</span>
            <DateField value={f.birthdate} onChange={v => setF({ ...f, birthdate: v })} max={today} placeholder="Birthdate" />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input placeholder="Nationality" value={f.nationality} onChange={e => setF({ ...f, nationality: e.target.value })} className={`${inp} flex-1`} style={{ borderColor: 'var(--line)' }} />
          <input placeholder="Contact" value={f.contact} onChange={e => setF({ ...f, contact: e.target.value })} className={`${inp} flex-1`} style={{ borderColor: 'var(--line)' }} />
          <input placeholder="Email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} className={`${inp} flex-1`} style={{ borderColor: 'var(--line)' }} />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={f.schoolId} onChange={e => { setF({ ...f, schoolId: e.target.value, classId: '' }); loadClasses(e.target.value); }} className={inp} style={{ borderColor: 'var(--line)' }}>
            <option value="">School...</option>
            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={f.classId} onChange={e => setF({ ...f, classId: e.target.value })} className={inp} style={{ borderColor: 'var(--line)' }} disabled={!f.schoolId}>
            <option value="">Class (optional)...</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <button disabled={busy} className="pill-btn pill-btn-primary text-sm justify-self-start" style={{ opacity: busy ? 0.6 : 1 }}>{busy ? 'Saving…' : '+ Add Teacher'}</button>
      </form>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap mb-3">
        <select value={fCountry} onChange={e => { setFCountry(e.target.value); setFSchool(''); }} className={inp} style={{ borderColor: 'var(--line)' }}>
          <option value="">All countries</option>
          {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={fSchool} onChange={e => setFSchool(e.target.value)} className={inp} style={{ borderColor: 'var(--line)' }}>
          <option value="">All schools</option>
          {schoolsForCountry.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <span className="badge badge-info text-xs">{teachers.length} teachers</span>
      </div>

      {/* List */}
      <div className="space-y-2">
        {teachers.map(t => (
          <div key={t.id} className="rounded-xl border p-3 bg-white" style={{ borderColor: 'var(--line)' }}>
            {editId === t.id ? (
              <div className="grid gap-2">
                <div className="flex gap-2 flex-wrap">
                  <input value={editF.fullName} onChange={e => setEditF({ ...editF, fullName: e.target.value })} className={`${inp} flex-1`} style={{ borderColor: 'var(--line)' }} placeholder="Name" />
                  <DateField value={editF.birthdate} onChange={v => setEditF({ ...editF, birthdate: v })} max={today} placeholder="Birthdate" />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <input value={editF.nationality} onChange={e => setEditF({ ...editF, nationality: e.target.value })} className={`${inp} flex-1`} style={{ borderColor: 'var(--line)' }} placeholder="Nationality" />
                  <input value={editF.contact} onChange={e => setEditF({ ...editF, contact: e.target.value })} className={`${inp} flex-1`} style={{ borderColor: 'var(--line)' }} placeholder="Contact" />
                  <input value={editF.email} onChange={e => setEditF({ ...editF, email: e.target.value })} className={`${inp} flex-1`} style={{ borderColor: 'var(--line)' }} placeholder="Email" />
                </div>
                <select value={editF.schoolId} onChange={e => setEditF({ ...editF, schoolId: e.target.value })} className={inp} style={{ borderColor: 'var(--line)' }}>
                  <option value="">Unassigned</option>
                  {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(t.id)} className="pill-btn pill-btn-primary text-xs">Save</button>
                  <button onClick={() => setEditId(null)} className="pill-btn text-xs">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <strong className="text-ink text-sm">👩‍🏫 {t.fullName}</strong>
                  <span className="text-xs ml-2" style={{ color: 'var(--muted)' }}>
                    {t.school?.name ? `🏫 ${t.school.name}` : 'Unassigned'}
                    {t.school?.countryRef?.name ? ` · 🌍 ${t.school.countryRef.name}` : ''}
                    {t.classesTaught?.length > 0 ? ` · teaches ${t.classesTaught.map(c => c.name).join(', ')}` : ''}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(t)} className="text-xs font-bold" style={{ color: 'var(--sky)', border: 'none', background: 'none', cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => remove(t.id)} className="text-xs font-bold" style={{ color: 'var(--danger)', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
