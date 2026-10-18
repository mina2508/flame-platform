import { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import KpiCard from '../../components/KpiCard.jsx';
import VideoHero from '../../components/VideoHero.jsx';
import DateField from '../../components/DateField.jsx';

export default function Dashboard() {
  const [from, setFrom] = useState('2026-06-15');
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [schools, setSchools] = useState([]);
  const [logTypes, setLogTypes] = useState([]);
  const [filterSchool, setFilterSchool] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  function periodRange() {
    const today = new Date();
    const end = today.toISOString().slice(0, 10);
    if (filterPeriod === 'today') return { from: end, to: end };
    if (filterPeriod === '7') {
      const d = new Date(today); d.setDate(d.getDate() - 7);
      return { from: d.toISOString().slice(0, 10), to: end };
    }
    if (filterPeriod === '30') {
      const d = new Date(today); d.setDate(d.getDate() - 30);
      return { from: d.toISOString().slice(0, 10), to: end };
    }
    return { from, to }; // all → use the date pickers
  }

  async function load() {
    setLoading(true); setLoadError('');
    try {
      const range = periodRange();
      const params = { from: range.from, to: range.to };
      if (filterSchool) params.schoolId = filterSchool;
      if (filterType) params.typeId = filterType;
      if (filterStatus) params.status = filterStatus;
      // The detailed story must use the SAME filters as the summary so the
      // numbers (missions / task records) stay consistent across both views.
      const logParams = { from: range.from, to: range.to };
      if (filterSchool) logParams.schoolId = filterSchool;
      if (filterType) logParams.typeId = filterType;
      if (filterStatus) logParams.status = filterStatus;
      // Use allSettled so one failing call never freezes the whole dashboard.
      const [d, l, s, lt] = await Promise.allSettled([
        api.get('/dashboard/summary', { params }),
        api.get('/logs', { params: logParams }),
        api.get('/schools'),
        api.get('/log-types'),
      ]);
      if (d.status === 'fulfilled') setData(d.value.data);
      if (l.status === 'fulfilled') setLogs(l.value.data);
      if (s.status === 'fulfilled') setSchools(s.value.data);
      if (lt.status === 'fulfilled') setLogTypes(lt.value.data);
      if (d.status === 'rejected') setLoadError('Could not load the dashboard summary. Please try Refresh.');
    } catch (e) {
      setLoadError('Something went wrong loading the dashboard. Please try Refresh.');
    } finally {
      setLoading(false);
    }
  }
  // Reload whenever any filter changes so the date range drives the whole dashboard.
  useEffect(() => { load(); }, [from, to, filterPeriod, filterType, filterSchool, filterStatus]);

  // Group logs by school for detailed view
  const logsBySchool = {};
  logs.forEach(l => {
    const key = l.schoolId;
    if (!logsBySchool[key]) logsBySchool[key] = [];
    logsBySchool[key].push(l);
  });

  const schoolName = (id) => schools.find(s => s.id === id)?.name || id;
  const ltLabel = (id) => logTypes.find(t => t.id === id)?.label || id;
  const ltIcon = (id) => logTypes.find(t => t.id === id)?.icon || '📋';

  // Internal/meta task rows auto-generated from a mission; excluded from the
  // "task records" counts so the numbers reflect real activity, not metadata.
  const META_PREFIXES = ['Status:', 'Mission dates:', 'Dates:', 'Summary:', 'Countries:', 'People involved:', 'Anonymous participants:', 'Duration:', 'Team:', 'Medical team:'];
  const isMetaTask = (t) => META_PREFIXES.some(p => (t.question || '').startsWith(p));
  const realTasks = (log) => (log.tasks || []).filter(t => !isMetaTask(t));
  const countReal = (logs) => logs.reduce((n, l) => n + realTasks(l).length, 0);

  // A clear status flag for each mission/log card.
  const statusFlag = (status) => {
    if (status === 'completed') return { label: '✅ Completed', cls: 'badge-good' };
    if (status === 'expected') return { label: '🕓 Not started', cls: 'badge-info' };
    return { label: '🔄 In progress', cls: 'badge-watch' };
  };
  // Mission/log title from the notes (notes = "mission:<id> | <title>" or a plain summary).
  const missionTitle = (log) => {
    const n = log.notes || '';
    if (n.includes('|')) return n.split('|').slice(1).join('|').trim();
    return n.trim() || 'Entry';
  };
  // Count of distinct real missions touching a school (for the school header).
  const missionsAtSchool = (schoolId) => {
    const ids = new Set();
    (logsBySchool[schoolId] || []).forEach(l => { const m = /mission:([0-9a-f-]+)/i.exec(l.notes || ''); if (m) ids.add(m[1]); });
    return ids.size;
  };

  return (
    <div className="space-y-5">
      {/* Hero card with video */}
      <VideoHero compact>
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          {/* Logo */}
          <div className="flame-logo-hero shrink-0" style={{ width: 'clamp(86px, 10vw, 120px)', aspectRatio: '1/1' }}>
            <img src="/flame-logo.png" alt="FLAME" className="w-full h-full object-contain rounded-full" />
          </div>
          <div className="flex-1">
            <p className="eyebrow">Public Service Progress</p>
            <h1 className="font-serif font-bold text-ink" style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', lineHeight: 0.95 }}>
              FLAME Missions Story
            </h1>
            <p className="mt-3 max-w-xl leading-relaxed" style={{ color: 'var(--muted)' }}>
              A simple visual window into actual school missions: prayer, values, medical care,
              formation, and pastoral follow-up moving together across the service.
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              <span className="inline-flex items-center gap-2">
                <strong className="eyebrow" style={{ margin: 0, fontSize: '0.65rem' }}>FROM</strong>
                <DateField value={from} onChange={setFrom} placeholder="From" />
              </span>
              <span className="inline-flex items-center gap-2">
                <strong className="eyebrow" style={{ margin: 0, fontSize: '0.65rem' }}>TO</strong>
                <DateField value={to} onChange={setTo} min={from} placeholder="To" />
              </span>
              <button onClick={load} disabled={loading} className="pill-btn pill-btn-primary text-sm">{loading ? 'Refreshing…' : 'Refresh Live Data'}</button>
              <button onClick={() => window.print()} className="pill-btn text-sm">Print Story</button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {[{to:'/activities',l:'Activities'},{to:'/news',l:'Last News'},{to:'/birthdays',l:'Birthdays'},{to:'/curriculum',l:'Curriculum'}].map(a => (
                <a key={a.to} href={a.to} className="pill-btn text-xs">{a.l}</a>
              ))}
            </div>
          </div>
          {/* Live panel */}
          <div className="p-5 rounded-3xl border grid gap-2 shrink-0" style={{ borderColor: 'rgba(52,169,214,0.24)', background: 'linear-gradient(135deg, rgba(255,255,255,0.88), rgba(52,169,214,0.08))', minWidth: 220 }}>
            <div className="live-dot" />
            <strong className="text-sm">Live from published mission logs</strong>
            <small style={{ color: 'var(--muted)' }}>Last updated {new Date().toLocaleString()}</small>
          </div>
        </div>
      </VideoHero>

      {/* Filters */}
      <section className="glass-card p-5 fade-up" style={{ borderRadius: 20, animationDelay: '0.1s' }}>
        <div className="grid lg:grid-cols-[0.3fr_1fr] gap-5">
          <div>
            <p className="eyebrow">Simple View</p>
            <h2 className="font-serif text-ink" style={{ fontSize: '1.4rem' }}>Focus the public story</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <label className="grid gap-1.5 text-xs font-black uppercase" style={{ color: 'var(--muted)' }}>
              Period
              <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)} className="pill-btn text-sm font-normal w-full justify-start px-4">
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-xs font-black uppercase" style={{ color: 'var(--muted)' }}>
              Log Type
              <select value={filterType} onChange={e => setFilterType(e.target.value)} className="pill-btn text-sm font-normal w-full justify-start px-4">
                <option value="">All</option>
                {logTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5 text-xs font-black uppercase" style={{ color: 'var(--muted)' }}>
              School
              <select value={filterSchool} onChange={e => setFilterSchool(e.target.value)} className="pill-btn text-sm font-normal w-full justify-start px-4">
                <option value="">All</option>
                {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5 text-xs font-black uppercase" style={{ color: 'var(--muted)' }}>
              Status
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="pill-btn text-sm font-normal w-full justify-start px-4">
                <option value="">All</option>
                <option value="completed">Completed</option>
                <option value="expected">Expected (not started)</option>
                <option value="pending">Pending (started, not completed)</option>
              </select>
            </label>
            <div className="flex items-end">
              <button onClick={load} disabled={loading} className="pill-btn pill-btn-primary text-sm w-full">{loading ? 'Loading…' : 'Apply'}</button>
            </div>
          </div>
        </div>
      </section>

      {loadError && (
        <div className="glass-card p-4 fade-up" style={{ borderRadius: 16, borderColor: 'var(--danger)', background: 'rgba(199,53,53,0.06)' }}>
          <span style={{ color: 'var(--danger)', fontWeight: 700 }}>⚠ {loadError}</span>
          <button onClick={load} className="pill-btn text-sm ml-3">Retry</button>
        </div>
      )}

      {data && (
        <>
          {/* KPI Strip */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <KpiCard icon="🎯" value={data.kpis.totalMissions} label="Total Missions" note="Distinct missions in the period" accent="rgba(240,74,24,0.10)" />
            <KpiCard icon="🏫" value={data.kpis.activeSchools} label="Active Schools" note="Schools visited by a mission" accent="rgba(52,169,214,0.12)" />
            <KpiCard icon="✅" value={data.kpis.completed} label="Completed" note="Missions fully completed" accent="rgba(39,149,106,0.12)" />
            <KpiCard icon="🕓" value={data.kpis.expected} label="Expected" note="Not started yet" accent="rgba(52,169,214,0.10)" />
            <KpiCard icon="🔄" value={data.kpis.pending} label="Pending" note="Started but not completed" accent="rgba(198,150,33,0.14)" />
          </div>

          {/* Schools × Missions Table */}
          <section className="glass-card p-5 fade-up" style={{ borderRadius: 20, animationDelay: '0.2s' }}>
            <p className="eyebrow">Public Summary</p>
            <h2 className="font-serif text-ink mb-4" style={{ fontSize: '1.4rem' }}>Schools × Missions summary</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse text-sm">
                <thead>
                  <tr style={{ background: '#fffaf4' }}>
                    <th className="text-left p-3 font-black text-xs uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>School</th>
                    <th className="p-3 font-black text-xs uppercase text-center" style={{ color: 'var(--muted)' }}>Missions</th>
                    <th className="p-3 font-black text-xs uppercase text-center" style={{ color: 'var(--muted)' }}>Completed</th>
                    <th className="p-3 font-black text-xs uppercase text-center" style={{ color: 'var(--muted)' }}>Pending</th>
                    <th className="p-3 font-black text-xs uppercase text-center" style={{ color: 'var(--muted)' }}>Expected</th>
                    <th className="p-3 font-black text-xs uppercase text-center" style={{ color: 'var(--muted)' }}>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bySchool.map(s => (
                    <tr key={s.schoolId} className="border-t" style={{ borderColor: 'var(--line)' }}>
                      <td className="p-3 font-bold">{s.school}</td>
                      <td className="p-3 text-center">{s.totalMissions}</td>
                      <td className="p-3 text-center">{s.completed}</td>
                      <td className="p-3 text-center">{s.pending}</td>
                      <td className="p-3 text-center">{s.expected}</td>
                      <td className="p-3 text-center">
                        <span className={`badge ${s.status === 'Strong' ? 'badge-good' : 'badge-watch'}`}>
                          {s.completionPct}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Detailed Story — drill-down per school */}
          <section className="glass-card p-5 fade-up" style={{ borderRadius: 20, animationDelay: '0.3s' }}>
            <p className="eyebrow">Detailed Story</p>
            <h2 className="font-serif text-ink mb-1" style={{ fontSize: '1.4rem' }}>What happened & what did not happen?</h2>
            <p className="mb-4 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              Grouped by school. Open any school to see the task records behind each mission.
            </p>
            <div className="grid gap-3">
              {data.bySchool.filter(s => s.totalMissions > 0).map(s => {
                const sLogs = logsBySchool[s.schoolId] || [];
                const taskCount = countReal(sLogs);
                // group by logType
                const byType = {};
                sLogs.forEach(l => {
                  if (!byType[l.logTypeId]) byType[l.logTypeId] = [];
                  byType[l.logTypeId].push(l);
                });
                return (
                  <details key={s.schoolId} className="rounded-2xl border overflow-hidden bg-white" style={{ borderColor: 'var(--line)' }}>
                    <summary className="grid grid-cols-[auto_1fr_auto] gap-3 items-center p-4 cursor-pointer hover:bg-[#fffaf4] transition-colors">
                      <span className="grid place-items-center w-9 h-9 rounded-full text-white font-black text-sm"
                        style={{ background: 'linear-gradient(135deg, var(--flame), var(--flame-deep))', boxShadow: '0 10px 22px rgba(167,25,20,0.14)' }}>+</span>
                      <div>
                        <strong className="text-ink">{s.school}</strong>
                        <small className="block mt-0.5" style={{ color: 'var(--muted)' }}>
                          {s.totalMissions} activities · {taskCount} task records · {s.completed} completed · {s.pending} pending · latest {s.latest}
                        </small>
                      </div>
                      <span className={`badge ${s.status === 'Strong' ? 'badge-good' : 'badge-watch'}`}>{s.completionPct}%</span>
                    </summary>
                    <div className="grid gap-3 p-4 pl-16">
                      {Object.entries(byType).map(([typeId, typeLogs]) => {
                        const tCount = countReal(typeLogs);
                        return (
                          <details key={typeId} open className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--line)', background: '#fffaf4' }}>
                            <summary className="flex items-center gap-3 p-3 cursor-pointer">
                              <span className="grid place-items-center w-8 h-8 rounded-xl font-black" style={{ color: 'var(--flame-deep)', background: '#fff2ec' }}>
                                {ltIcon(typeId)}
                              </span>
                              <strong className="text-sm">{ltLabel(typeId)}</strong>
                              <small className="ml-auto font-bold" style={{ color: 'var(--muted)' }}>{typeLogs.length} missions · {tCount} task records</small>
                            </summary>
                            <div className="p-3 pl-12 grid gap-3">
                              {/* One card per mission/log with its details + status flag */}
                              {typeLogs.map(log => {
                                const flag = statusFlag(log.status);
                                const details = (log.tasks || []).filter(isMetaTask);
                                const performed = realTasks(log).filter(t => t.performed);
                                const notPerformed = realTasks(log).filter(t => !t.performed);
                                return (
                                  <div key={log.id} className="rounded-2xl border p-3 bg-white" style={{ borderColor: 'var(--line)' }}>
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                      <strong className="text-sm text-ink">{missionTitle(log)}</strong>
                                      <span className={`badge ${flag.cls} text-xs`}>{flag.label}</span>
                                    </div>
                                    {log.logDate && <small className="block mt-0.5" style={{ color: 'var(--muted)' }}>📅 {String(log.logDate).slice(0,10)}</small>}

                                    {/* The admin's own note for this school (what happened) */}
                                    {log.notes && (
                                      <p className="text-xs mt-2 rounded-lg px-2 py-1.5" style={{ background: '#eef7ff', color: 'var(--ink)' }}>📝 {log.notes}</p>
                                    )}

                                    {/* Mission details (summary, dates, countries, team, counts) */}
                                    {(() => {
                                      const rows = details.filter(t => !(t.question||'').startsWith('Status:'));
                                      // Fallback: if there are no detail rows, show the summary from notes.
                                      if (rows.length === 0) {
                                        const sm = missionTitle(log);
                                        return sm ? (
                                          <div className="mt-2 grid gap-1">
                                            <div className="text-xs rounded-lg px-2 py-1" style={{ background: '#fffaf4', color: 'var(--muted)' }}>Summary: {sm}</div>
                                          </div>
                                        ) : null;
                                      }
                                      return (
                                        <div className="mt-2 grid gap-1">
                                          {rows.map(t => (
                                            <div key={t.id} className="text-xs rounded-lg px-2 py-1" style={{ background: '#fffaf4', color: 'var(--muted)' }}>{t.question}</div>
                                          ))}
                                        </div>
                                      );
                                    })()}

                                    {/* Performed / not performed activity */}
                                    {(performed.length > 0 || notPerformed.length > 0) && (
                                      <div className="grid md:grid-cols-2 gap-2 mt-2">
                                        <div>
                                          <h5 className="font-bold text-xs mb-1" style={{ color: 'var(--good)' }}>✓ Done</h5>
                                          <ul className="grid gap-1">
                                            {performed.map(t => (
                                              <li key={t.id} className="rounded-lg border p-1.5 grid grid-cols-[auto_1fr] gap-2 bg-white text-xs" style={{ borderColor: 'var(--line)' }}>
                                                <span className="grid place-items-center w-5 h-5 rounded-full text-white font-black" style={{ background: 'var(--good)', fontSize: 10 }}>✓</span>
                                                <span>{t.question}{t.responsible ? ` (${t.responsible})` : ''}</span>
                                              </li>
                                            ))}
                                            {performed.length === 0 && <li className="text-xs" style={{ color: 'var(--muted)' }}>—</li>}
                                          </ul>
                                        </div>
                                        <div>
                                          <h5 className="font-bold text-xs mb-1" style={{ color: 'var(--danger)' }}>✗ Not done</h5>
                                          <ul className="grid gap-1">
                                            {notPerformed.map(t => (
                                              <li key={t.id} className="rounded-lg border p-1.5 grid grid-cols-[auto_1fr] gap-2 bg-white text-xs" style={{ borderColor: 'var(--line)' }}>
                                                <span className="grid place-items-center w-5 h-5 rounded-full text-white font-black" style={{ background: 'var(--danger)', fontSize: 10 }}>✗</span>
                                                <span>{t.question}{t.responsible ? ` (${t.responsible})` : ''}</span>
                                              </li>
                                            ))}
                                            {notPerformed.length === 0 && <li className="text-xs" style={{ color: 'var(--muted)' }}>—</li>}
                                          </ul>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </details>
                        );
                      })}
                    </div>
                  </details>
                );
              })}
            </div>
          </section>

          {/* Log Categories */}
          <section>
            <p className="eyebrow">Log Categories</p>
            <h2 className="font-serif text-ink mb-4" style={{ fontSize: '1.4rem' }}>What is moving in the service?</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              {data.byCategory.map((c, i) => (
                <div key={c.typeId} className="glass-card gradient-stripe relative overflow-hidden p-5 fade-up transition-transform hover:-translate-y-1"
                  style={{ borderRadius: 20, minHeight: 200, animationDelay: `${i * 0.06}s` }}>
                  <div className="grid place-items-center w-12 h-12 rounded-2xl mb-3 font-black text-xl" style={{ color: 'var(--flame-deep)', background: '#fff2ec' }}>
                    {c.icon}
                  </div>
                  <h3 className="font-bold text-ink">{c.label}</h3>
                  <div className="font-black mt-3" style={{ color: 'var(--flame-deep)', fontSize: '2.5rem', letterSpacing: '-0.05em' }}>{c.total}</div>
                  <div className="progress-track mt-2">
                    <div className="progress-fill" style={{ width: `${c.total ? Math.round(c.completed / c.total * 100) : 0}%` }} />
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="badge badge-good text-xs">✅ {c.completed} done</span>
                    {c.pending > 0 && <span className="badge badge-watch text-xs">🔄 {c.pending}</span>}
                    {c.expected > 0 && <span className="badge badge-info text-xs">🕓 {c.expected}</span>}
                  </div>
                  <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--muted)' }}>
                    across {c.schools} school{c.schools !== 1 ? 's' : ''}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Schools Progress */}
          <section className="glass-card p-5 fade-up" style={{ borderRadius: 20 }}>
            <p className="eyebrow">Schools</p>
            <h2 className="font-serif text-ink mb-4" style={{ fontSize: '1.4rem' }}>Progress by school</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.bySchool.map((s, i) => (
                <div key={s.schoolId} className="rounded-2xl border p-4 bg-white transition-transform hover:-translate-y-1 hover:shadow-lg fade-up"
                  style={{ borderColor: 'var(--line)', animationDelay: `${i * 0.06}s` }}>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-ink text-sm">{s.school}</h3>
                    <span className={`badge ${s.status === 'Strong' ? 'badge-good' : 'badge-watch'}`}>{s.status}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <span className="rounded-xl p-2 text-center text-xs" style={{ background: '#fff9f2', color: 'var(--muted)' }}>
                      <strong className="block text-ink">{s.totalMissions}</strong>activities
                    </span>
                    <span className="rounded-xl p-2 text-center text-xs" style={{ background: '#fff9f2', color: 'var(--muted)' }}>
                      <strong className="block text-ink">{data.byCategory.filter(c => {
                        const schoolLogs = logs.filter(l => l.schoolId === s.schoolId && l.logTypeId === c.typeId);
                        return schoolLogs.length > 0;
                      }).length}</strong>types
                    </span>
                    <span className="rounded-xl p-2 text-center text-xs" style={{ background: '#fff9f2', color: 'var(--muted)' }}>
                      <strong className="block text-ink">{s.completionPct}%</strong>signal
                    </span>
                  </div>
                  <p className="text-xs mt-3" style={{ color: 'var(--muted)' }}>Latest movement: {s.latest || 'N/A'}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
