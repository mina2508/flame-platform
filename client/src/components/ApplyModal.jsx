import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export default function ApplyModal({ open, onClose }) {
  const [fields, setFields] = useState([]);
  const [values, setValues] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      api.get('/form-fields').then(r => {
        setFields(r.data);
        const init = {};
        r.data.forEach(f => {
          if (f.type === 'toggle') init[f.key] = false;
          else if (f.type === 'rating') init[f.key] = f.options?.min || 1;
          else init[f.key] = '';
        });
        setValues(init);
        setSubmitted(false);
      });
    }
  }, [open]);

  if (!open) return null;

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/applications', { values });
      setSubmitted(true);
    } catch { alert('Submission failed'); }
    finally { setLoading(false); }
  }

  function update(key, val) {
    setValues(prev => ({ ...prev, [key]: val }));
  }

  function renderField(f) {
    const v = values[f.key];
    const cls = "w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-sky/30";
    const bdr = { borderColor: 'var(--line)' };

    switch (f.type) {
      case 'text':
        return <input className={cls} style={bdr} value={v || ''} onChange={e => update(f.key, e.target.value)} required={f.required} />;
      case 'number':
        return <input type="number" className={cls} style={bdr} value={v || ''} onChange={e => update(f.key, e.target.value)} required={f.required} />;
      case 'dropdown':
        return (
          <select className={cls} style={bdr} value={v || ''} onChange={e => update(f.key, e.target.value)} required={f.required}>
            <option value="">Select...</option>
            {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        );
      case 'toggle':
        return (
          <button type="button" onClick={() => update(f.key, !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold transition-colors"
            style={{ borderColor: 'var(--line)', background: v ? 'rgba(39,149,106,0.12)' : '#fff', color: v ? 'var(--good)' : 'var(--muted)' }}>
            {v ? '✓ Yes' : '✗ No'}
          </button>
        );
      case 'rating':
        const min = f.options?.min || 1;
        const max = f.options?.max || 10;
        return (
          <div className="flex items-center gap-2">
            {Array.from({ length: max - min + 1 }, (_, i) => i + min).map(n => (
              <button key={n} type="button" onClick={() => update(f.key, n)}
                className="w-9 h-9 rounded-full text-sm font-black transition-all"
                style={{
                  background: n <= (v || 0) ? 'linear-gradient(135deg, var(--flame), var(--flame-deep))' : '#f7efe5',
                  color: n <= (v || 0) ? '#fff' : 'var(--muted)',
                  border: 'none', cursor: 'pointer',
                }}>
                {n}
              </button>
            ))}
          </div>
        );
      default:
        return <input className={cls} style={bdr} value={v || ''} onChange={e => update(f.key, e.target.value)} />;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(16,33,58,0.5)', backdropFilter: 'blur(6px)' }}>
      <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" style={{ borderRadius: 24 }}>
        {submitted ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="font-serif font-bold text-ink text-xl">Application Submitted!</h2>
            <p className="mt-2" style={{ color: 'var(--muted)' }}>Thank you for applying to FLAME Function.</p>
            <button onClick={onClose} className="pill-btn pill-btn-primary mt-6">Close</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="eyebrow">FLAME Function</p>
                <h2 className="font-serif font-bold text-ink text-lg">Apply Now</h2>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-full grid place-items-center text-lg font-bold"
                style={{ background: '#f7efe5', color: 'var(--muted)', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={submit} className="space-y-4">
              {fields.map(f => (
                <label key={f.id} className="grid gap-1.5">
                  <span className="text-xs font-black uppercase" style={{ color: 'var(--muted)' }}>
                    {f.label} {f.required && <span style={{ color: 'var(--flame)' }}>*</span>}
                  </span>
                  {renderField(f)}
                </label>
              ))}
              <button type="submit" disabled={loading} className="pill-btn pill-btn-primary w-full mt-2">
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
