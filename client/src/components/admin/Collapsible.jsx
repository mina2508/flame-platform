import { useState, useEffect } from 'react';
import { api } from '../../api/client.js';

// Collapsible section wrapper matching the CrudSection look.
// Pass `count` directly, or `countEndpoint` to fetch the item count automatically.
export default function Collapsible({ title, count, countEndpoint, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const [fetchedCount, setFetchedCount] = useState(null);

  useEffect(() => {
    if (!countEndpoint) return;
    let cancelled = false;
    api.get(countEndpoint)
      .then(r => { if (!cancelled) setFetchedCount(Array.isArray(r.data) ? r.data.length : (r.data?.total ?? null)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [countEndpoint]);

  const shown = count != null ? count : fetchedCount;

  return (
    <div className="glass-card p-4 fade-up" style={{ borderRadius: 18 }}>
      <button onClick={() => setOpen(!open)}
        className="w-full text-left font-serif text-lg text-ink flex justify-between items-center"
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
        <span>{title}</span>
        <span className="text-sm" style={{ color: 'var(--muted)' }}>
          {shown != null ? `${shown} items ` : ''}{open ? '▲' : '▼'}
        </span>
      </button>
      {open && <div className="mt-4">{children}</div>}
    </div>
  );
}
