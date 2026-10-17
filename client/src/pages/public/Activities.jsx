import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { SkeletonGrid } from '../../components/Loader.jsx';

export default function Activities() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get('/activities')
      .then(r => { if (active) setItems(r.data); })
      .catch(() => { if (active) setError('Could not load activities. Please try again.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <div className="space-y-6">
      <div className="fade-up">
        <p className="eyebrow">Latest Activities</p>
        <h1 className="font-serif text-ink" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}>Activities</h1>
        <p className="mt-2" style={{ color: 'var(--muted)' }}>Joyful moments from our function family.</p>
      </div>

      {loading ? (
        <SkeletonGrid count={6} />
      ) : error ? (
        <div className="glass-card p-6 text-center" style={{ borderRadius: 20, color: 'var(--danger)' }}>{error}</div>
      ) : items.length === 0 ? (
        <div className="glass-card p-6 text-center" style={{ borderRadius: 20, color: 'var(--muted)' }}>No activities yet.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((a, i) => (
            <div key={a.id} className="glass-card overflow-hidden fade-up group transition-transform hover:-translate-y-1"
              style={{ borderRadius: 20, animationDelay: `${i * 0.06}s` }}>
              {a.imageUrl && (
                <div className="overflow-hidden h-52">
                  <img src={a.imageUrl} alt={a.caption} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                </div>
              )}
              <div className="p-4">
                <p className="text-xs" style={{ color: 'var(--muted)' }}>{a.activityDate?.slice(0, 10)}</p>
                <p className="font-bold text-sm mt-1 text-ink">{a.caption}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
