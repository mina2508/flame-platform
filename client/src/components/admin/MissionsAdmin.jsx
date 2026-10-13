import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import DateField from '../DateField.jsx';

export default function MissionsAdmin() {
  const [missions, setMissions] = useState([]);
  const [countries, setCountries] = useState([]);
  const [schools, setSchools] = useState([]);
  const [people, setPeople] = useState([]);
  const [medics, setMedics] = useState([]);
  const [typeFilter, setTypeFilter] = useState('');

  const MISSION_TYPES = ['Medical', 'Follow-ups', 'Activities', 'Values', 'Formation', 'Other'];
  // 3-state model: expected = not started, pending = started/in progress, completed = done
  const MISSION_STATUSES = ['expected', 'pending', 'completed'];
  const STATUS_LABEL = { expected: 'Expected (not started)', pending: 'Pending (in progress)', completed: 'Completed' };
  const [form, setForm] = useState({ title: '', type: 'Medical', typeOther: '', status: 'expected', startDate: '', endDate: '', summary: '', numPeople: '', durationDays: '', anonymousCount: 0 });
  const [editing, setEditing] = useState(null); // {id, status, startDate, endDate, summary}
  const [missionCountries, setMissionCountries] = useState([]); // [{countryId,startDate,endDate}]
  const [schoolIds, setSchoolIds] = useState([]);
  const [personIds, setPersonIds] = useState([]);
  const [medicalMemberIds, setMedicalMemberIds] = useState([]);

  async function load() {
    const q = typeFilter ? `?type=${typeFilter}` : '';
    setMissions((await api.get('/missions' + q)).data);
    setCountries((await api.get('/countries')).data);
    setSchools((await api.get('/schools')).data);
    setPeople((await api.get('/people')).data);
    setMedics((await api.get('/medical-team')).data);
  }
  useEffect(() => { load(); }, [typeFilter]);

  const toggle = (arr, set, id) => set(arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]);

  function addCountryRow() { setMissionCountries([...missionCountries, { countryId: '', startDate: '', endDate: '' }]); }
  function updateCountryRow(i, k, v) { const c = [...missionCountries]; c[i][k] = v; setMissionCountries(c); }

  async function submit(e) {
    e.preventDefault();
    if (schoolIds.length === 0) { alert('Select at least one school to visit.'); return; }
    if (form.endDate < form.startDate) { alert('End date must be on or after the start date.'); return; }
    const type = form.type === 'Other' ? (form.typeOther || 'Other') : form.type;
    await api.post('/missions', {
      title: form.title, type, status: form.status,
      startDate: form.startDate || null, endDate: form.endDate || null,
      summary: form.summary,
      numPeople: form.numPeople, durationDays: form.durationDays, anonymousCount: form.anonymousCount,
      countries: missionCountries.filter(c => c.countryId),
      schoolIds, personIds, medicalMemberIds,
    });
    setForm({ title: '', type: 'Medical', typeOther: '', status: 'expected', startDate: '', endDate: '', summary: '', numPeople: '', durationDays: '', anonymousCount: 0 });
    setMissionCountries([]); setSchoolIds([]); setPersonIds([]); setMedicalMemberIds([]);
    load();
  }
  async function remove(id) { if (confirm('Delete mission?')) { await api.delete(`/missions/${id}`); load(); } }

  function startEdit(m) {
    setEditing({
      id: m.id,
      status: m.status || 'expected',
      startDate: m.startDate ? m.startDate.slice(0, 10) : '',
      endDate: m.endDate ? m.endDate.slice(0, 10) : '',
      summary: m.summary || '',
    });
  }
  async function saveEdit() {
    const { id, ...data } = editing;
    await api.patch(`/missions/${id}`, data);
    setEditing(null);
    load();
  }

  const inp = "border rounded-xl px-3 py-2 text-sm";

  return (
    <div className="glass-card p-5 fade-up" style={{ borderRadius: 18 }}>
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <h2 className="font-serif text-lg text-ink">Missions</h2>
        <div className="flex gap-1 text-xs flex-wrap">
          {['', 'Medical', 'Follow-ups', 'Activities', 'Values', 'Formation'].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} className="px-3 py-1 rounded-full font-bold"
              style={typeFilter === t ? { background: 'var(--flame)', color: '#fff', border: 'none' } : { background: '#fff', border: '1px solid var(--line)', color: 'var(--muted)' }}>
              {t === '' ? 'All' : t === 'Medical' ? '🏥 Medical' : t}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={submit} className="grid gap-3 p-4 rounded-2xl mb-4" style={{ background: '#fffaf4', border: '1px solid var(--line)' }}>
        <div className="flex gap-2 flex-wrap">
          <input placeholder="Mission title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={`${inp} flex-1 min-w-[160px]`} style={{ borderColor: 'var(--line)' }} required />
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className={inp} style={{ borderColor: 'var(--line)' }}>
            {MISSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {form.type === 'Other' && (
            <input placeholder="Enter mission type *" value={form.typeOther} onChange={e => setForm({ ...form, typeOther: e.target.value })} className={`${inp} flex-1 min-w-[140px]`} style={{ borderColor: 'var(--line)' }} required />
          )}
          <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inp} style={{ borderColor: 'var(--line)' }} title="Status" required>
            {MISSION_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <label className="text-xs font-black uppercase" style={{ color: 'var(--muted)' }}>Start</label>
          <DateField value={form.startDate} onChange={v => setForm({ ...form, startDate: v })} placeholder="Start date" required />
          <label className="text-xs font-black uppercase" style={{ color: 'var(--muted)' }}>End</label>
          <DateField value={form.endDate} onChange={v => setForm({ ...form, endDate: v })} min={form.startDate} placeholder="End date" required />
          <span className="text-xs" style={{ color: 'var(--muted)' }}>Ongoing missions mark their members as unavailable</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input type="number" placeholder="Number of people" value={form.numPeople} onChange={e => setForm({ ...form, numPeople: e.target.value })} className={`${inp} flex-1`} style={{ borderColor: 'var(--line)' }} />
          <input type="number" placeholder="Duration (days)" value={form.durationDays} onChange={e => setForm({ ...form, durationDays: e.target.value })} className={`${inp} flex-1`} style={{ borderColor: 'var(--line)' }} />
          <input type="number" placeholder="Anonymous count" value={form.anonymousCount} onChange={e => setForm({ ...form, anonymousCount: e.target.value })} className={`${inp} flex-1`} style={{ borderColor: 'var(--line)' }} />
        </div>
        <textarea placeholder="Mission summary" value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} className={inp} rows={2} style={{ borderColor: 'var(--line)' }} />

        {/* Countries with dates */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-black uppercase" style={{ color: 'var(--muted)' }}>Countries (start / end per country)</span>
            <button type="button" onClick={addCountryRow} className="text-xs font-bold" style={{ color: 'var(--sky)', border: 'none', background: 'none', cursor: 'pointer' }}>+ Add country</button>
          </div>
          {missionCountries.map((c, i) => (
            <div key={i} className="flex gap-2 flex-wrap mb-2">
              <select value={c.countryId} onChange={e => updateCountryRow(i, 'countryId', e.target.value)} className={inp} style={{ borderColor: 'var(--line)' }}>
                <option value="">Country...</option>
                {countries.map(co => <option key={co.id} value={co.id}>{co.name}</option>)}
              </select>
              <DateField value={c.startDate} onChange={v => updateCountryRow(i, 'startDate', v)} placeholder="Country start" />
              <DateField value={c.endDate} onChange={v => updateCountryRow(i, 'endDate', v)} min={c.startDate} placeholder="Country end" />
            </div>
          ))}
        </div>

        {/* Schools to visit */}
        <div>
          <span className="text-xs font-black uppercase block mb-1" style={{ color: 'var(--muted)' }}>Schools to visit</span>
          <div className="flex gap-2 flex-wrap">
            {schools.map(s => (
              <button key={s.id} type="button" onClick={() => toggle(schoolIds, setSchoolIds, s.id)} className="px-2.5 py-1 rounded-full text-xs font-bold"
                style={schoolIds.includes(s.id) ? { background: 'var(--sky)', color: '#fff', border: 'none' } : { background: '#fff', border: '1px solid var(--line)', color: 'var(--muted)' }}>{s.name}</button>
            ))}
          </div>
        </div>

        {/* People (with availability) */}
        <div>
          <span className="text-xs font-black uppercase block mb-1" style={{ color: 'var(--muted)' }}>People (🟢 available / 🔴 not)</span>
          <div className="flex gap-2 flex-wrap max-h-28 overflow-auto">
            {people.map(p => (
              <button key={p.id} type="button" onClick={() => toggle(personIds, setPersonIds, p.id)} className="px-2.5 py-1 rounded-full text-xs font-bold"
                style={personIds.includes(p.id) ? { background: 'var(--leaf)', color: '#fff', border: 'none' } : { background: '#fff', border: '1px solid var(--line)', color: 'var(--muted)' }}>
                {p.available ? '🟢' : '🔴'} {p.fullName}
              </button>
            ))}
          </div>
        </div>

        {/* Medical team (only for medical missions) */}
        {form.type === 'Medical' && (
          <div>
            <span className="text-xs font-black uppercase block mb-1" style={{ color: 'var(--muted)' }}>Medical team (🟢 available / 🔴 not)</span>
            <div className="flex gap-2 flex-wrap">
              {medics.map(m => (
                <button key={m.id} type="button" onClick={() => toggle(medicalMemberIds, setMedicalMemberIds, m.id)} className="px-2.5 py-1 rounded-full text-xs font-bold"
                  style={medicalMemberIds.includes(m.id) ? { background: 'var(--flame)', color: '#fff', border: 'none' } : { background: '#fff', border: '1px solid var(--line)', color: 'var(--muted)' }}>
                  {m.available ? '🟢' : '🔴'} {m.fullName}
                </button>
              ))}
            </div>
          </div>
        )}

        <button className="pill-btn pill-btn-primary text-sm justify-self-start">+ Create Mission</button>
      </form>

      {/* Mission list */}
      <div className="space-y-2">
        {missions.map(m => {
          const statusColor = { expected: 'badge-info', pending: 'badge-watch', completed: 'badge-good' }[m.status] || 'badge-info';
          return (
          <div key={m.id} className="rounded-xl border p-3 bg-white" style={{ borderColor: 'var(--line)' }}>
            <div className="flex items-start justify-between">
              <div>
                <strong className="text-ink">{m.title}</strong>
                <span className={`badge ml-2 text-xs ${m.type === 'Medical' ? 'badge-danger' : 'badge-info'}`}>{m.type}</span>
                <span className={`badge ml-1 text-xs ${statusColor}`}>{m.status || 'expected'}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(m)} className="text-xs font-bold" style={{ color: 'var(--sky)', border: 'none', background: 'none', cursor: 'pointer' }}>Edit</button>
                <button onClick={() => remove(m.id)} className="text-xs font-bold" style={{ color: 'var(--danger)', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
              </div>
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              {(m.startDate || m.endDate) && <span className="font-bold">{m.startDate?.slice(0,10) || '?'} → {m.endDate?.slice(0,10) || '?'} · </span>}
              {m.countries?.map(c => `${c.country?.name}${c.startDate ? ` (${c.startDate.slice(0,10)}→${c.endDate?.slice(0,10) || '?'})` : ''}`).join(', ')}
              {m.schools?.length > 0 && ` · ${m.schools.length} schools`}
              {m.people?.length > 0 && ` · ${m.people.length} people`}
              {m.anonymousCount > 0 && ` + ${m.anonymousCount} anonymous`}
              {m.medicalTeam?.length > 0 && ` · ${m.medicalTeam.length} medics`}
            </div>
            {m.summary && <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{m.summary}</p>}

            {editing?.id === m.id && (
              <div className="mt-3 p-3 rounded-xl grid gap-2" style={{ background: '#fffaf4', border: '1px solid var(--line)' }}>
                <div className="flex gap-2 flex-wrap items-center">
                  <select value={editing.status} onChange={e => setEditing({ ...editing, status: e.target.value })} className={inp} style={{ borderColor: 'var(--line)' }}>
                    {MISSION_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </select>
                  <label className="text-xs font-black uppercase" style={{ color: 'var(--muted)' }}>Start</label>
                  <DateField value={editing.startDate} onChange={v => setEditing({ ...editing, startDate: v })} placeholder="Start date" />
                  <label className="text-xs font-black uppercase" style={{ color: 'var(--muted)' }}>End</label>
                  <DateField value={editing.endDate} onChange={v => setEditing({ ...editing, endDate: v })} min={editing.startDate} placeholder="End date" />
                </div>
                <textarea value={editing.summary} onChange={e => setEditing({ ...editing, summary: e.target.value })} className={inp} rows={2} style={{ borderColor: 'var(--line)' }} placeholder="Summary" />
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="pill-btn pill-btn-primary text-xs">Save</button>
                  <button onClick={() => setEditing(null)} className="pill-btn text-xs">Cancel</button>
                </div>
              </div>
            )}
          </div>
          );
        })}
      </div>
    </div>
  );
}
