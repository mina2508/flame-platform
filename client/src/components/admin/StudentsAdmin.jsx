import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import DateField from '../DateField.jsx';

export default function StudentsAdmin() {
  const [schools, setSchools] = useState([]);
  const [countries, setCountries] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [schoolId, setSchoolId] = useState('');
  const [countryId, setCountryId] = useState(''); // create-form country
  const [fCountry, setFCountry] = useState('');
  const [fSchool, setFSchool] = useState('');
  const [f, setF] = useState({ fullName: '', birthday: '', phone: '', classId: '', fatherName: '', fatherContact: '', motherName: '', motherContact: '' });

  async function loadBase() {
    setSchools((await api.get('/schools')).data);
    setCountries((await api.get('/countries')).data);
  }
  useEffect(() => { loadBase(); }, []);

  async function loadStudents(country = fCountry, school = fSchool) {
    const params = new URLSearchParams();
    if (country) params.append('countryId', country);
    if (school) params.append('schoolId', school);
    setStudents((await api.get('/students' + (params.toString() ? `?${params}` : ''))).data);
  }
  useEffect(() => { loadStudents(); }, [fCountry, fSchool]);

  async function loadClasses(sid) {
    setClasses(sid ? (await api.get(`/classes?schoolId=${sid}`)).data : []);
  }

  async function add(e) {
    e.preventDefault();
    if (!f.classId) return alert('Select a country, school and class — a student must be linked to a class.');
    await api.post('/students', f);
    setF({ fullName: '', birthday: '', phone: '', classId: '', fatherName: '', fatherContact: '', motherName: '', motherContact: '' });
    setCountryId(''); setSchoolId(''); setClasses([]);
    setFCountry(''); setFSchool('');
    await loadStudents('', '');
  }
  async function remove(id) { if (confirm('Delete student?')) { await api.delete(`/students/${id}`); loadStudents(); } }

  const [editId, setEditId] = useState(null);
  const [editF, setEditF] = useState({});
  function startEdit(st) {
    setEditId(st.id);
    setEditF({ fullName: st.fullName || '', birthday: st.birthday ? st.birthday.slice(0,10) : '', phone: st.phone || '', fatherName: st.fatherName || '', fatherContact: st.fatherContact || '', motherName: st.motherName || '', motherContact: st.motherContact || '' });
  }
  async function saveEdit(id) {
    await api.patch(`/students/${id}`, { ...editF, birthday: editF.birthday || null });
    setEditId(null); loadStudents();
  }

  const inp = "border rounded-xl px-3 py-2 text-sm";
  const schoolsForCountry = fCountry ? schools.filter(s => s.countryId === fCountry) : schools;

  return (
    <div>
      <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>Create a student. Each student must be linked to a school and class.</p>

      <form onSubmit={add} className="grid gap-2 p-4 rounded-2xl mb-4" style={{ background: '#fffaf4', border: '1px solid var(--line)' }}>
        {/* Cascade: Country → School → Class */}
        <div className="flex gap-2 flex-wrap">
          <select value={countryId} onChange={e => { setCountryId(e.target.value); setSchoolId(''); setClasses([]); setF({ ...f, classId: '' }); }} className={inp} style={{ borderColor: 'var(--line)' }} required>
            <option value="">Country * ...</option>
            {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={schoolId} onChange={e => { setSchoolId(e.target.value); loadClasses(e.target.value); setF({ ...f, classId: '' }); }} className={inp} style={{ borderColor: 'var(--line)' }} required disabled={!countryId}>
            <option value="">School * ...</option>
            {schools.filter(s => s.countryId === countryId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={f.classId} onChange={e => setF({ ...f, classId: e.target.value })} className={inp} style={{ borderColor: 'var(--line)' }} required disabled={!schoolId}>
            <option value="">Class * ...</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {schoolId && classes.length === 0 && (
            <span className="text-xs self-center" style={{ color: 'var(--danger)' }}>No classes in this school yet — add one in Database → Schools.</span>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <input placeholder="Student name *" value={f.fullName} onChange={e => setF({ ...f, fullName: e.target.value })} className={`${inp} flex-1`} style={{ borderColor: 'var(--line)' }} required />
          <DateField value={f.birthday} onChange={v => setF({ ...f, birthday: v })} max={new Date().toISOString().slice(0,10)} placeholder="Birthday" />
          <input placeholder="Phone" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} className={inp} style={{ borderColor: 'var(--line)' }} />
        </div>
        <div className="flex gap-2 flex-wrap">
          <input placeholder="Father name" value={f.fatherName} onChange={e => setF({ ...f, fatherName: e.target.value })} className={`${inp} flex-1`} style={{ borderColor: 'var(--line)' }} />
          <input placeholder="Father contact" value={f.fatherContact} onChange={e => setF({ ...f, fatherContact: e.target.value })} className={`${inp} flex-1`} style={{ borderColor: 'var(--line)' }} />
        </div>
        <div className="flex gap-2 flex-wrap">
          <input placeholder="Mother name" value={f.motherName} onChange={e => setF({ ...f, motherName: e.target.value })} className={`${inp} flex-1`} style={{ borderColor: 'var(--line)' }} />
          <input placeholder="Mother contact" value={f.motherContact} onChange={e => setF({ ...f, motherContact: e.target.value })} className={`${inp} flex-1`} style={{ borderColor: 'var(--line)' }} />
        </div>
        <button className="pill-btn pill-btn-primary text-sm justify-self-start">+ Add Student</button>
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
        <span className="badge badge-info text-xs">{students.length} students</span>
      </div>

      <div className="space-y-2">
        {students.map(st => (
          <div key={st.id} className="rounded-xl border p-3 bg-white" style={{ borderColor: 'var(--line)' }}>
            {editId === st.id ? (
              <div className="grid gap-2">
                <div className="flex gap-2 flex-wrap">
                  <input value={editF.fullName} onChange={e => setEditF({ ...editF, fullName: e.target.value })} className={`${inp} flex-1`} style={{ borderColor: 'var(--line)' }} placeholder="Name" />
                  <DateField value={editF.birthday} onChange={v => setEditF({ ...editF, birthday: v })} max={new Date().toISOString().slice(0,10)} placeholder="Birthday" />
                  <input value={editF.phone} onChange={e => setEditF({ ...editF, phone: e.target.value })} className={inp} style={{ borderColor: 'var(--line)' }} placeholder="Phone" />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <input value={editF.fatherName} onChange={e => setEditF({ ...editF, fatherName: e.target.value })} className={`${inp} flex-1`} style={{ borderColor: 'var(--line)' }} placeholder="Father name" />
                  <input value={editF.fatherContact} onChange={e => setEditF({ ...editF, fatherContact: e.target.value })} className={`${inp} flex-1`} style={{ borderColor: 'var(--line)' }} placeholder="Father contact" />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <input value={editF.motherName} onChange={e => setEditF({ ...editF, motherName: e.target.value })} className={`${inp} flex-1`} style={{ borderColor: 'var(--line)' }} placeholder="Mother name" />
                  <input value={editF.motherContact} onChange={e => setEditF({ ...editF, motherContact: e.target.value })} className={`${inp} flex-1`} style={{ borderColor: 'var(--line)' }} placeholder="Mother contact" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(st.id)} className="pill-btn pill-btn-primary text-xs">Save</button>
                  <button onClick={() => setEditId(null)} className="pill-btn text-xs">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <strong className="text-ink text-sm">{st.fullName}</strong>
                  <span className="text-xs ml-2" style={{ color: 'var(--muted)' }}>
                    {st.classLevel?.school?.name ? `🏫 ${st.classLevel.school.name}` : ''} {st.classLevel?.name ? `· ${st.classLevel.name}` : ''}
                    {st.phone ? ` · ${st.phone}` : ''}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(st)} className="text-xs font-bold" style={{ color: 'var(--sky)', border: 'none', background: 'none', cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => remove(st.id)} className="text-xs font-bold" style={{ color: 'var(--danger)', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
