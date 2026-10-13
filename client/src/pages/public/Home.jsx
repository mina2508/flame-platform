import { Link } from 'react-router-dom';
import { useState } from 'react';
import VideoHero from '../../components/VideoHero.jsx';
import ApplyModal from '../../components/ApplyModal.jsx';

const stats = [
  { n: '01', text: 'Major dashboard access button' },
  { n: '05', text: 'Public summary mission tables' },
  { n: 'Live', text: 'Published service data view' },
];

const areas = [
  { n: '01', title: 'Morning Assembly', desc: 'Prayer, movement, inspection, announcements, anthem, and daily school start follow-up.' },
  { n: '02', title: 'Principals Visits', desc: 'Class visits, teacher checks, preparation notes, and leadership follow-up.' },
  { n: '03', title: 'Follow-Up', desc: 'Priest-led follow-up actions and service care records across schools.' },
  { n: '04', title: 'Values, Medical & Activities', desc: 'Values lessons, medical care, formation, and activity movement summarized clearly.' },
];

export default function Home() {
  const [applyOpen, setApplyOpen] = useState(false);
  return (
    <div className="space-y-5">
      <ApplyModal open={applyOpen} onClose={() => setApplyOpen(false)} />
      {/* Hero with video */}
      <VideoHero>
        <div className="flex flex-col lg:flex-row items-start gap-8">
          {/* Logo */}
          <div className="flame-logo-hero shrink-0" style={{ width: 'clamp(96px, 11vw, 136px)', aspectRatio: '1/1' }}>
            <img src="/flame-logo.png" alt="FLAME Function logo" className="w-full h-full object-contain rounded-full" />
          </div>
          {/* Copy */}
          <div className="flex-1">
            <p className="eyebrow">St. Paul Coptic Service</p>
            <h1 className="font-serif font-bold text-ink" style={{ fontSize: 'clamp(2.6rem, 6vw, 5.5rem)', lineHeight: 0.94, maxWidth: '12ch' }}>
              FLAME Function
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed" style={{ color: 'var(--muted)' }}>
              A unified digital home for school missions, public service progress, follow-up,
              values, medical care, activities, and clear reporting for decision makers.
            </p>
            <div className="mt-7 flex gap-3 flex-wrap">
              <Link to="/dashboard" className="pill-btn pill-btn-primary">Open Public Dashboard</Link>
              <Link to="/activities" className="pill-btn">Activities</Link>
              <Link to="/news" className="pill-btn">Last News</Link>
              <Link to="/curriculum" className="pill-btn">Curriculum</Link>
              <Link to="/birthdays" className="pill-btn">Birthdays Calendar</Link>
              <button onClick={() => setApplyOpen(true)}
                className="pill-btn" style={{ color: '#fff', border: 0, background: 'linear-gradient(135deg, var(--flame), var(--flame-deep))', boxShadow: '0 14px 28px rgba(167,25,20,0.16)' }}>
                Apply to FLAME Function
              </button>
            </div>
          </div>
        </div>
      </VideoHero>

      {/* Public Story / Mission section */}
      <section className="glass-card p-6 lg:p-8 fade-up grid lg:grid-cols-[1.2fr_1fr] gap-8 items-center" style={{ borderRadius: 24, animationDelay: '0.15s' }}>
        <div>
          <p className="eyebrow">Public Story</p>
          <h2 className="font-serif text-ink" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)' }}>
            One clear entrance to the service dashboard.
          </h2>
          <p className="mt-4 leading-relaxed" style={{ color: 'var(--muted)' }}>
            This page gives visitors a simple path to the live public dashboard, where missions
            are grouped by school, category, period, and completion signals.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.n} className="rounded-2xl border p-4 text-center transition-transform hover:-translate-y-1 hover:shadow-lg"
              style={{ borderColor: 'var(--line)', background: '#fffaf4' }}>
              <span className="block font-black text-2xl" style={{ color: 'var(--flame-deep)' }}>{s.n}</span>
              <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--muted)' }}>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Service Areas */}
      <section className="fade-up" style={{ animationDelay: '0.25s' }}>
        <p className="eyebrow">Service Areas</p>
        <h2 className="font-serif text-ink mb-6" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)' }}>Daily care made visible.</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {areas.map((a, i) => (
            <article
              key={a.n}
              className="glass-card gradient-stripe relative overflow-hidden p-5 fade-up transition-all hover:-translate-y-1 hover:shadow-lg"
              style={{ animationDelay: `${0.3 + i * 0.08}s`, borderRadius: 20 }}
            >
              <span className="font-black text-sm" style={{ color: 'var(--flame-deep)' }}>{a.n}</span>
              <h3 className="font-bold mt-2 text-ink text-lg">{a.title}</h3>
              <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--muted)' }}>{a.desc}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
