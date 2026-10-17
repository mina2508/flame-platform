import { useState } from 'react';
import CrudSection from './CrudSection.jsx';
import Collapsible from './Collapsible.jsx';
import ResidenceManager from './ResidenceManager.jsx';
import SchoolManager from './SchoolManager.jsx';
import StudentsAdmin from './StudentsAdmin.jsx';
import TeachersAdmin from './TeachersAdmin.jsx';
import PriestsAdmin from './PriestsAdmin.jsx';
import ServantsAdmin from './ServantsAdmin.jsx';
import DocumentsAdmin from './DocumentsAdmin.jsx';
import MorningAssemblyAdmin from './MorningAssemblyAdmin.jsx';
import MedicalTeamAdmin from './MedicalTeamAdmin.jsx';

// The Database tab organizes all the "building block" records of the platform.
// It is grouped by purpose and follows the natural setup order so a new admin
// knows what to create first.
const GROUPS = [
  { step: 1, icon: '🌍', title: 'Locations & Structure', blurb: 'Set these up first. Everything else (people, classes) links to a country and school.' },
  { step: 2, icon: '👥', title: 'People', blurb: 'Add teachers, students, priests and servants. Each links to a country/school above.' },
  { step: 3, icon: '📚', title: 'Learning Content', blurb: 'Curriculum, values, formation materials and the morning assembly plan.' },
  { step: 4, icon: '⚙️', title: 'Other', blurb: 'Supporting records that don’t fit the categories above.' },
];

function GroupHeader({ group }) {
  return (
    <div className="flex items-start gap-3 mt-2 mb-1">
      <div className="flex items-center justify-center font-black text-sm"
        style={{ minWidth: 30, height: 30, borderRadius: 10, background: 'linear-gradient(135deg, var(--flame), var(--flame-deep))', color: '#fff' }}>
        {group.step}
      </div>
      <div>
        <h3 className="font-serif text-ink" style={{ fontSize: '1.15rem' }}>{group.icon} {group.title}</h3>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>{group.blurb}</p>
      </div>
    </div>
  );
}

export default function DatabaseAdmin() {
  const [showGuide, setShowGuide] = useState(true);

  return (
    <div className="space-y-5">
      {/* Getting-started guide */}
      {showGuide ? (
        <div className="glass-card p-4 fade-up" style={{ borderRadius: 18, borderLeft: '4px solid var(--flame)' }}>
          <div className="flex justify-between items-start gap-3">
            <div>
              <h3 className="font-serif text-ink" style={{ fontSize: '1.05rem' }}>👋 New here? Set things up in this order</h3>
              <ol className="mt-2 text-sm space-y-1" style={{ color: 'var(--muted)', paddingLeft: '1.1rem', listStyle: 'decimal' }}>
                <li><strong className="text-ink">Country</strong> → add the countries you serve (e.g. Ghana, Burundi).</li>
                <li><strong className="text-ink">School</strong> → add schools inside each country, their location on the map, and their <strong className="text-ink">classes</strong>.</li>
                <li><strong className="text-ink">People</strong> → add teachers, students, priests and servants (they link to a school/class).</li>
                <li><strong className="text-ink">Content</strong> → upload curriculum, values and formation materials.</li>
              </ol>
              <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
                Tip: each section below shows how many items it holds. Click a section to expand it.
              </p>
            </div>
            <button onClick={() => setShowGuide(false)} className="text-xs font-bold" style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
              Hide
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowGuide(true)} className="text-xs font-bold" style={{ color: 'var(--sky)', background: 'none', border: 'none', cursor: 'pointer' }}>
          ❔ Show setup guide
        </button>
      )}

      {/* 1 — Locations & Structure */}
      <GroupHeader group={GROUPS[0]} />
      <CrudSection title="🌍 Countries" endpoint="/countries" fields={[
        { key: 'name', label: 'Name' },
        { key: 'code', label: 'Code (GH/BI/GA)' },
      ]} />
      <ResidenceManager />
      <SchoolManager />

      {/* 2 — People */}
      <GroupHeader group={GROUPS[1]} />
      <Collapsible title="👩‍🏫 Teachers" countEndpoint="/people?type=Teacher"><TeachersAdmin /></Collapsible>
      <Collapsible title="🎒 Students" countEndpoint="/students"><StudentsAdmin /></Collapsible>
      <Collapsible title="⛪ Priests" countEndpoint="/people?isPriest=true"><PriestsAdmin /></Collapsible>
      <Collapsible title="🙏 FLAME Servants" countEndpoint="/people?type=Servant"><ServantsAdmin /></Collapsible>
      <Collapsible title="🏥 Medical Team" countEndpoint="/medical-team"><MedicalTeamAdmin /></Collapsible>

      {/* 3 — Learning Content */}
      <GroupHeader group={GROUPS[2]} />
      <Collapsible title="📚 Curriculum, Values & Formation"><DocumentsAdmin /></Collapsible>
      <Collapsible title="☀ Morning Assembly" countEndpoint="/morning-assembly"><MorningAssemblyAdmin /></Collapsible>

      {/* 4 — Other */}
      <GroupHeader group={GROUPS[3]} />
      <CrudSection title="⚙️ Miscellaneous" endpoint="/misc" fields={[
        { key: 'category', label: 'Category' },
        { key: 'label', label: 'Label' },
        { key: 'value', label: 'Value' },
        { key: 'notes', label: 'Notes' },
      ]} />
    </div>
  );
}
