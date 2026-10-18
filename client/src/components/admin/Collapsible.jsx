import { useState, useEffect } from 'react';
import { cachedGet } from '../../api/client.js';

// Collapsible section wrapper matching the CrudSection look.
// - Uncontrolled by default (manages its own open state).
// - Controlled when `open` + `onToggle` are provided — lets the parent enforce
//   accordion behaviour (only one section open at a time).
export default function Collapsible({ title, count, countEndpoint, children, defaultOpen = false, open: openProp, onToggle }) {
  const isControlled = openProp !== undefined;
  const [openState, setOpenState] = useState(defaultOpen);
  const open = isControlled ? openProp : openState;

  const [fetchedCount, setFetchedCount] = useState(null);

  useEffect(() => {
    if (!countEndpoint) return;
    let cancelled = false;
    // Count badges only need the length — use the cache + light people mode.
    const url = countEndpoint.includes('/people')
      ? countEndpoint + (countEndpoint.includes('?') ? '&' : '?') + 'light=1'
      : countEndpoint;
    cachedGet(url, { ttl: 30000 })
      .then(data => { if (!cancelled) setFetchedCount(Array.isArray(data) ? data.length : (data?.total ?? null)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [countEndpoint]);

  const shown = count != null ? count : fetchedCount;

  function toggle() {
    if (isControlled) onToggle?.();
    else setOpenState(o => !o);
  }

  return (
    <div className="glass-card p-4 fade-up" style={{ borderRadius: 18 }}>
      <button onClick={toggle}
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
