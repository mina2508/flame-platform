import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';

export default function PriestsAdmin() {
  const [priests, setPriests] = useState([]);
  const [countries, setCountries] = useState([]);
  const [schools, setSchools] = useState([]);
  const [f, setF] = useState({ fullName: '', nationality: 'Egyptian', nationalityOther: '', priestCountryId: '', schoolId: '', position: '', contact: '', email: '' });

  const [fCountry, setFCountry] = useState('');

  async function loadBase() {
    setCountries((await api.get('/countries')).data);
    setSchools((await api.get('/schools')).data);
  }
  async function loadPriests(country = fCountry) {
    const params = new URLSearchParams({ isPriest: 'true' });
    if (country) params.append('countryId', country);
    setPriests((await api.get('/people?' + params.toString())).data);
  }
  useEffect(() => { loadBase(); }, []);
  useEffect(() => { loadPriests(); }, [fCountry]);
  const load = () => { loadBase(); loadPriests(); };

  const [busy, setBusy] = useState(false);

  async function add(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const nationality = f.nationality === 'Other' ? (f.nationalityOther || 'Other') : f.nationality;
      const { data } = await api.post('/people', {
        fullName: f.fullName, isPriest: true, nationality,
        priestCountryId: f.priestCountryId || null,
        schoolId: f.schoolId || null,
        position: f.position || 'Priest',
        contact: f.contact, email: f.email,
      });
      setPriests(prev => [data, ...prev.filter(p => p.id !== data.id)]);
      setF({ fullName: '', nationality: 'Egyptian', nationalityOther: '', priestCountryId: '', schoolId: '', position: '', contact: '', email: '' });
      setFCountry('');
      loadPriests(''); // background reconcile for nested relations
    } finally {
      setBusy(false);
    }
  }
  async function remove(id) {
    if (!confirm('Delete priest?')) return;
    const prev = priests;
    setPriests(priests.filter(p => p.id !== id));
    try { await api.delete(`/people/${id}`); }
    catch { setPriests(prev); }
  }

  const [editId, setEditId] = useState(null);
  const [editF, setEditF] = useState({});
  function startEdit(p) {
    setEditId(p.id);
    setEditF({ fullName: p.fullName || '', nationality: p.nationality || '', priestCountryId: p.priestCountryId || '', schoolId: p.schoolId || '', position: p.position || 'Priest', contact: p.contact || '', email: p.email || '' });
  }
  async function saveEdit(id) {
    const { data } = await api.patch(`/people/${id}`, { ...editF, priestCountryId: editF.priestCountryId || null, schoolId: editF.schoolId || null });
    setPriests(prev => prev.map(p => (p.id === id ? { ...p, ...data } : p)));
    setEditId(null);
    loadPriests(); // background reconcile
  }

  const inp = "border rounded-xl px-3 py-2 text-sm";
  const countryName = (id) => countries.find(c => c.id === id)?.name;
  const schoolName = (id) => schools.find(s => s.id === id)?.name;

  return (
    <div>
      <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>A priest is mainly assigned to a country, can also serve as principal/teacher/resident, and may be linked to a school.</p>

      <form onSubmit={add} className="grid gap-2 p-4 rounded-2xl mb-4" style={{ background: '#fffaf4', border: '1px solid var(--line)' }}>
        <div className="flex gap-2 flex-wrap">
          <input placeholder="Priest name *" value={f.fullName} onChange={e => setF({ ...f, fullName: e.target.value })} className={`${inp} flex-1 min-w-[160px]`} style={{ borderColor: 'var(--line)' }} required />
          <select value={f.nationality} onChange={e => setF({ ...f, nationality: e.target.value })} className={inp} style={{ borderColor: 'var(--line)' }}>
            <option value="Egyptian">Egyptian</option>
            <option value="Local">Local</option>
            <option value="Other">Other</option>
          </select>
          {f.nationality === 'Other' && (
            <input placeholder="Nationality *" value={f.nationalityOther} onChange={e => setF({ ...f, nationalityOther: e.target.value })} className={inp} style={{ borderColor: 'var(--line)' }} required />
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={f.priestCountryId} onChange={e => setF({ ...f, priestCountryId: e.target.value })} className={inp} style={{ borderColor: 'var(--line)' }}>
            <option value="">Assigned country...</option>
            {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={f.schoolId} onChange={e => setF({ ...f, schoolId: e.target.value })} className={inp} style={{ borderColor: 'var(--line)' }}>
            <option value="">School (optional)...</option>
            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={f.position} onChange={e => setF({ ...f, position: e.target.value })} className={inp} style={{ borderColor: 'var(--line)' }}>
            <option value="">Role (optional)...</option>
            <option value="Priest">Priest</option>
            <option value="Principal">Also Principal</option>
            <option value="Teacher">Also Teacher</option>
            <option value="Resident">Also Resident</option>
          </select>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input placeholder="Contact" value={f.contact} onChange={e => setF({ ...f, contact: e.target.value })} className={`${inp} flex-1`} style={{ borderColor: 'var(--line)' }} />
          <input placeholder="Email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} className={`${inp} flex-1`} style={{ borderColor: 'var(--line)' }} />
        </div>
        <button disabled={busy} className="pill-btn pill-btn-primary text-sm justify-self-start" style={{ opacity: busy ? 0.6 : 1 }}>{busy ? 'Saving…' : '+ Add Priest'}</button>
      </form>

      {/* Filter */}
      <div className="flex items-center gap-3 flex-wrap mb-3">
        <select value={fCountry} onChange={e => setFCountry(e.target.value)} className={inp} style={{ borderColor: 'var(--line)' }}>
          <option value="">All countries</option>
          {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <span className="badge badge-info text-xs">{priests.length} priests</span>
      </div>

      <div className="space-y-2">
        {priests.map(p => {
          // collect all roles this priest holds
          const roles = [];
          if (p.schoolId && p.position && p.position !== 'Priest') roles.push(`${p.position} @ ${p.school?.name || schoolName(p.schoolId)}`);
          else if (p.schoolId) roles.push(`At ${p.school?.name || schoolName(p.schoolId)}`);
          if (p.residence) roles.push(`Resident @ ${p.residence.name}`);
          if (p.classesTaught?.length > 0) roles.push(`Teaches ${p.classesTaught.map(c => c.name).join(', ')}`);
          return (
            <div key={p.id} className="rounded-xl border p-3 bg-white" style={{ borderColor: 'var(--line)' }}>
              {editId === p.id ? (
                <div className="grid gap-2">
                  <div className="flex gap-2 flex-wrap">
                    <input value={editF.fullName} onChange={e => setEditF({ ...editF, fullName: e.target.value })} className={`${inp} flex-1`} style={{ borderColor: 'var(--line)' }} placeholder="Name" />
                    <input value={editF.nationality} onChange={e => setEditF({ ...editF, nationality: e.target.value })} className={inp} style={{ borderColor: 'var(--line)' }} placeholder="Nationality" />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <select value={editF.priestCountryId} onChange={e => setEditF({ ...editF, priestCountryId: e.target.value })} className={inp} style={{ borderColor: 'var(--line)' }}>
                      <option value="">Assigned country...</option>
                      {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select value={editF.schoolId} onChange={e => setEditF({ ...editF, schoolId: e.target.value })} className={inp} style={{ borderColor: 'var(--line)' }}>
                      <option value="">School (optional)...</option>
                      {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <select value={editF.position} onChange={e => setEditF({ ...editF, position: e.target.value })} className={inp} style={{ borderColor: 'var(--line)' }}>
                      <option value="Priest">Priest</option>
                      <option value="Principal">Also Principal</option>
                      <option value="Teacher">Also Teacher</option>
                      <option value="Resident">Also Resident</option>
                    </select>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <input value={editF.contact} onChange={e => setEditF({ ...editF, contact: e.target.value })} className={`${inp} flex-1`} style={{ borderColor: 'var(--line)' }} placeholder="Contact" />
                    <input value={editF.email} onChange={e => setEditF({ ...editF, email: e.target.value })} className={`${inp} flex-1`} style={{ borderColor: 'var(--line)' }} placeholder="Email" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(p.id)} className="pill-btn pill-btn-primary text-xs">Save</button>
                    <button onClick={() => setEditId(null)} className="pill-btn text-xs">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <strong className="text-ink text-sm">⛪ {p.fullName}</strong>
                    <span className="text-xs ml-2" style={{ color: 'var(--muted)' }}>
                      {p.nationality || ''}{p.priestCountryId ? ` · 🌍 ${p.priestCountry?.name || countryName(p.priestCountryId) || ''}` : ''}
                    </span>
                    {roles.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {roles.map((r, i) => <span key={i} className="badge badge-good text-xs">{r}</span>)}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(p)} className="text-xs font-bold" style={{ color: 'var(--sky)', border: 'none', background: 'none', cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => remove(p.id)} className="text-xs font-bold" style={{ color: 'var(--danger)', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
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
