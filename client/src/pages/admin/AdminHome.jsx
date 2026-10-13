import { useState } from 'react';
import { useAuth } from '../../lib/auth.jsx';
import CrudSection from '../../components/admin/CrudSection.jsx';
import UsersAdmin from '../../components/admin/UsersAdmin.jsx';
import FormBuilder from '../../components/admin/FormBuilder.jsx';
import ApplicationsAdmin from '../../components/admin/ApplicationsAdmin.jsx';
import DatabaseAdmin from '../../components/admin/DatabaseAdmin.jsx';
import MissionsAdmin from '../../components/admin/MissionsAdmin.jsx';

const TABS = [
  { id: 'database', label: '🗄️ Database', group: 'content' },
  { id: 'content', label: '📋 News & Activities', group: 'content' },
  { id: 'missions', label: '🌍 Missions', group: 'content' },
  { id: 'users', label: '👥 Users', group: 'admin' },
  { id: 'form', label: '📝 Application Form', group: 'form' },
  { id: 'applications', label: '📨 Applications', group: 'review' },
];

export default function AdminHome() {
  const { user } = useAuth();
  const roles = user?.roles || [];
  const has = (r) => roles.includes(r);
  const isAdmin = has('admin');
  const canContent = isAdmin || has('content_editor');
  const canReview = isAdmin || has('reviewer');
  const canForm = isAdmin || has('form_manager');

  const allowed = (t) =>
    (t.group === 'content' && canContent) ||
    (t.group === 'admin' && isAdmin) ||
    (t.group === 'form' && canForm) ||
    (t.group === 'review' && canReview);

  const visible = TABS.filter(allowed);
  const [tab, setTab] = useState(visible[0]?.id || 'database');

  return (
    <div className="space-y-6">
      <div className="fade-up">
        <p className="eyebrow">Admin Portal</p>
        <h1 className="font-serif text-ink" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)' }}>Management Panel</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>Logged in as {user?.name} ({roles.join(', ')})</p>
      </div>

      <div className="glass-card p-2 flex gap-2 flex-wrap fade-up" style={{ borderRadius: 16 }}>
        {visible.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
            style={tab === t.id
              ? { background: 'linear-gradient(135deg, var(--flame), var(--flame-deep))', color: '#fff', border: 'none', cursor: 'pointer' }
              : { background: 'transparent', color: 'var(--ink)', border: 'none', cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'database' && canContent && <DatabaseAdmin />}

      {tab === 'content' && canContent && (
        <div className="space-y-4">
          <CrudSection title="News Posts" endpoint="/news" fields={[
            { key: 'title', label: 'Title' }, { key: 'body', label: 'Body' },
            { key: 'postDate', label: 'Date' }, { key: 'imageUrl', label: 'Image URL' },
          ]} />
          <CrudSection title="Activities" endpoint="/activities" fields={[
            { key: 'caption', label: 'Caption' }, { key: 'activityDate', label: 'Date' },
            { key: 'scope', label: 'Scope (school/local_flame/other)' }, { key: 'summary', label: 'Summary' },
            { key: 'imageUrl', label: 'Image URL' },
          ]} />
        </div>
      )}

      {tab === 'missions' && canContent && <MissionsAdmin />}
      {tab === 'users' && isAdmin && <UsersAdmin />}
      {tab === 'form' && canForm && <FormBuilder />}
      {tab === 'applications' && canReview && <ApplicationsAdmin />}
    </div>
  );
}
