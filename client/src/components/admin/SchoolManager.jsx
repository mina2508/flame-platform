import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import PersonPicker from './PersonPicker.jsx';
import DateField from '../DateField.jsx';
import LocationPicker from './LocationPicker.jsx';
import Modal from './Modal.jsx';

export default function SchoolManager() {
  const [schools, setSchools] = useState([]);
  const [countries, setCountries] = useState([]);
  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState({ name: '', city: '', address: '', phone: '', email: '', countryId: '', latitude: null, longitude: null });
  const [busy, setBusy] = useState(false);

  async function load() {
    setSchools((await api.get('/schools')).data);
    setCountries((await api.get('/countries')).data);
  }
  useEffect(() => { load(); }, []);

  async function addSchool(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const { data } = await api.post('/schools', form);
      setSchools(prev => [...prev, data]);
      setForm({ name: '', city: '', address: '', phone: '', email: '', countryId: '', latitude: null, longitude: null });
      setAddOpen(false);
      load(); // background reconcile (brings nested relations / classes)
    } finally {
      setBusy(false);
    }
  }
  async function removeSchool(id) {
    if (!confirm('Delete school?')) return;
    const prev = schools;
    setSchools(schools.filter(s => s.id !== id));
    try { await api.delete(`/schools/${id}`); }
    catch { setSchools(prev); }
  }

  const [fCountry, setFCountry] = useState('');
  const filteredSchools = fCountry ? schools.filter(s => s.countryId === fCountry) : schools;
  const inp = "border rounded-xl px-3 py-2 text-sm";

  return (
    <div className="glass-card p-4 fade-up" style={{ borderRadius: 18 }}>
      <div className="flex justify-between items-center gap-2">
        <button onClick={() => setOpen(!open)} className="text-left font-serif text-lg text-ink flex items-center gap-2 flex-1" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <span>Schools</span>
          <span className="text-sm" style={{ color: 'var(--muted)' }}>{schools.length} items {open ? '▲' : '▼'}</span>
        </button>
        <button onClick={() => { setForm({ name: '', city: '', address: '', phone: '', email: '', countryId: '', latitude: null, longitude: null }); setAddOpen(true); }} className="pill-btn pill-btn-primary text-sm whitespace-nowrap">+ Add School</button>
      </div>

      {/* Add school modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add School" subtitle="New location" maxWidth={620}>
        <form onSubmit={addSchool} className="space-y-3">
          <input placeholder="School name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={`${inp} w-full`} style={{ borderColor: 'var(--line)' }} required />
          <select value={form.countryId} onChange={e => setForm({ ...form, countryId: e.target.value })} className={`${inp} w-full`} style={{ borderColor: 'var(--line)' }}>
            <option value="">Country...</option>
            {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="flex gap-2 flex-wrap">
            <input placeholder="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className={`${inp} flex-1 min-w-[100px]`} style={{ borderColor: 'var(--line)' }} />
            <input placeholder="Exact address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className={`${inp} flex-1 min-w-[100px]`} style={{ borderColor: 'var(--line)' }} />
          </div>
          <div className="flex gap-2 flex-wrap">
            <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={`${inp} flex-1 min-w-[100px]`} style={{ borderColor: 'var(--line)' }} />
            <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={`${inp} flex-1 min-w-[100px]`} style={{ borderColor: 'var(--line)' }} />
          </div>
          <LocationPicker
            value={{ latitude: form.latitude, longitude: form.longitude }}
            onChange={(lat, lng) => setForm({ ...form, latitude: lat, longitude: lng })}
            nameHint={form.name}
            cityHint={form.city}
            countryHint={countries.find(c => c.id === form.countryId)?.name || ''}
          />
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={() => setAddOpen(false)} className="pill-btn text-sm">Cancel</button>
            <button type="submit" disabled={busy} className="pill-btn pill-btn-primary text-sm" style={{ opacity: busy ? 0.6 : 1 }}>{busy ? 'Saving…' : 'Add School'}</button>
          </div>
        </form>
      </Modal>

      {open && (
        <div className="mt-4 space-y-4">
          {/* Filter */}
          <div className="flex items-center gap-3 flex-wrap">
            <select value={fCountry} onChange={e => setFCountry(e.target.value)} className={inp} style={{ borderColor: 'var(--line)' }}>
              <option value="">All countries</option>
              {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <span className="badge badge-info text-xs">{filteredSchools.length} schools</span>
          </div>

          {/* School list */}
          {filteredSchools.map(s => (
            <div key={s.id} className="rounded-xl border bg-white" style={{ borderColor: 'var(--line)' }}>
              <div className="flex items-center justify-between p-3">
                <button onClick={() => setExpanded(expanded === s.id ? null : s.id)} className="text-left flex-1" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <strong className="text-ink">{s.name}</strong>
                  <span className="text-xs ml-2" style={{ color: 'var(--muted)' }}>
                    {s.city} · {s.classes?.length || 0} classes
                    {s.latitude != null && s.longitude != null ? ' · 📍 located' : ' · 📍 no location'}
                    {' '}{expanded === s.id ? '▲' : '▼'}
                  </span>
                </button>
                <button onClick={() => removeSchool(s.id)} className="text-xs font-bold" style={{ color: 'var(--danger)', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
              </div>
              {expanded === s.id && <SchoolDetail school={s} onChange={load} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SchoolDetail({ school }) {
  const [classes, setClasses] = useState([]);
  const [newClass, setNewClass] = useState({ name: '', stage: '', teacherId: '' });
  const [studentFor, setStudentFor] = useState(null);
  const [board, setBoard] = useState(null);
  const [schoolLogTypes, setSchoolLogTypes] = useState([]);
  const [logForm, setLogForm] = useState({ logTypeId: 'medical_log', summary: '', logDate: '', status: 'expected', valuesClassId: '' });
  const [editingLog, setEditingLog] = useState(null); // { id, logTypeId, summary, logDate, status }
  const [schoolPeople, setSchoolPeople] = useState([]);
  const [allPeople, setAllPeople] = useState([]);
  const [assignPersonId, setAssignPersonId] = useState('');
  const [assignRole, setAssignRole] = useState('Principal');
  const SCHOOL_ROLES = ['Principal', 'Teacher', 'Worker', 'Resident', 'Priest', 'Other'];
  // Values classes available to pick when logging a Values Class at this school.
  const [valuesClasses, setValuesClasses] = useState([]);

  async function load() {
    setClasses((await api.get(`/classes?schoolId=${school.id}`)).data);
    setBoard((await api.get(`/schools/${school.id}/tasks`)).data);
    setSchoolLogTypes((await api.get('/logs/types/school')).data);
    setSchoolPeople((await api.get(`/people?schoolId=${school.id}`)).data);
    setAllPeople((await api.get('/people')).data);
    setValuesClasses((await api.get('/values-classes')).data);
  }
  useEffect(() => { load(); }, []);

  // Assign an existing person to THIS school with a role (Principal/Worker/Resident...).
  async function assignPerson(e) {
    e.preventDefault();
    if (!assignPersonId) { alert('Select a person.'); return; }
    await api.patch(`/people/${assignPersonId}`, { schoolId: school.id, position: assignRole });
    setAssignPersonId(''); setAssignRole('Principal');
    load();
  }
  // Change a school person's role, or remove them from the school.
  async function setPersonRole(personId, position) {
    await api.patch(`/people/${personId}`, { position });
    load();
  }
  async function removeFromSchool(personId) {
    if (confirm('Remove this person from the school?')) { await api.patch(`/people/${personId}`, { schoolId: null }); load(); }
  }

  async function createLog(e) {
    e.preventDefault();
    if (!logForm.summary.trim()) { alert('Summary is required.'); return; }
    if (!logForm.logDate) { alert('Date is required.'); return; }
    if (logForm.logTypeId === 'values_class' && !logForm.valuesClassId) { alert('Select a values class.'); return; }

    // When logging a Values Class, (a) record which values class in the summary,
    // and (b) make sure that values class is assigned to this school.
    let summary = logForm.summary;
    if (logForm.logTypeId === 'values_class' && logForm.valuesClassId) {
      const vc = valuesClasses.find(v => v.id === logForm.valuesClassId);
      if (vc) summary = `[${vc.title}] ${summary}`;
      // Ensure assignment to this school (idempotent — adds if not already assigned).
      const assignedSchoolIds = (vc?.schools || []).map(s => s.schoolId || s.school?.id).filter(Boolean);
      if (!assignedSchoolIds.includes(school.id)) {
        await api.patch(`/values-classes/${logForm.valuesClassId}`, { schoolIds: [...assignedSchoolIds, school.id] }).catch(() => {});
      }
      // Reflect the log status onto the per-school values-class status.
      await api.patch(`/values-classes/${logForm.valuesClassId}/school/${school.id}`, { status: logForm.status }).catch(() => {});
    }

    await api.post('/logs', {
      logTypeId: logForm.logTypeId, summary, logDate: logForm.logDate,
      status: logForm.status, schoolId: school.id,
    });
    setLogForm({ logTypeId: 'medical_log', summary: '', logDate: '', status: 'expected', valuesClassId: '' });
    load();
  }
  async function saveLogEdit() {
    if (!editingLog.summary.trim()) { alert('Summary is required.'); return; }
    if (!editingLog.logDate) { alert('Date is required.'); return; }
    const { id, ...data } = editingLog;
    await api.patch(`/logs/${id}`, data);
    setEditingLog(null);
    load();
  }
  async function deleteLog(id) {
    if (confirm('Delete this entry?')) { await api.delete(`/logs/${id}`); load(); }
  }

  // Update the per-school status of a task item (expected|pending|completed).
  async function setStatus(item, status) {
    if (item.kind === 'log') await api.patch(`/logs/${item.id}`, { status });
    else if (item.kind === 'values') await api.patch(`/values-classes/${item.id}/school/${school.id}`, { status });
    else if (item.kind === 'curriculum') await api.patch(`/curriculum-docs/${item.id}/school/${school.id}`, { status });
    else if (item.kind === 'formation') await api.patch(`/formation/${item.id}/school/${school.id}`, { status });
    load();
  }

  async function addClass(e) {
    e.preventDefault();
    await api.post('/classes', { ...newClass, schoolId: school.id, order: classes.length + 1 });
    setNewClass({ name: '', stage: '', teacherId: '' });
    load();
  }
  async function removeClass(id) { if (confirm('Delete class?')) { await api.delete(`/classes/${id}`); load(); } }

  const inp = "border rounded-lg px-3 py-2 text-sm";

  const STATUSES = ['expected', 'pending', 'completed'];
  const STATUS_LABEL = { expected: 'Expected', pending: 'Pending', completed: 'Completed' };
  const STATUS_COLOR = { expected: 'badge-info', pending: 'badge-watch', completed: 'badge-good' };

  const today = new Date().toISOString().slice(0, 10);
  const inpSm = "border rounded-lg px-2 py-1.5 text-sm";

  // Read-only items (assigned content: values/curriculum/formation) — status only
  function AssignRow({ item }) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border p-2 bg-white text-xs" style={{ borderColor: 'var(--line)' }}>
        <span className="flex-1 truncate">
          <span className={`badge ${STATUS_COLOR[item.status]} mr-2`}>{STATUS_LABEL[item.status] || item.status}</span>
          <span className="font-bold capitalize" style={{ color: 'var(--muted)' }}>{item.kind}</span> · {item.title}
        </span>
        <select value={item.status} onChange={e => setStatus(item, e.target.value)} className="border rounded-lg px-2 py-1 text-xs" style={{ borderColor: 'var(--line)' }}>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
      </div>
    );
  }

  // Editable school-level logs (medical log, principals visit, task, etc.)
  function LogRow({ item }) {
    const isEditing = editingLog?.id === item.id;
    if (isEditing) {
      return (
        <div className="rounded-lg border p-2 bg-white grid gap-2 text-xs" style={{ borderColor: 'var(--sky)' }}>
          <div className="flex gap-2 flex-wrap">
            <select value={editingLog.logTypeId} onChange={e => setEditingLog({ ...editingLog, logTypeId: e.target.value })} className={inpSm} style={{ borderColor: 'var(--line)' }}>
              {schoolLogTypes.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
            </select>
            <DateField value={editingLog.logDate} onChange={v => setEditingLog({ ...editingLog, logDate: v })} placeholder="Date" />
            <select value={editingLog.status} onChange={e => setEditingLog({ ...editingLog, status: e.target.value })} className={inpSm} style={{ borderColor: 'var(--line)' }}>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </div>
          <textarea value={editingLog.summary} onChange={e => setEditingLog({ ...editingLog, summary: e.target.value })} className={inpSm} rows={2} placeholder="Summary *" style={{ borderColor: 'var(--line)' }} />
          <div className="flex gap-2">
            <button onClick={saveLogEdit} className="pill-btn pill-btn-primary text-xs">Save</button>
            <button onClick={() => setEditingLog(null)} className="pill-btn text-xs">Cancel</button>
          </div>
        </div>
      );
    }
    return (
      <div className="rounded-lg border p-2 bg-white text-xs" style={{ borderColor: 'var(--line)' }}>
        <div className="flex items-center justify-between gap-2">
          <span className="flex-1">
            <span className={`badge ${STATUS_COLOR[item.status]} mr-2`}>{STATUS_LABEL[item.status] || item.status}</span>
            <strong>{item.title}</strong>
            {item.logDate && <span className="ml-1" style={{ color: 'var(--muted)' }}>· {String(item.logDate).slice(0, 10)}</span>}
          </span>
          <div className="flex gap-2">
            <button onClick={() => setEditingLog({ id: item.id, logTypeId: schoolLogTypes.find(t => t.label === item.title)?.id || 'task', summary: item.notes || '', logDate: String(item.logDate || '').slice(0, 10), status: item.status })} className="font-bold" style={{ color: 'var(--sky)', border: 'none', background: 'none', cursor: 'pointer' }}>Edit</button>
            <button onClick={() => deleteLog(item.id)} className="font-bold" style={{ color: 'var(--danger)', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
          </div>
        </div>
        {item.notes && <p className="mt-1" style={{ color: 'var(--muted)' }}>{item.notes}</p>}
      </div>
    );
  }

  const assigned = board ? [...board.values, ...board.curriculum, ...board.formation] : [];

  return (
    <div className="p-3 pt-0 space-y-3">
      {/* Create a school-level log / task (medical log, principals visit, task...) */}
      <div>
        <h4 className="text-xs font-black uppercase mb-2" style={{ color: 'var(--muted)' }}>Add Log / Task</h4>
        <form onSubmit={createLog} className="grid gap-2 p-3 rounded-xl" style={{ background: '#fffaf4', border: '1px solid var(--line)' }}>
          <div className="flex gap-2 flex-wrap">
            <select value={logForm.logTypeId} onChange={e => setLogForm({ ...logForm, logTypeId: e.target.value })} className={inpSm} style={{ borderColor: 'var(--line)' }} required>
              {schoolLogTypes.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
            </select>
            <DateField value={logForm.logDate} onChange={v => setLogForm({ ...logForm, logDate: v })} max={logForm.status === 'expected' ? undefined : today} placeholder="Date *" required />
            <select value={logForm.status} onChange={e => setLogForm({ ...logForm, status: e.target.value })} className={inpSm} style={{ borderColor: 'var(--line)' }}>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </div>
          {/* When logging a Values Class, pick which values class */}
          {logForm.logTypeId === 'values_class' && (
            <select value={logForm.valuesClassId} onChange={e => setLogForm({ ...logForm, valuesClassId: e.target.value })} className={inpSm} style={{ borderColor: 'var(--line)' }} required>
              <option value="">Select values class *...</option>
              {valuesClasses.map(v => <option key={v.id} value={v.id}>{v.title}</option>)}
            </select>
          )}
          <textarea placeholder="Summary * (what happened / what to do)" value={logForm.summary} onChange={e => setLogForm({ ...logForm, summary: e.target.value })} className={inpSm} rows={2} style={{ borderColor: 'var(--line)' }} required />
          <button className="pill-btn pill-btn-primary text-sm justify-self-start">+ Add Entry</button>
        </form>
      </div>

      {/* School-level logs/tasks — view, edit, delete */}
      {board && (
        <div>
          <h4 className="text-xs font-black uppercase mb-2" style={{ color: 'var(--muted)' }}>Logs & Tasks ({board.logs.length})</h4>
          {board.logs.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--muted)' }}>No logs or tasks yet.</p>
          ) : (
            <div className="grid gap-1.5">
              {board.logs.map(i => <LogRow key={`log-${i.id}`} item={i} />)}
            </div>
          )}
        </div>
      )}

      {/* Assigned content (values / curriculum / formation) — status only */}
      {assigned.length > 0 && (
        <div>
          <h4 className="text-xs font-black uppercase mb-2" style={{ color: 'var(--muted)' }}>Assigned Content ({assigned.length})</h4>
          <div className="grid gap-1.5">
            {board.values.map(i => <AssignRow key={`val-${i.id}`} item={i} />)}
            {board.curriculum.map(i => <AssignRow key={`cur-${i.id}`} item={i} />)}
            {board.formation.map(i => <AssignRow key={`form-${i.id}`} item={i} />)}
          </div>
        </div>
      )}

      {/* People & Roles — assign principal / worker / resident from existing people */}
      <div>
        <h4 className="text-xs font-black uppercase mb-2" style={{ color: 'var(--muted)' }}>People & Roles ({schoolPeople.length})</h4>
        <form onSubmit={assignPerson} className="flex gap-2 flex-wrap items-center p-3 rounded-xl mb-2" style={{ background: '#fffaf4', border: '1px solid var(--line)' }}>
          <select value={assignPersonId} onChange={e => setAssignPersonId(e.target.value)} className={inpSm} style={{ borderColor: 'var(--line)' }}>
            <option value="">Select a person...</option>
            {allPeople.map(p => (
              <option key={p.id} value={p.id}>
                {p.fullName}{p.isPriest ? ' (Priest)' : p.position ? ` (${p.position})` : ''}{p.schoolId === school.id ? ' — here' : p.school ? ` — ${p.school.name}` : ''}
              </option>
            ))}
          </select>
          <select value={assignRole} onChange={e => setAssignRole(e.target.value)} className={inpSm} style={{ borderColor: 'var(--line)' }}>
            {SCHOOL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button className="pill-btn pill-btn-primary text-xs">Assign to school</button>
        </form>
        {schoolPeople.length > 0 && (
          <div className="grid gap-1.5">
            {schoolPeople.map(p => (
              <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg border p-2 bg-white text-xs" style={{ borderColor: 'var(--line)' }}>
                <span className="flex-1 truncate">
                  <strong>{p.fullName}</strong>{p.isPriest && <span className="badge badge-info ml-2">Priest</span>}
                </span>
                <select value={p.position || 'Other'} onChange={e => setPersonRole(p.id, e.target.value)} className="border rounded-lg px-2 py-1 text-xs" style={{ borderColor: 'var(--line)' }}>
                  {SCHOOL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <button onClick={() => removeFromSchool(p.id)} className="font-bold" style={{ color: 'var(--danger)', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <h4 className="text-xs font-black uppercase" style={{ color: 'var(--muted)' }}>Classes</h4>
      <form onSubmit={addClass} className="grid gap-2 p-3 rounded-xl" style={{ background: '#fffaf4', border: '1px solid var(--line)' }}>
        <div className="flex gap-2 flex-wrap">
          <input placeholder="Class name (e.g. KG1) *" value={newClass.name} onChange={e => setNewClass({ ...newClass, name: e.target.value })} className={`${inp} flex-1`} style={{ borderColor: 'var(--line)' }} required />
          <input placeholder="Stage" value={newClass.stage} onChange={e => setNewClass({ ...newClass, stage: e.target.value })} className={`${inp} flex-1`} style={{ borderColor: 'var(--line)' }} />
        </div>
        <PersonPicker label="Class Teacher" value={newClass.teacherId} onSelect={id => setNewClass({ ...newClass, teacherId: id })} />
        <button className="pill-btn pill-btn-primary text-sm justify-self-start">+ Add Class</button>
      </form>

      {classes.map(c => (
        <div key={c.id} className="rounded-xl border p-3 bg-white" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-center justify-between">
            <div>
              <strong className="text-ink text-sm">{c.name}</strong>
              {c.teacher && <span className="text-xs ml-2" style={{ color: 'var(--muted)' }}>👩‍🏫 {c.teacher.fullName}</span>}
              <span className="text-xs ml-2" style={{ color: 'var(--muted)' }}>· {c.students?.length || 0} students</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStudentFor(studentFor === c.id ? null : c.id)} className="text-xs font-bold" style={{ color: 'var(--sky)', border: 'none', background: 'none', cursor: 'pointer' }}>+ Student</button>
              <button onClick={() => removeClass(c.id)} className="text-xs font-bold" style={{ color: 'var(--danger)', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
            </div>
          </div>
          {studentFor === c.id && <StudentForm classId={c.id} onDone={load} />}
          {c.students?.length > 0 && (
            <div className="mt-2 grid gap-1">
              {c.students.map(st => (
                <div key={st.id} className="text-xs rounded-lg px-2 py-1" style={{ background: '#fffaf4', color: 'var(--muted)' }}>
                  {st.fullName}{st.phone ? ` · ${st.phone}` : ''}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function StudentForm({ classId, onDone }) {
  const [f, setF] = useState({ fullName: '', birthday: '', phone: '', fatherName: '', fatherContact: '', motherName: '', motherContact: '' });
  const inp = "border rounded-lg px-2 py-1.5 text-sm";
  async function submit(e) {
    e.preventDefault();
    await api.post('/students', { ...f, classId });
    setF({ fullName: '', birthday: '', phone: '', fatherName: '', fatherContact: '', motherName: '', motherContact: '' });
    onDone();
  }
  return (
    <form onSubmit={submit} className="grid gap-2 mt-2 p-3 rounded-xl" style={{ background: '#fff', border: '1px solid var(--line)' }}>
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
  );
}
