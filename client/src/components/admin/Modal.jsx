import { useEffect } from 'react';

// Reusable, responsive modal/popup for admin "Add new" and "Edit" forms.
// - Desktop: centered card, width capped at `maxWidth`.
// - Mobile: full-width bottom sheet, height-capped, body scrolls internally.
// - Sticky header (title + close) stays visible while the body scrolls.
// - Click backdrop or press Esc to close; background scroll is locked.
export default function Modal({ open, onClose, title, subtitle, children, maxWidth = 560 }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="modal-card glass-card"
        style={{ maxWidth }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="min-w-0">
            {subtitle && <p className="eyebrow">{subtitle}</p>}
            <h2 className="font-serif font-bold text-ink text-lg truncate">{title}</h2>
          </div>
          <button onClick={onClose} aria-label="Close"
            className="w-9 h-9 rounded-full grid place-items-center text-lg font-bold shrink-0"
            style={{ background: '#f7efe5', color: 'var(--muted)', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}
