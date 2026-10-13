import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';

export default function Missions() {
  const [missions, setMissions] = useState([]);
  const [type, setType] = useState('');

  useEffect(() => {
    const q = type ? `?type=${encodeURIComponent(type)}` : '';
    api.get('/missions' + q).then(r => setMissions(r.data));
  }, [type]);

  const types = ['', 'Medical', 'Follow-ups', 'Activities', 'Values', 'Formation'];

  return (
    <div className="space-y-6">
      <div className="fade-up">
        <p className="eyebrow">World Missions</p>
        <h1 className="font-serif text-ink" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}>Missions</h1>
        <p className="mt-2" style={{ color: 'var(--muted)' }}>Mission journeys across the FLAME service.</p>
      </div>

      <div className="glass-card p-3 flex gap-2 flex-wrap fade-up" style={{ borderRadius: 16 }}>
        {types.map(t => (
          <button key={t} onClick={() => setType(t)} className="px-3 py-1.5 rounded-full text-sm font-bold"
            style={type === t
              ? { background: 'linear-gradient(135deg, var(--flame), var(--flame-deep))', color: '#fff', border: 'none', cursor: 'pointer' }
              : { background: '#fff', color: 'var(--muted)', border: '1px solid var(--line)', cursor: 'pointer' }}>
            {t === '' ? 'All' : t}
          </button>
        ))}
      </div>

      {missions.length === 0 && (
        <div className="p-6 rounded-2xl border text-center" style={{ borderColor: 'var(--line)', borderStyle: 'dashed', color: 'var(--muted)' }}>
          No missions to show.
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {missions.map((m, i) => (
          <div key={m.id} className="glass-card gradient-stripe relative overflow-hidden p-5 fade-up transition-transform hover:-translate-y-1"
            style={{ borderRadius: 20, animationDelay: `${i * 0.05}s` }}>
            <span className={`badge text-xs ${m.type === 'Medical' ? 'badge-danger' : 'badge-info'}`}>{m.type}</span>
            <h3 className="font-bold mt-3 text-ink">{m.title}</h3>
            {m.countries?.length > 0 && (
              <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
                🌍 {m.countries.map(c => c.country?.name).filter(Boolean).join(', ')}
              </p>
            )}
            <div className="flex gap-3 mt-2 text-xs" style={{ color: 'var(--muted)' }}>
              {m.numPeople != null && <span>👥 {m.numPeople}</span>}
              {m.durationDays != null && <span>⏱ {m.durationDays}d</span>}
              {m.schools?.length > 0 && <span>🏫 {m.schools.length}</span>}
            </div>
            {m.summary && <p className="text-sm mt-3 leading-relaxed" style={{ color: 'var(--muted)' }}>{m.summary}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
