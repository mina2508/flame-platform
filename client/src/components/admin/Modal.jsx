import { useEffect } from 'react';
import { createPortal } from 'react-dom';

// Reusable, responsive modal rendered via a PORTAL to document.body so no
// parent CSS (transform / overflow / backdrop-filter) can clip or break it.
// - Desktop: centered card, width capped at `maxWidth`, body scrolls.
// - Mobile: full-width bottom sheet, body scrolls.
// - Backdrop click or Esc closes; background scroll is locked.
export default function Modal({ open, onClose, title, subtitle, children, maxWidth = 560 }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const node = (
    <div className="fm-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="fm-modal-card" style={{ maxWidth }} onMouseDown={(e) => e.stopPropagation()}>
        <div className="fm-modal-head">
          <div style={{ minWidth: 0 }}>
            {subtitle && <p className="eyebrow" style={{ margin: '0 0 4px' }}>{subtitle}</p>}
            <h2 className="font-serif font-bold text-ink text-lg" style={{ margin: 0, lineHeight: 1.2 }}>{title}</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="fm-modal-x">✕</button>
        </div>
        <div className="fm-modal-body">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
