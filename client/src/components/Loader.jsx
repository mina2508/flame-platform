// Reusable loading UI for the FLAME app.
// <Loader /> shows a centered branded spinner.
// <SkeletonGrid /> / <SkeletonList /> show placeholder cards while data loads.

export default function Loader({ label = 'Loading…', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 ${className}`}>
      <span className="flame-spinner" aria-hidden="true" />
      <p className="mt-4 text-sm" style={{ color: 'var(--muted)' }}>{label}</p>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card overflow-hidden" style={{ borderRadius: 20 }}>
          <div className="skeleton" style={{ height: 208 }} />
          <div className="p-4 space-y-2">
            <div className="skeleton" style={{ height: 10, width: '35%', borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 14, width: '80%', borderRadius: 6 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ count = 4 }) {
  return (
    <div className="space-y-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card overflow-hidden" style={{ borderRadius: 20 }}>
          <div className="grid md:grid-cols-[auto_1fr]">
            <div className="skeleton" style={{ height: 208, width: '100%', minWidth: 160 }} />
            <div className="p-5 space-y-3">
              <div className="skeleton" style={{ height: 10, width: '25%', borderRadius: 6 }} />
              <div className="skeleton" style={{ height: 18, width: '60%', borderRadius: 6 }} />
              <div className="skeleton" style={{ height: 12, width: '95%', borderRadius: 6 }} />
              <div className="skeleton" style={{ height: 12, width: '88%', borderRadius: 6 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
