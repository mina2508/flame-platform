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

export default function DatabaseAdmin() {
  return (
    <div className="space-y-4">
      <CrudSection title="🌍 Countries" endpoint="/countries" fields={[
        { key: 'name', label: 'Name' },
        { key: 'code', label: 'Code (GH/BI/GA)' },
      ]} />
      <ResidenceManager />
      <SchoolManager />
      <Collapsible title="👩‍🏫 Teachers" countEndpoint="/people?type=Teacher"><TeachersAdmin /></Collapsible>
      <Collapsible title="🎒 Students" countEndpoint="/students"><StudentsAdmin /></Collapsible>
      <Collapsible title="⛪ Priests" countEndpoint="/people?isPriest=true"><PriestsAdmin /></Collapsible>
      <Collapsible title="🙏 FLAME Servants" countEndpoint="/people?type=Servant"><ServantsAdmin /></Collapsible>
      <Collapsible title="📚 Curriculum, Values & Formation"><DocumentsAdmin /></Collapsible>
      <Collapsible title="☀ Morning Assembly" countEndpoint="/morning-assembly"><MorningAssemblyAdmin /></Collapsible>
      <Collapsible title="🏥 Medical Team" countEndpoint="/medical-team"><MedicalTeamAdmin /></Collapsible>
      <CrudSection title="⚙️ Miscellaneous" endpoint="/misc" fields={[
        { key: 'category', label: 'Category' },
        { key: 'label', label: 'Label' },
        { key: 'value', label: 'Value' },
        { key: 'notes', label: 'Notes' },
      ]} />
    </div>
  );
}
