import { useEffect, useState } from 'react';
import { api, cachedGet } from '../../api/client.js';

// 7-role model (+ legacy roles kept visible so existing accounts still edit).
const ROLES = ['admin', 'viewer', 'team_member', 'resident', 'priest', 'principal', 'teacher'];
const ROLE_LABELS = {
  admin: 'Admin', viewer: 'Viewer', team_member: 'Team Member',
  resident: 'Resident', priest: 'Priest', principal: 'Principal', teacher: 'Teacher',
  content_editor: 'Content Editor', reviewer: 'Reviewer', form_manager: 'Form Manager',
};
// Roles that are scoped to schools/countries (others see everything).
const SCOPED = ['team_member', 'resident', 'priest', 'principal', 'teacher'];

const blank = { name: '', email: '', username: '', phone: '', password: '', roles: ['viewer'], schoolIds: [], countryIds: [], sendWelcomeEmail: false };

export default function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [countries, setCountries] = useState([]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(blank);
  const [notice, setNotice] = useState(null); // {name, tempPassword, emailed}

  async function load() {
    const [u, s, co] = await Promise.all([
      api.get('/users').then(r => r.data),
      cachedGet('/schools'),
      cachedGet('/countries'),
    ]);
    setUsers(u); setSchools(s); setCountries(co);
  }
  useEffect(() => { load(); }, []);

  const needsScope = form.roles.some(r => SCOPED.includes(r));

  function toggle(list, v) { return list.includes(v) ? list.filter(x => x !== v) : [...list, v]; }

  async function add(e) {
    e.preventDefault();
    if (!form.roles.length) return alert('Select at least one role');
    if (!form.email && !form.username) return alert('Provide an email or a username');
    if (form.sendWelcomeEmail && !form.email) return alert('Email is required to send a welcome email');
    setBusy(true); setNotice(null);
    try {
      const { data } = await api.post('/users', form);
      // Show temp password on screen if it wasn't emailed.
      if (data.tempPassword || data.emailed) {
        setNotice({ name: form.name || form.username || form.email, tempPassword: data.tempPassword, emailed: data.emailed, emailError: data.emailError });
      }
      setForm(blank);
      load();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
    finally { setBusy(false); }
  }

  async function toggleUserRole(user, r) {
    const roles = toggle(user.roles, r);
    if (!roles.length) return alert('User must have at least one role');
    await api.patch(`/users/${user.id}`, { roles }); load();
  }
  async function toggleActive(user) { await api.patch(`/users/${user.id}`, { active: !user.active }); load(); }
  async function resetPw(user) {
    if (!confirm(`Reset password for ${user.name}?`)) return;
    const { data } = await api.post(`/users/${user.id}/reset-password`, {});
    setNotice({ name: user.name, tempPassword: data.tempPassword, emailed: false });
  }
  async function setScope(user, kind, id) {
    const key = kind === 'school' ? 'schoolIds' : 'countryIds';
    const next = toggle(user[key] || [], id);
    await api.patch(`/users/${user.id}`, { [key]: next }); load();
  }
  async function remove(id) { if (confirm('Delete this user?')) { await api.delete(`/users/${id}`); load(); } }

  const inp = "border rounded-xl px-3 py-2 text-sm flex-1 min-w-[120px]";
  const chip = (on) => on
    ? { background: 'linear-gradient(135deg, var(--flame), var(--flame-deep))', color: '#fff', border: 'none', cursor: 'pointer' }
    : { background: '#fff', color: 'var(--muted)', border: '1px solid var(--line)', cursor: 'pointer' };

  return (
    <div className="glass-card p-5 fade-up" style={{ borderRadius: 18 }}>
      <h2 className="font-serif text-lg text-ink mb-1">Users & Roles</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
        Create accounts with a role and scope. Scoped roles (resident, priest, principal, teacher, team member) are limited to their assigned schools/countries. A country assignment covers every school in that country.
      </p>

      {/* Temp-password / email notice */}
      {notice && (
        <div className="rounded-xl p-3 mb-4 text-sm" style={{ background: '#fff2ec', border: '1px solid var(--flame)' }}>
          {notice.emailed
            ? <span>✅ Welcome email sent to <strong>{notice.name}</strong> with their temporary password.</span>
            : <>
                <div>🔑 Temporary password for <strong>{notice.name}</strong> (share it securely — shown once):</div>
                <code style={{ fontSize: 16, fontWeight: 'bold', color: 'var(--flame-deep)' }}>{notice.tempPassword}</code>
                {notice.emailError && <div className="text-xs mt-1" style={{ color: 'var(--danger)' }}>Email not sent: {notice.emailError}</div>}
              </>}
          <button onClick={() => setNotice(null)} className="text-xs ml-3" style={{ color: 'var(--muted)', border: 'none', background: 'none', cursor: 'pointer' }}>dismiss</button>
        </div>
      )}

      <form onSubmit={add} className="p-4 rounded-2xl mb-4 space-y-3" style={{ background: '#fffaf4', border: '1px solid var(--line)' }}>
        <div className="flex gap-2 flex-wrap">
          <input placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inp} style={{ borderColor: 'var(--line)' }} required />
          <input placeholder="Username (optional if email)" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className={inp} style={{ borderColor: 'var(--line)' }} />
          <input placeholder="Email (optional if username)" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inp} style={{ borderColor: 'var(--line)' }} />
          <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inp} style={{ borderColor: 'var(--line)' }} />
        </div>

        {/* Roles */}
        <div className="flex flex-wrap gap-2">
          {ROLES.map(r => (
            <button key={r} type="button" onClick={() => setForm({ ...form, roles: toggle(form.roles, r) })}
              className="px-3 py-1.5 rounded-full text-xs font-bold" style={chip(form.roles.includes(r))}>
              {form.roles.includes(r) ? '✓ ' : ''}{ROLE_LABELS[r]}
            </button>
          ))}
        </div>

        {/* Scope pickers (only when a scoped role is selected) */}
        {needsScope && (
          <div className="space-y-2">
            <div>
              <span className="text-xs font-black uppercase block mb-1" style={{ color: 'var(--muted)' }}>Assigned countries (= all their schools)</span>
              <div className="flex flex-wrap gap-1.5">
                {countries.map(co => (
                  <button key={co.id} type="button" onClick={() => setForm({ ...form, countryIds: toggle(form.countryIds, co.id) })}
                    className="px-2.5 py-1 rounded-full text-xs" style={chip(form.countryIds.includes(co.id))}>{co.name}</button>
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs font-black uppercase block mb-1" style={{ color: 'var(--muted)' }}>Assigned schools</span>
              <div className="flex flex-wrap gap-1.5">
                {schools.map(s => (
                  <button key={s.id} type="button" onClick={() => setForm({ ...form, schoolIds: toggle(form.schoolIds, s.id) })}
                    className="px-2.5 py-1 rounded-full text-xs" style={chip(form.schoolIds.includes(s.id))}>{s.name}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Password + email option */}
        <div className="flex gap-2 flex-wrap items-center">
          <input placeholder="Password (leave blank = auto temp password)" type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className={inp} style={{ borderColor: 'var(--line)' }} />
          <label className="flex items-center gap-2 text-sm" style={{ color: form.email ? 'var(--ink)' : 'var(--muted)' }}>
            <input type="checkbox" checked={form.sendWelcomeEmail} disabled={!form.email || !!form.password}
              onChange={e => setForm({ ...form, sendWelcomeEmail: e.target.checked })} />
            Send welcome email with credentials
          </label>
        </div>
        {form.sendWelcomeEmail && <p className="text-xs" style={{ color: 'var(--muted)' }}>An email with the username and temporary password will be sent. The user sets a new password on first login.</p>}

        <button disabled={busy} className="pill-btn pill-btn-primary text-sm" style={{ opacity: busy ? 0.6 : 1 }}>{busy ? 'Saving…' : '+ Add User'}</button>
      </form>

      {/* User list */}
      <div className="space-y-2">
        {users.map(u => {
          const uScoped = u.roles.some(r => SCOPED.includes(r));
          return (
            <div key={u.id} className="rounded-xl border p-3 bg-white" style={{ borderColor: 'var(--line)', opacity: u.active ? 1 : 0.55 }}>
              <div className="flex justify-between items-start gap-2 flex-wrap">
                <div>
                  <strong className="text-ink">{u.name}</strong>
                  {u.username && <span className="text-xs ml-2" style={{ color: 'var(--muted)' }}>@{u.username}</span>}
                  {u.email && <span className="text-xs ml-2" style={{ color: 'var(--muted)' }}>{u.email}</span>}
                  {!u.active && <span className="badge badge-warn text-xs ml-2">Inactive</span>}
                  {u.mustChangePassword && <span className="badge text-xs ml-2" style={{ background: '#fff2ec', color: 'var(--flame-deep)' }}>Pending first login</span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => resetPw(u)} className="text-xs font-bold" style={{ color: 'var(--sky)', border: 'none', background: 'none', cursor: 'pointer' }}>Reset password</button>
                  <button onClick={() => toggleActive(u)} className="text-xs font-bold" style={{ color: 'var(--muted)', border: 'none', background: 'none', cursor: 'pointer' }}>{u.active ? 'Deactivate' : 'Reactivate'}</button>
                  <button onClick={() => remove(u.id)} className="text-xs font-bold" style={{ color: 'var(--danger)', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {ROLES.map(r => (
                  <button key={r} type="button" onClick={() => toggleUserRole(u, r)}
                    className="px-2.5 py-1 rounded-full text-xs font-bold"
                    style={u.roles.includes(r) ? { background: 'rgba(39,149,106,0.12)', color: 'var(--good)', border: 'none', cursor: 'pointer' } : { background: '#f7efe5', color: 'var(--muted)', border: 'none', cursor: 'pointer' }}>
                    {u.roles.includes(r) ? '✓ ' : '+ '}{ROLE_LABELS[r]}
                  </button>
                ))}
              </div>
              {uScoped && (
                <div className="mt-2 grid gap-1.5">
                  <div className="flex flex-wrap gap-1 items-center">
                    <span className="text-xs font-black uppercase" style={{ color: 'var(--muted)' }}>Countries:</span>
                    {countries.map(co => (
                      <button key={co.id} onClick={() => setScope(u, 'country', co.id)} className="px-2 py-0.5 rounded-full text-xs"
                        style={(u.countryIds || []).includes(co.id) ? { background: 'var(--sky)', color: '#fff', border: 'none', cursor: 'pointer' } : { background: '#eef3f6', color: 'var(--muted)', border: 'none', cursor: 'pointer' }}>{co.name}</button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1 items-center">
                    <span className="text-xs font-black uppercase" style={{ color: 'var(--muted)' }}>Schools:</span>
                    {schools.map(s => (
                      <button key={s.id} onClick={() => setScope(u, 'school', s.id)} className="px-2 py-0.5 rounded-full text-xs"
                        style={(u.schoolIds || []).includes(s.id) ? { background: 'var(--sky)', color: '#fff', border: 'none', cursor: 'pointer' } : { background: '#eef3f6', color: 'var(--muted)', border: 'none', cursor: 'pointer' }}>{s.name}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
