import { useEffect } from 'react';

// Reusable modal/popup for admin "Add new" and "Edit" forms.
// - Click the backdrop or press Esc to close.
// - Locks background scroll while open.
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
      className="fixed inset-0 z-[1200] flex items-start justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(16,33,58,0.5)', backdropFilter: 'blur(6px)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="glass-card w-full p-6 my-8"
        style={{ borderRadius: 24, maxWidth }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5 gap-3">
          <div>
            {subtitle && <p className="eyebrow">{subtitle}</p>}
            <h2 className="font-serif font-bold text-ink text-lg">{title}</h2>
          </div>
          <button onClick={onClose} aria-label="Close"
            className="w-9 h-9 rounded-full grid place-items-center text-lg font-bold shrink-0"
            style={{ background: '#f7efe5', color: 'var(--muted)', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
