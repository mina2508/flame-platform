import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';

export default function ApplicationsAdmin() {
  const [apps, setApps] = useState([]);
  const [fields, setFields] = useState([]);

  async function load() {
    const [a, f] = await Promise.all([api.get('/applications'), api.get('/form-fields/all')]);
    setApps(a.data); setFields(f.data);
  }
  useEffect(() => { load(); }, []);

  async function remove(id) { if (confirm('Delete this application?')) { await api.delete(`/applications/${id}`); load(); } }

  function renderVal(v) {
    if (v === true) return '✓ Yes';
    if (v === false) return '✗ No';
    return String(v ?? '—');
  }

  return (
    <div className="glass-card p-5 fade-up" style={{ borderRadius: 18 }}>
      <h2 className="font-serif text-lg text-ink mb-1">Submitted Applications</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>{apps.length} applications received.</p>

      {apps.length === 0 ? (
        <div className="p-6 rounded-2xl border text-center" style={{ borderColor: 'var(--line)', borderStyle: 'dashed', color: 'var(--muted)' }}>
          No applications yet. Submissions from the public "Apply" form will appear here.
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map(a => (
            <div key={a.id} className="rounded-2xl border p-4 bg-white" style={{ borderColor: 'var(--line)' }}>
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs" style={{ color: 'var(--muted)' }}>{new Date(a.submittedAt).toLocaleString()}</span>
                <button onClick={() => remove(a.id)} className="text-xs font-bold" style={{ color: 'var(--danger)', border: 'none', background: 'none', cursor: 'pointer' }}>✕ Delete</button>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {fields.map(f => (
                  <div key={f.id} className="text-sm">
                    <span className="text-xs font-black uppercase block" style={{ color: 'var(--muted)' }}>{f.label}</span>
                    <span className="text-ink">{renderVal(a.values[f.key])}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
