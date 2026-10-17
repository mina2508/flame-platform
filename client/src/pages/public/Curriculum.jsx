import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { SkeletonGrid } from '../../components/Loader.jsx';

const LANG = { en: 'English', ar: 'Arabic', fr: 'French' };
const TABS = [
  { id: 'curriculum', label: '📚 Curriculum', endpoint: '/curriculum-docs' },
  { id: 'values', label: '❤ Values Classes', endpoint: '/values-classes' },
  { id: 'formation', label: '📖 Formation', endpoint: '/formation' },
];

export default function Curriculum() {
  const [tab, setTab] = useState('curriculum');
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const t = TABS.find(t => t.id === tab);
    if (!t) return;
    let active = true;
    setLoading(true);
    setError(null);
    api.get(t.endpoint)
      .then(r => { if (active) setItems(r.data); })
      .catch(() => { if (active) setError('Could not load this category. Please try again.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [tab]);

  const filtered = q
    ? items.filter(c => (c.description || c.title || '').toLowerCase().includes(q.toLowerCase()))
    : items;

  return (
    <div className="space-y-6">
      <div className="fade-up">
        <p className="eyebrow">FLAME Public Library</p>
        <h1 className="font-serif text-ink" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}>Library</h1>
        <p className="mt-2" style={{ color: 'var(--muted)' }}>Browse curriculum, values classes, and formation materials.</p>
      </div>

      {/* Tabs */}
      <div className="glass-card p-2 flex gap-2 flex-wrap fade-up" style={{ borderRadius: 16 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setQ(''); }}
            className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
            style={tab === t.id
              ? { background: 'linear-gradient(135deg, var(--flame), var(--flame-deep))', color: '#fff', border: 'none', cursor: 'pointer' }
              : { background: 'transparent', color: 'var(--ink)', border: 'none', cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="glass-card p-4 fade-up flex items-center gap-4 flex-wrap" style={{ borderRadius: 20, animationDelay: '0.1s' }}>
        <input placeholder="🔍 Search by title or description..." value={q} onChange={e => setQ(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2.5 rounded-full border text-sm outline-none focus:ring-2 focus:ring-sky/30"
          style={{ borderColor: 'var(--line)', background: '#fff' }} />
        {q && <button onClick={() => setQ('')} className="text-sm font-bold" style={{ color: 'var(--danger)' }}>Clear</button>}
        <div className="text-xs" style={{ color: 'var(--muted)' }}>
          <strong className="text-ink">{filtered.length}</strong> files
        </div>
      </div>

      {/* List */}
      {loading && <SkeletonGrid count={6} />}

      {!loading && error && (
        <div className="glass-card p-6 text-center" style={{ borderRadius: 20, color: 'var(--danger)' }}>{error}</div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="p-6 rounded-2xl border text-center" style={{ borderColor: 'var(--line)', borderStyle: 'dashed', color: 'var(--muted)' }}>
          No files yet in this category.
        </div>
      )}

      {!loading && !error && (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c, i) => (
          <div key={c.id} className="glass-card p-5 fade-up transition-transform hover:-translate-y-1"
            style={{ borderRadius: 20, animationDelay: `${i * 0.04}s` }}>
            <span className="badge text-xs" style={{ color: 'var(--flame-deep)', background: '#fff2ec' }}>PDF</span>
            <h3 className="font-bold mt-3 text-ink">{c.title}</h3>
            {c.language && <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{LANG[c.language] || c.language}</p>}
            {c.description && <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{c.description}</p>}
            {(c.schools?.length > 0 || c.classes?.length > 0) && (
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                {c.schools?.length || 0} schools · {c.classes?.length || 0} classes
              </p>
            )}
            {c.fileUrl && (
              <a href={c.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-sm font-bold" style={{ color: 'var(--sky)' }}>
                Open PDF →
              </a>
            )}
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
