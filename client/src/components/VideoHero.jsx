import { useRef, useState } from 'react';

const btnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 42,
  padding: '0 16px',
  border: '1px solid rgba(52, 169, 214, 0.28)',
  borderRadius: 8,
  color: 'var(--ink)',
  fontFamily: 'inherit',
  fontWeight: 700,
  fontSize: '0.88rem',
  background: 'rgba(255, 255, 255, 0.82)',
  backdropFilter: 'blur(12px)',
  cursor: 'pointer',
  boxShadow: '0 14px 34px rgba(16,33,58,0.1)',
};

export default function VideoHero({ children, compact = false }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);

  async function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      await v.play().catch(() => {});
    } else {
      v.pause();
    }
    setPlaying(!v.paused);
  }

  async function toggleSound() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    // If unmuting and video is paused, play it
    if (!v.muted && v.paused) {
      await v.play().catch(() => {});
    }
    setMuted(v.muted);
    setPlaying(!v.paused);
  }

  return (
    <section
      className="glass-card relative overflow-hidden fade-up"
      style={{ borderRadius: 24, isolation: 'isolate' }}
    >
      {/* Video background */}
      <video
        ref={videoRef}
        autoPlay muted loop playsInline
        poster="/flame-logo.png"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: -2, opacity: 0.78, filter: 'saturate(1.14) contrast(1.02)' }}
      >
        <source src="/intro.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: -1,
          background: 'linear-gradient(90deg, rgba(255,253,249,0.92) 0%, rgba(255,253,249,0.78) 48%, rgba(255,253,249,0.58) 100%)',
        }}
      />

      {/* Gradient bottom stripe */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{ height: 7, background: 'linear-gradient(90deg, var(--flame), var(--sky), var(--leaf), var(--gold))' }}
      />

      {/* Media controls — using native button with inline styles to avoid CSS conflicts */}
      <div className="absolute top-4 right-4 flex gap-2" style={{ zIndex: 20 }}>
        <button type="button" onClick={togglePlay} style={btnStyle}>
          {playing ? 'Pause Intro' : 'Play Intro'}
        </button>
        <button type="button" onClick={toggleSound} style={btnStyle}>
          {muted ? 'Sound On' : 'Sound Off'}
        </button>
      </div>

      {/* Content */}
      <div className="relative" style={{ zIndex: 1, padding: compact ? '24px' : '32px 32px 36px' }}>
        {children}
      </div>
    </section>
  );
}
