import { useEffect, useRef, useState } from 'react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WEEKDAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

const pad = (n) => String(n).padStart(2, '0');
const toISO = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const parseISO = (s) => {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return { y, m: m - 1, d };
};
const prettyLabel = (s) => {
  const p = parseISO(s);
  if (!p) return '';
  return `${pad(p.d)} ${MONTHS[p.m].slice(0, 3)} ${p.y}`;
};

/**
 * Friendly date picker. Drop-in replacement for <input type="date">.
 * Props: value (YYYY-MM-DD), onChange(YYYY-MM-DD), min, max, placeholder, required, className, style
 */
export default function DateField({ value = '', onChange, min, max, placeholder = 'Select date', required, className = '', style = {} }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const now = new Date();
  const sel = parseISO(value);
  const [viewY, setViewY] = useState(sel ? sel.y : now.getFullYear());
  const [viewM, setViewM] = useState(sel ? sel.m : now.getMonth());
  const ref = useRef(null);
  const btnRef = useRef(null);
  const popRef = useRef(null);

  const POP_W = 280, POP_H = 330;

  function reposition() {
    const b = btnRef.current?.getBoundingClientRect();
    if (!b) return;
    const vw = window.innerWidth, vh = window.innerHeight;
    let left = b.left;
    if (left + POP_W > vw - 8) left = Math.max(8, vw - POP_W - 8);
    let top = b.bottom + 6;
    if (top + POP_H > vh - 8 && b.top - POP_H - 6 > 8) top = b.top - POP_H - 6;
    setPos({ top, left });
  }

  useEffect(() => {
    const sp = parseISO(value);
    if (sp) { setViewY(sp.y); setViewM(sp.m); }
  }, [value]);

  useEffect(() => {
    if (!open) return;
    reposition();
    function onDoc(e) {
      if (ref.current?.contains(e.target)) return;
      if (popRef.current?.contains(e.target)) return;
      setOpen(false);
    }
    function onMove() { reposition(); }
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }, [open]);

  const minP = parseISO(min); const maxP = parseISO(max);
  const outOfRange = (y, m, d) => {
    const t = new Date(y, m, d).setHours(0, 0, 0, 0);
    if (minP && t < new Date(minP.y, minP.m, minP.d).getTime()) return true;
    if (maxP && t > new Date(maxP.y, maxP.m, maxP.d).getTime()) return true;
    return false;
  };

  const firstDay = new Date(viewY, viewM, 1).getDay();
  const daysInMonth = new Date(viewY, viewM + 1, 0).getDate();

  function pick(d) {
    if (outOfRange(viewY, viewM, d)) return;
    onChange?.(toISO(viewY, viewM, d));
    setOpen(false);
  }
  function prevMonth() { if (viewM === 0) { setViewM(11); setViewY(viewY - 1); } else setViewM(viewM - 1); }
  function nextMonth() { if (viewM === 11) { setViewM(0); setViewY(viewY + 1); } else setViewM(viewM + 1); }

  const years = [];
  for (let y = now.getFullYear() - 80; y <= now.getFullYear() + 10; y++) years.push(y);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const popStyle = isMobile
    ? { position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 'min(340px, 92vw)', zIndex: 1000 }
    : { position: 'fixed', top: pos.top, left: pos.left, width: POP_W, zIndex: 1000 };

  return (
    <div ref={ref} className="relative inline-block" style={{ minWidth: 150 }}>
      <button ref={btnRef} type="button" onClick={() => setOpen(!open)}
        className={`w-full text-left flex items-center justify-between gap-2 ${className}`}
        style={{ border: '1px solid var(--line)', borderRadius: 12, padding: '8px 12px', background: '#fff', cursor: 'pointer', fontSize: '0.875rem', color: value ? 'var(--ink)' : 'var(--muted)', ...style }}>
        <span>{value ? prettyLabel(value) : placeholder}</span>
        <span style={{ color: 'var(--sky)' }}>📅</span>
      </button>
      {required && <input type="text" value={value || ''} required readOnly tabIndex={-1}
        style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }} />}

      {open && (
        <>
          {/* Backdrop (mobile = dim, desktop = invisible click-catcher) */}
          <div onMouseDown={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 999, background: isMobile ? 'rgba(16,33,58,0.35)' : 'transparent' }} />
          <div ref={popRef} className="p-3" style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, boxShadow: '0 20px 50px rgba(16,33,58,0.22)', ...popStyle }}>
          {/* Header: month nav + month/year selects */}
          <div className="flex items-center gap-2 mb-2">
            <button type="button" onClick={prevMonth} className="pill-btn" style={{ minHeight: 32, padding: '0 10px' }}>‹</button>
            <select value={viewM} onChange={e => setViewM(Number(e.target.value))} className="flex-1" style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '4px 6px', fontSize: '0.8rem' }}>
              {MONTHS.map((mn, i) => <option key={mn} value={i}>{mn}</option>)}
            </select>
            <select value={viewY} onChange={e => setViewY(Number(e.target.value))} style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '4px 6px', fontSize: '0.8rem' }}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button type="button" onClick={nextMonth} className="pill-btn" style={{ minHeight: 32, padding: '0 10px' }}>›</button>
          </div>

          {/* Weekday row */}
          <div className="grid grid-cols-7 text-center mb-1" style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--muted)' }}>
            {WEEKDAYS.map(w => <div key={w}>{w}</div>)}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={'e' + i} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1;
              const isSel = sel && sel.y === viewY && sel.m === viewM && sel.d === d;
              const isToday = now.getFullYear() === viewY && now.getMonth() === viewM && now.getDate() === d;
              const disabled = outOfRange(viewY, viewM, d);
              return (
                <button key={d} type="button" disabled={disabled} onClick={() => pick(d)}
                  className="aspect-square rounded-lg text-xs transition-colors"
                  style={{
                    border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.3 : 1,
                    background: isSel ? 'linear-gradient(135deg, var(--flame), var(--flame-deep))' : (isToday ? 'rgba(52,169,214,0.14)' : 'transparent'),
                    color: isSel ? '#fff' : 'var(--ink)',
                    fontWeight: isSel || isToday ? 800 : 500,
                  }}>
                  {d}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: '1px solid var(--line)' }}>
            <button type="button" onClick={() => { onChange?.(''); setOpen(false); }} className="text-xs font-bold" style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
            <button type="button" onClick={() => { if (!outOfRange(now.getFullYear(), now.getMonth(), now.getDate())) { onChange?.(toISO(now.getFullYear(), now.getMonth(), now.getDate())); setOpen(false); } }} className="text-xs font-bold" style={{ color: 'var(--sky)', background: 'none', border: 'none', cursor: 'pointer' }}>Today</button>
          </div>
          </div>
        </>
      )}
    </div>
  );
}
