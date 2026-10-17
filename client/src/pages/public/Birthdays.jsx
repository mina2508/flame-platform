import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import Loader from '../../components/Loader.jsx';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

// Copyable contact chip — click to copy the number to the clipboard.
function ContactChip({ contact, label }) {
  const [copied, setCopied] = useState(false);
  if (!contact) return <span className="text-xs text-muted">no contact</span>;
  async function copy() {
    try {
      await navigator.clipboard.writeText(contact);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = contact; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch {}
      document.body.removeChild(ta);
    }
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button onClick={copy} title={`Copy ${label || 'contact'}`}
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
      style={{ background: copied ? 'rgba(39,149,106,0.14)' : 'rgba(52,169,214,0.12)', color: copied ? 'var(--good)' : 'var(--sky)', border: 'none', cursor: 'pointer' }}>
      📞 {contact}{label ? ` · ${label}` : ''} {copied ? '✓ copied' : '⧉'}
    </button>
  );
}

export default function Birthdays() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get('/birthdays', { params: { month } })
      .then((r) => { if (active) setItems(r.data); })
      .catch(() => { if (active) setItems([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [month]);

  const days = daysInMonth(year, month);
  const firstDay = new Date(year, month - 1, 1).getDay();

  function prev() {
    if (month === 1) { setMonth(12); setYear(year - 1); } else setMonth(month - 1);
    setSelected(null);
  }
  function next() {
    if (month === 12) { setMonth(1); setYear(year + 1); } else setMonth(month + 1);
    setSelected(null);
  }
  function today() { setMonth(now.getMonth() + 1); setYear(now.getFullYear()); setSelected(null); }

  const dayBirthdays = (d) => items.filter((b) => b.day === d);
  const selectedBdays = selected ? dayBirthdays(selected) : [];

  const filtered = q
    ? items.filter((b) =>
        b.name.toLowerCase().includes(q.toLowerCase()) ||
        (b.position || '').toLowerCase().includes(q.toLowerCase()))
    : [];

  return (
    <div className="space-y-8">
      <header className="fade-up">
        <p className="text-xs tracking-[0.2em] uppercase font-semibold text-flame-deep">
          CELEBRATIONS
        </p>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-ink mt-2">
          Birthdays Calendar
        </h1>
        <p className="text-muted mt-2">
          {items.length} {items.length === 1 ? 'birthday' : 'birthdays'} in {MONTHS[month - 1]}
        </p>
      </header>

      {/* Controls */}
      <div className="glass-card-static p-4 flex gap-3 items-center flex-wrap fade-up fade-up-1">
        <button onClick={prev} className="pill-btn pill-btn-ghost text-xs">← Prev</button>
        <button onClick={today} className="pill-btn pill-btn-primary text-xs">Current</button>
        <button onClick={next} className="pill-btn pill-btn-ghost text-xs">Next →</button>
        <input
          placeholder="Search name / position"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="bg-soft rounded-full px-4 py-2 text-sm outline-none text-ink placeholder:text-muted ml-auto border border-transparent focus:border-flame transition-colors"
        />
      </div>

      {q && filtered.length > 0 && (
        <div className="glass-card-static p-4 text-sm space-y-1.5 fade-up">
          {filtered.map((b) => (
            <div key={b.id} className="flex items-center gap-2 flex-wrap">
              <span>🎂</span>
              <span className="font-medium text-ink">{b.name}</span>
              <span className="text-muted">· {b.position}</span>
              <ContactChip contact={b.contact} label={b.contactLabel} />
              <span className="text-muted ml-auto">{MONTHS[b.month - 1]} {b.day}</span>
            </div>
          ))}
        </div>
      )}

      {/* Calendar */}
      <div className="glass-card-static p-6 fade-up fade-up-2">
        <h2 className="font-display font-semibold text-center text-xl text-ink mb-4">
          {MONTHS[month - 1]} {year}
        </h2>
        {loading && <Loader label="Loading birthdays…" />}
        {!loading && (<>
        <div className="grid grid-cols-7 text-center text-xs text-muted font-semibold mb-2">
          {WEEKDAYS.map((d) => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1.5 text-sm">
          {Array.from({ length: firstDay }).map((_, i) => <div key={'e' + i} />)}
          {Array.from({ length: days }).map((_, i) => {
            const d = i + 1;
            const bdays = dayBirthdays(d);
            const isToday = d === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear();
            const isSelected = selected === d;
            return (
              <button
                key={d}
                onClick={() => setSelected(d)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all
                  ${isToday ? 'bg-flame text-white' : ''}
                  ${!isToday && bdays.length ? 'bg-flame/10 text-flame-deep font-semibold' : ''}
                  ${!isToday && !bdays.length ? 'hover:bg-soft text-ink' : ''}
                  ${isSelected ? 'ring-2 ring-flame ring-offset-1' : ''}`}
              >
                <span>{d}</span>
                {bdays.length > 0 && (
                  <span className={`text-[10px] ${isToday ? 'text-white' : 'text-flame'}`}>
                    {bdays.length} 🎂
                  </span>
                )}
              </button>
            );
          })}
        </div>
        </>)}
      </div>

      {/* Selected day */}
      {selected && (
        <div className="glass-card-static p-6 fade-up">
          <h3 className="font-display font-semibold text-lg text-ink">
            {MONTHS[month - 1]} {selected}, {year}
          </h3>
          {selectedBdays.length === 0 ? (
            <p className="text-sm text-muted mt-2">No birthdays on this day.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {selectedBdays.map((b) => (
                <li key={b.id} className="flex items-center gap-2 text-sm flex-wrap">
                  <span>🎂</span>
                  <span className="font-medium text-ink">{b.name}</span>
                  <span className="text-muted">— {b.position}</span>
                  <span className="ml-auto"><ContactChip contact={b.contact} label={b.contactLabel} /></span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
