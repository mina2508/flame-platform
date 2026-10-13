import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';

export default function News() {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get('/news').then(r => setItems(r.data)); }, []);

  return (
    <div className="space-y-6">
      <div className="fade-up">
        <p className="eyebrow">Latest Updates</p>
        <h1 className="font-serif text-ink" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}>Last News</h1>
        <p className="mt-2" style={{ color: 'var(--muted)' }}>Service updates for our function family.</p>
      </div>
      <div className="space-y-5">
        {items.map((n, i) => (
          <article key={n.id} className="glass-card overflow-hidden fade-up transition-transform hover:-translate-y-1"
            style={{ borderRadius: 20, animationDelay: `${i * 0.06}s` }}>
            <div className="grid md:grid-cols-[auto_1fr]">
              {n.imageUrl && (
                <img src={n.imageUrl} alt={n.title} className="w-full md:w-64 h-52 md:h-full object-cover" />
              )}
              <div className="p-5">
                <p className="text-xs" style={{ color: 'var(--muted)' }}>{n.postDate?.slice(0, 10)}</p>
                <h2 className="font-serif font-bold text-ink mt-1" style={{ fontSize: '1.3rem' }}>{n.title}</h2>
                <p className="text-sm mt-3 leading-relaxed" style={{ color: 'var(--muted)' }}>{n.body}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
