export default function KpiCard({ value, label, note, icon, accent = 'rgba(240,74,24,0.08)' }) {
  return (
    <article className="glass-card relative overflow-hidden p-5 fade-up transition-transform hover:-translate-y-1" style={{ borderRadius: 20, minHeight: 140 }}>
      <div
        className="absolute -top-10 -right-10 w-28 h-28 rounded-full"
        style={{ background: accent }}
      />
      {icon && (
        <div className="grid place-items-center w-10 h-10 rounded-2xl mb-2 text-lg" style={{ background: '#fff2ec', color: 'var(--flame-deep)' }}>
          {icon}
        </div>
      )}
      <span className="block mb-1 font-black" style={{ color: 'var(--flame-deep)', fontSize: 'clamp(2rem, 5vw, 3.2rem)', letterSpacing: '-0.05em', lineHeight: 1 }}>
        {value}
      </span>
      <strong className="block text-ink">{label}</strong>
      {note && <small className="block mt-2 leading-relaxed" style={{ color: 'var(--muted)' }}>{note}</small>}
    </article>
  );
}
