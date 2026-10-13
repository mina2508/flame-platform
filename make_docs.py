# -*- coding: utf-8 -*-
"""
Generate FLAME platform deliverables (DETAILED):
  1) FLAME_Presentation.pptx  — visual feature showcase: steps + screenshots + highlights
  2) FLAME_Documentation.docx — per-feature deep dive: usage steps, screenshot,
     frontend, API (with request/response), DB tables, business rules + full DB
     reference (typed columns & constraints) and an ERD.
  3) FLAME_Documentation.pdf  — PDF export (best-effort via Word COM).
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
SHOTS = os.path.join(HERE, "screenshots")

def shot(name):
    p = os.path.join(SHOTS, name)
    return p if os.path.exists(p) else None

# Brand palette
FLAME = (0xF0, 0x4A, 0x18)
FLAME_DEEP = (0xA7, 0x19, 0x14)
SKY = (0x34, 0xA9, 0xD6)
LEAF = (0x27, 0x95, 0x6A)
INK = (0x24, 0x1C, 0x1A)
MUTED = (0x6B, 0x5E, 0x5A)
CREAM = (0xFF, 0xFA, 0xF4)
CODE_BG = (0xF4, 0xF1, 0xEE)

# ─────────────────────────── Feature catalog (detailed) ───────────────────────────
FEATURES = [
    {
        "title": "Public Home & Video Hero",
        "icon": "🔥",
        "shot": "01_home.png",
        "summary": "Landing page introducing the FLAME service with an intro video, animated hero, quick links, and an Apply call-to-action.",
        "steps": [
            "Open the site root (/) in a browser.",
            "The hero plays intro.mp4 with Pause / Sound controls.",
            "Use the navbar to reach Dashboard, Missions, Activities, News, Curriculum, Birthdays, or Map.",
            "Click 'Apply' to open the dynamic application form popup.",
            "Fill the fields rendered from the admin-defined form and submit.",
        ],
        "rules": [
            "The Apply form is fully data-driven: fields come from FormField records ordered by `order` where `active = true`.",
            "A submission stores all answers as a JSON blob in Application.values.",
        ],
        "frontend": "React page pages/public/Home.jsx composes components/VideoHero.jsx (HTML5 video + play/mute state) and components/ApplyModal.jsx. Styling: Tailwind utility classes + CSS design tokens in index.css (Cinzel/Inter fonts, glass-morphism cards, fade-up keyframe animations). Routing by react-router-dom.",
        "api": [
            ("GET", "/api/form-fields", "List active form fields for the Apply popup.", None,
             "[ { id, label, key, type, options, required, order, active } ]"),
            ("POST", "/api/applications", "Submit the Apply form.",
             '{ "values": { "name": "...", "country": "...", "role": "..." } }',
             "201 { id, values, submittedAt }"),
        ],
        "tables": ["FormField", "Application"],
    },
    {
        "title": "Public Missions Dashboard",
        "icon": "📊",
        "shot": "02_dashboard.png",
        "summary": "Live public story of the service: KPIs, Schools×Missions summary, per-school drill-down of tasks performed vs. not performed, and category totals — all driven by the date range and filters.",
        "steps": [
            "Open /dashboard.",
            "Set Period or From/To dates — the whole dashboard reloads automatically.",
            "Filter by Log Type, School, or Status (Completed / Expected / Pending).",
            "Read the KPI strip: Total Missions, Active Schools, Completed, Expected, Pending.",
            "Open any school to drill into task records grouped by log type.",
        ],
        "rules": [
            "The `to` date is treated as end-of-day (23:59:59.999) so same-day logs are always included.",
            "Total Missions counts DISTINCT real missions (by the mission id tagged in a log's notes); a mission visiting N schools counts once but shows activity in all N schools.",
            "A unit is Completed if its tasks are all performed or status = completed; Expected if status = expected; otherwise Pending.",
        ],
        "frontend": "pages/public/Dashboard.jsx — a useEffect keyed on every filter (from/to/period/type/school/status) reloads the data; KpiCard.jsx cards; nested <details> drill-down per school and per log type.",
        "api": [
            ("GET", "/api/dashboard/summary", "Aggregated KPIs + per-school + per-category.",
             "query: from, to, schoolId?, typeId?, status?",
             '{ range, kpis:{ totalMissions, activeSchools, completionSignal, completed, pending, expected }, bySchool:[...], byCategory:[...] }'),
            ("GET", "/api/logs", "Raw logs for the detailed story.", "query: from, to, schoolId?, typeId?, status?",
             "[ { id, logTypeId, schoolId, logDate, status, notes, tasks:[...] } ]"),
        ],
        "tables": ["MissionLog", "TaskRecord", "LogType", "School"],
    },
    {
        "title": "Missions (Admin): Status, Dates & Editing",
        "icon": "🚑",
        "shot": "12_admin_missions.png",
        "summary": "Create missions (Medical / Follow-ups / Activities / Values / Formation / Other) with mandatory status, start/end dates and at least one school. Each mission auto-generates dashboard logs and is fully editable.",
        "steps": [
            "Admin → Missions.",
            "Enter a title; pick type and status (Expected / Pending / Completed).",
            "Set mandatory start and end dates; select at least one school.",
            "Add countries (per-country dates), people and medical team — availability is shown.",
            "Create — one dashboard log per visited school is generated concurrently.",
            "Use Edit to change status/dates/summary; members become unavailable while a mission is Pending and free again when Completed or deleted.",
        ],
        "rules": [
            "Server-side validation: title, status, startDate, endDate and ≥1 school are required; endDate must be ≥ startDate (HTTP 400 otherwise).",
            "Generated MissionLog.logDate uses the mission startDate; log status mirrors the mission status.",
            "Mission type maps to a dashboard LogType (Medical→medical_log, Follow-ups→follow_up, Activities→activities, Values→values_class, Formation→formation); 'Other' creates no dashboard log.",
            "Deleting a mission cascades to its MissionCountry/School/Person/Medical rows and removes its generated logs + task records.",
            "The list endpoint returns country names + counts only (not the full nested graph) to keep it fast under load.",
        ],
        "frontend": "components/admin/MissionsAdmin.jsx — create form (status dropdown, date pickers, country rows, school/person/medic pickers with availability badges) + inline Edit panel.",
        "api": [
            ("GET", "/api/missions", "List (type filter optional). Returns counts + country names.", "query: type?",
             "[ { id, title, type, status, startDate, endDate, summary, anonymousCount, countries:[{country:{name}}], schools:[len], people:[len], medicalTeam:[len] } ]"),
            ("POST", "/api/missions", "Create a mission (+ generate logs).",
             '{ title, type, status, startDate, endDate, summary, numPeople, durationDays, anonymousCount, countries:[{countryId,startDate,endDate}], schoolIds:[], personIds:[], medicalMemberIds:[] }',
             "201 { ...mission with nested relations }"),
            ("PATCH", "/api/missions/:id", "Edit status/dates/summary/counts; syncs logs + availability.",
             '{ status?, startDate?, endDate?, summary?, numPeople?, ... }', "200 { ...mission }"),
            ("DELETE", "/api/missions/:id", "Delete mission + generated logs; frees members.", None, "204"),
        ],
        "tables": ["Mission", "MissionCountry", "MissionSchool", "MissionPerson", "MissionMedical", "MissionLog", "TaskRecord"],
    },
    {
        "title": "School Task Board (Logs, Visits, Content)",
        "icon": "🏫",
        "shot": "17_admin_schools.png",
        "summary": "Per-school hub: create medical logs / principal visits / tasks (summary + date mandatory), assign people with roles, and track assigned curriculum/values/formation with a status.",
        "steps": [
            "Admin → Database → Schools → expand a school.",
            "'Add Log / Task': choose a type, set date, write a summary (both required), pick a status.",
            "For a Values Class, select which values class from the extra selector that appears.",
            "'People & Roles': assign an existing person as Principal / Worker / Resident / Teacher / Priest, change a role, or remove from the school.",
            "Update any log or assigned-content status (Expected / Pending / Completed) inline.",
            "Manage Classes and add Students (linked to a class) in the same panel.",
        ],
        "rules": [
            "School-level logs require a non-empty summary and a date (HTTP 400 otherwise). The summary is stored in MissionLog.notes and mirrored as a TaskRecord 'Summary: ...'.",
            "Logging a Values Class also assigns it to the school (if not already) and syncs the per-school status.",
            "Assigning a person sets Person.schoolId and Person.position; removing clears schoolId.",
            "GET /schools/:id/tasks aggregates MissionLogs + CurriculumSchool + ValuesClassSchool + FormationSchool with their statuses.",
        ],
        "frontend": "components/admin/SchoolManager.jsx (SchoolDetail): task board, Add Log/Task form with conditional values-class selector, People & Roles, Classes + StudentForm.",
        "api": [
            ("GET", "/api/schools/:id/tasks", "Everything happening at a school, with statuses.", None,
             "{ logs:[{id,title,logDate,status,notes}], curriculum:[{id,title,status}], values:[...], formation:[...] }"),
            ("POST", "/api/logs", "Create a school-level log/task.",
             '{ schoolId, logTypeId, summary, logDate, status, responsiblePersonId? }', "201 { ...log }"),
            ("PATCH", "/api/logs/:id", "Edit a log (summary/date/status/type).", '{ summary?, logDate?, status?, logTypeId? }', "200 { ...log }"),
            ("GET", "/api/logs/types/school", "Creatable school log types.", None, "[ { id, label, icon } ]"),
        ],
        "tables": ["School", "MissionLog", "TaskRecord", "Person", "ClassLevel", "Student", "CurriculumSchool", "ValuesClassSchool", "FormationSchool"],
    },
    {
        "title": "Curriculum, Values & Formation",
        "icon": "📚",
        "shot": "06_curriculum.png",
        "summary": "Upload PDF documents (≤12MB) and assign them to multiple schools and classes (classes scoped to the chosen schools). Public visitors browse them by tab and open the PDFs.",
        "steps": [
            "Admin → Database → Curriculum, Values & Formation.",
            "Enter a title + language and upload a PDF.",
            "Select schools; the class picker then only lists classes in those schools.",
            "Use 'Edit assignments' on an existing item to re-assign schools/classes later.",
            "Public users open /curriculum, switch tabs, and open the PDFs.",
        ],
        "rules": [
            "Uploads are limited to 12MB (PDF) and stored on disk; the public URL is /uploads/<uuid>.pdf (proxied in dev, served statically in prod).",
            "A school assignment carries a status (expected|pending|completed) updatable per school.",
            "Deleting a document cascades to its class/school join rows.",
        ],
        "frontend": "components/admin/DocumentsAdmin.jsx (reusable DocManager used for all three) + public pages/public/Curriculum.jsx (Curriculum / Values / Formation tabs). Uploads via multipart/form-data.",
        "api": [
            ("GET", "/api/curriculum-docs", "List with classes + schools.", None, "[ { id, title, language, fileUrl, classes:[...], schools:[{schoolId,status,school}] } ]"),
            ("POST", "/api/curriculum-docs", "Upload + assign (multipart).", "form-data: title, description, language, file, schoolIds(JSON), classIds(JSON)", "201 { ...curriculum }"),
            ("PATCH", "/api/curriculum-docs/:id", "Edit meta + re-assign schools/classes.", '{ title?, schoolIds?, classIds? }', "200 { ...curriculum }"),
            ("PATCH", "/api/curriculum-docs/:id/school/:schoolId", "Set per-school status.", '{ status }', "200 { ...join }"),
        ],
        "tables": ["Curriculum", "CurriculumClass", "CurriculumSchool", "ValuesClass", "ValuesClassClass", "ValuesClassSchool", "Formation", "FormationSchool"],
    },
    {
        "title": "People: Teachers, Students, Priests, Servants",
        "icon": "👥",
        "shot": "11_admin_database.png",
        "summary": "A single reusable Person model powers teachers, priests, servants and school staff; Students are separate and belong to a class. Birthdate cannot be in the future. Country/school filters with live counts and full inline editing.",
        "steps": [
            "Admin → Database → Teachers / Students / Priests / Servants.",
            "Create a record (name required; students need a school + class).",
            "Filter by country and school; the section header shows the live count.",
            "New records appear instantly — filters auto-clear on create.",
            "Use Edit on any row to update details; birthdate pickers block future dates.",
        ],
        "rules": [
            "Person.fullName is the only required field; a Person is reusable across schools, residences and missions.",
            "Server rejects future birthdate/dob (HTTP 400).",
            "People filter: ?type=<position>, ?isPriest=true, ?schoolId=, ?countryId= (matches school's country OR priest's assigned country).",
            "Student must link to a class (and therefore a school).",
            "Person.available drives the busy/free marker used in mission selection.",
        ],
        "frontend": "TeachersAdmin.jsx, StudentsAdmin.jsx, PriestsAdmin.jsx, ServantsAdmin.jsx, PersonPicker.jsx. Counts rendered via Collapsible countEndpoint.",
        "api": [
            ("GET", "/api/people", "List/filter people.", "query: type?, isPriest?, schoolId?, countryId?, available?",
             "[ { id, fullName, birthdate, position, isPriest, available, school, priestCountry, residence, classesTaught } ]"),
            ("POST", "/api/people", "Create a person.", '{ fullName, position?, birthdate?, schoolId?, priestCountryId?, isPriest? }', "201 { ...person }"),
            ("PATCH", "/api/people/:id", "Edit / assign to school / change role.", '{ schoolId?, position?, available?, ... }', "200 { ...person }"),
            ("GET/POST/PATCH/DELETE", "/api/students", "Student CRUD.", '{ fullName, classId, birthday?, phone?, fatherName?, ... }', "{ ...student }"),
        ],
        "tables": ["Person", "Student", "ClassLevel", "School", "Country", "Residence"],
    },
    {
        "title": "Medical Team & Availability",
        "icon": "🏥",
        "shot": "11_admin_database.png",
        "summary": "Medical team members with specialty and availability. Availability is surfaced when selecting members for medical missions and flips automatically while a mission is in progress.",
        "steps": [
            "Admin → Database → Medical Team.",
            "Add a member (name, specialty, contact, email).",
            "Toggle availability or Edit the member inline.",
            "When creating a Medical mission, members show a green/red availability marker.",
        ],
        "rules": [
            "A Medical mission set to Pending marks its selected medics unavailable; Completed/Delete frees them.",
            "MissionMedical is a composite-key join (missionId + memberId).",
        ],
        "frontend": "components/admin/MedicalTeamAdmin.jsx (availability toggle + inline edit); consumed by MissionsAdmin.jsx.",
        "api": [
            ("GET", "/api/medical-team", "List members.", None, "[ { id, fullName, specialty, contact, email, available } ]"),
            ("POST", "/api/medical-team", "Add a member.", '{ fullName, specialty?, contact?, email? }', "201 { ...member }"),
            ("PATCH", "/api/medical-team/:id", "Edit / toggle availability.", '{ available? , ... }', "200 { ...member }"),
        ],
        "tables": ["MedicalTeamMember", "MissionMedical", "Mission"],
    },
    {
        "title": "Dynamic Application Form",
        "icon": "📝",
        "shot": "15_admin_formbuilder.png",
        "summary": "Admins define the Apply form fields (text / number / dropdown / toggle / rating 1–10). Visitors submit via a popup; admins review all submissions.",
        "steps": [
            "Admin → Application Form.",
            "Add fields and pick a type; for dropdown provide the option values.",
            "Mark required, set order, or remove fields.",
            "Visitors click Apply on Home and submit.",
            "Admin → Applications to review every submission.",
        ],
        "rules": [
            "FormField.key is unique; type ∈ {text, number, dropdown, toggle, rating}; dropdown options stored in `options`.",
            "Only active fields render on the public form, ordered by `order`.",
            "Application.values is a JSON string of answers keyed by field key.",
        ],
        "frontend": "components/admin/FormBuilder.jsx, components/ApplyModal.jsx, components/admin/ApplicationsAdmin.jsx.",
        "api": [
            ("GET", "/api/form-fields", "List fields.", None, "[ { id, label, key, type, options, required, order, active } ]"),
            ("POST/PATCH/DELETE", "/api/form-fields", "Manage fields.", '{ label, key, type, options?, required?, order? }', "{ ...field }"),
            ("GET", "/api/applications", "List submissions (reviewer/admin).", None, "[ { id, values, submittedAt } ]"),
            ("POST", "/api/applications", "Submit (public).", '{ values:{...} }', "201 { id, submittedAt }"),
        ],
        "tables": ["FormField", "Application"],
    },
    {
        "title": "Users, Roles & Permissions",
        "icon": "🔐",
        "shot": "14_admin_users.png",
        "summary": "Multi-role access control via JWT. Admin is the only role that manages users. Roles: admin, content_editor, reviewer, form_manager.",
        "steps": [
            "Log in as admin (POST /api/auth/login returns a JWT).",
            "Admin → Users.",
            "Create a user and assign one or more roles (stored comma-separated).",
            "Each role grants scoped access, enforced by requireRole on the server.",
        ],
        "rules": [
            "CAN_EDIT_CONTENT = admin, content_editor. CAN_REVIEW_APPLICATIONS = admin, reviewer. CAN_MANAGE_FORM = admin, form_manager. CAN_MANAGE_USERS = admin only.",
            "requireRole grants access if ANY of the user's roles is permitted.",
            "The JWT carries the roles array; the client attaches it as Authorization: Bearer <token>.",
            "Seed users: admin@flame.org / Flame@Admin2026 (and content@, reviewer@, forms@).",
        ],
        "frontend": "components/admin/UsersAdmin.jsx, auth context lib/auth.jsx, components/ProtectedRoute.jsx, axios interceptor in api/client.js.",
        "api": [
            ("POST", "/api/auth/login", "Authenticate.", '{ email, password }', "200 { token, user:{ id, name, roles } }"),
            ("GET/POST/PATCH/DELETE", "/api/users", "Manage users (admin only).", '{ name, email, password, role }', "{ ...user }"),
        ],
        "tables": ["User"],
    },
    {
        "title": "World Mission Map",
        "icon": "🗺️",
        "shot": "08_map.png",
        "summary": "Leaflet map of school locations with mission and people counts, filterable by country and city — filtering handled server-side.",
        "steps": [
            "Open /map.",
            "Browse pins for each geolocated school (lat/lng) with mission + people counts.",
            "Filter by country or city.",
        ],
        "rules": [
            "Only schools with latitude and longitude set appear as pins.",
            "Counts come from Prisma _count on missionLogs and people; results are grouped by country for the sidebar.",
        ],
        "frontend": "pages/public/WorldMap.jsx using react-leaflet@4 (React 18 compatible).",
        "api": [
            ("GET", "/api/map/locations", "Geolocated schools + counts.", "query: country?, city?",
             "{ locations:[{id,name,country,city,lat,lng,missions,people}], byCountry, total }"),
            ("GET", "/api/map/filters", "Distinct countries + cities.", None, "{ countries:[...], cities:[...] }"),
        ],
        "tables": ["School", "MissionLog"],
    },
    {
        "title": "Platform UX: Friendly Date Picker & Brand",
        "icon": "✨",
        "shot": "02_dashboard.png",
        "summary": "A custom, responsive calendar date picker replaces the native input everywhere, and the FLAME logo has an enhanced animated brand treatment.",
        "steps": [
            "Click any date field (dashboard range, mission dates, birthdays, logs).",
            "A calendar popover opens with month/year quick-select and ‹ › navigation.",
            "Pick a day, or use Today / Clear; disabled days respect min/max.",
            "On mobile the picker becomes a centered sheet with a dimmed backdrop.",
        ],
        "rules": [
            "The picker renders with fixed positioning so it never gets clipped by card overflow, flips above when space is tight, and clamps to the viewport.",
            "Values use the ISO YYYY-MM-DD format, so it is a drop-in replacement for the native date input across all forms.",
            "Animations respect prefers-reduced-motion.",
        ],
        "frontend": "components/DateField.jsx (self-contained, no external library) used by Dashboard, MissionsAdmin, SchoolManager, Teachers/Students, PersonPicker, Morning Assembly. Logo treatment via .flame-logo-hero / .flame-logo-nav in index.css.",
        "api": [("—", "(client-only)", "No API; pure UI component and styling.", None, None)],
        "tables": [],
    },
    {
        "title": "Activities, News & Birthdays",
        "icon": "🎉",
        "shot": "04_activities.png",
        "summary": "Admin-managed content surfaced to the public: activities (school / local_flame / other), news posts, and a birthday calendar aggregating people and students — each birthday showing a copyable contact number.",
        "steps": [
            "Admin manages Activities and News under News & Activities.",
            "Birthdays are computed from Person.birthdate (or legacy dob) and Student.birthday.",
            "Public users open /activities, /news, /birthdays.",
            "In Birthdays, click the 📞 contact chip to copy the number to the clipboard.",
        ],
        "rules": [
            "Activity.scope ∈ {school, local_flame, other}; may link to a school.",
            "Birthdays endpoint merges Person and Student records and sorts by month/day.",
            "Each birthday carries a contact: a person's contact, or a student's phone / parent contact (labelled).",
        ],
        "frontend": "pages/public/Activities.jsx, News.jsx, Birthdays.jsx; admin CrudSections + news admin.",
        "api": [
            ("GET/POST", "/api/activities", "Activities feed.", '{ caption, activityDate, scope, summary, schoolId? }', "{ ...activity }"),
            ("GET/POST", "/api/news", "News posts.", '{ title, body, postDate }', "{ ...post }"),
            ("GET", "/api/birthdays", "Merged birthday calendar.", None, "[ { name, date, source } ]"),
        ],
        "tables": ["Activity", "NewsPost", "Person", "Student"],
    },
]

# ─────────────────────────── Detailed DB tables ───────────────────────────
# name -> { "desc": str, "cols": [ (name, type, constraint, notes) ] }
def C(n, t, k="", notes=""):
    return (n, t, k, notes)

TABLES = {
    "User": {"desc": "Admin/staff accounts. Roles stored comma-separated.", "cols": [
        C("id", "String", "PK", "uuid"), C("name", "String", "", ""),
        C("email", "String", "UNIQUE", ""), C("passwordHash", "String", "", "bcrypt"),
        C("role", "String", "", "CSV of roles, default 'reviewer'"), C("createdAt", "DateTime", "", "now()"),
    ]},
    "Country": {"desc": "Top of the geography tree.", "cols": [
        C("id", "String", "PK", "uuid"), C("name", "String", "UNIQUE", ""),
        C("code", "String?", "", "e.g. GH"), C("active", "Boolean", "", "default true"), C("createdAt", "DateTime", "", ""),
    ]},
    "Residence": {"desc": "A residence belongs to a country; houses people.", "cols": [
        C("id", "String", "PK", ""), C("name", "String", "", ""), C("city", "String?", "", ""),
        C("address", "String?", "", ""), C("countryId", "String?", "FK→Country", ""), C("createdAt", "DateTime", "", ""),
    ]},
    "School": {"desc": "A school in a country; owns classes, staff, logs, content.", "cols": [
        C("id", "String", "PK", ""), C("name", "String", "", ""), C("city", "String?", "", ""),
        C("address", "String?", "", ""), C("phone", "String?", "", ""), C("email", "String?", "", ""),
        C("countryId", "String?", "FK→Country", ""), C("region", "String?", "", "holds city for map"),
        C("workingDays", "String", "", "default '1,2,3,4,5'"), C("latitude", "Float?", "", ""),
        C("longitude", "Float?", "", ""), C("active", "Boolean", "", "default true"),
    ]},
    "Person": {"desc": "Central reusable person: teacher/priest/worker/resident/servant.", "cols": [
        C("id", "String", "PK", ""), C("fullName", "String", "REQUIRED", "only mandatory field"),
        C("birthdate", "DateTime?", "", "no future dates"), C("nationality", "String?", "", ""),
        C("position", "String?", "", "Principal|Teacher|Worker|Resident|Priest|Servant|Other"),
        C("contact", "String?", "", ""), C("email", "String?", "", ""),
        C("isPriest", "Boolean", "", "default false"), C("available", "Boolean", "", "default true"),
        C("dob", "DateTime?", "", "legacy birthday"), C("schoolId", "String?", "FK→School", ""),
        C("residenceId", "String?", "FK→Residence", ""), C("priestCountryId", "String?", "FK→Country", ""),
    ]},
    "ClassLevel": {"desc": "A class within a school with one teacher.", "cols": [
        C("id", "String", "PK", ""), C("name", "String", "", ""), C("stage", "String?", "", ""),
        C("order", "Int", "", "default 0"), C("schoolId", "String?", "FK→School", ""),
        C("teacherId", "String?", "FK→Person", ""), C("active", "Boolean", "", "default true"),
    ]},
    "Student": {"desc": "A student belonging to a class (and thus a school).", "cols": [
        C("id", "String", "PK", ""), C("fullName", "String", "REQUIRED", ""),
        C("birthday", "DateTime?", "", "no future"), C("phone", "String?", "", ""),
        C("fatherName", "String?", "", ""), C("fatherContact", "String?", "", ""),
        C("motherName", "String?", "", ""), C("motherContact", "String?", "", ""),
        C("classId", "String?", "FK→ClassLevel", ""),
    ]},
    "MedicalTeamMember": {"desc": "Selectable in medical missions; has availability.", "cols": [
        C("id", "String", "PK", ""), C("fullName", "String", "REQUIRED", ""), C("specialty", "String?", "", ""),
        C("contact", "String?", "", ""), C("email", "String?", "", ""), C("available", "Boolean", "", "default true"),
    ]},
    "Curriculum": {"desc": "PDF curriculum (≤12MB), multi-assignable.", "cols": [
        C("id", "String", "PK", ""), C("title", "String", "", ""), C("description", "String?", "", ""),
        C("language", "String?", "", "ar|en|fr"), C("fileUrl", "String?", "", "/uploads/..pdf"),
    ]},
    "CurriculumClass": {"desc": "Curriculum ↔ Class (M:N).", "cols": [
        C("curriculumId", "String", "PK/FK→Curriculum", ""), C("classId", "String", "PK/FK→ClassLevel", ""),
    ]},
    "CurriculumSchool": {"desc": "Curriculum ↔ School with per-school status.", "cols": [
        C("curriculumId", "String", "PK/FK→Curriculum", ""), C("schoolId", "String", "PK/FK→School", ""),
        C("status", "String", "", "expected|pending|completed"),
    ]},
    "ValuesClass": {"desc": "Values-class PDF (same model as curriculum).", "cols": [
        C("id", "String", "PK", ""), C("title", "String", "", ""), C("description", "String?", "", ""),
        C("language", "String?", "", ""), C("fileUrl", "String?", "", ""),
    ]},
    "ValuesClassClass": {"desc": "ValuesClass ↔ Class (M:N).", "cols": [
        C("valuesClassId", "String", "PK/FK", ""), C("classId", "String", "PK/FK→ClassLevel", ""),
    ]},
    "ValuesClassSchool": {"desc": "ValuesClass ↔ School with status.", "cols": [
        C("valuesClassId", "String", "PK/FK", ""), C("schoolId", "String", "PK/FK→School", ""),
        C("status", "String", "", "expected|pending|completed"),
    ]},
    "Formation": {"desc": "Formation files, multi-school.", "cols": [
        C("id", "String", "PK", ""), C("title", "String", "", ""), C("description", "String?", "", ""), C("fileUrl", "String?", "", ""),
    ]},
    "FormationSchool": {"desc": "Formation ↔ School with status.", "cols": [
        C("formationId", "String", "PK/FK", ""), C("schoolId", "String", "PK/FK→School", ""),
        C("status", "String", "", "expected|pending|completed"),
    ]},
    "Mission": {"desc": "A field mission; generates dashboard logs.", "cols": [
        C("id", "String", "PK", ""), C("title", "String", "", ""), C("type", "String", "", "Medical|Follow-ups|.."),
        C("status", "String", "", "expected|pending|completed"), C("startDate", "DateTime?", "", "required by API"),
        C("endDate", "DateTime?", "", "required by API, ≥ start"), C("summary", "String?", "", ""),
        C("numPeople", "Int?", "", ""), C("durationDays", "Int?", "", ""), C("anonymousCount", "Int", "", "default 0"),
    ]},
    "MissionCountry": {"desc": "Mission ↔ Country with per-country dates.", "cols": [
        C("id", "String", "PK", ""), C("missionId", "String", "FK→Mission (cascade)", ""),
        C("countryId", "String", "FK→Country", ""), C("startDate", "DateTime?", "", ""), C("endDate", "DateTime?", "", ""),
    ]},
    "MissionSchool": {"desc": "Mission ↔ School visited (composite PK).", "cols": [
        C("missionId", "String", "PK/FK (cascade)", ""), C("schoolId", "String", "PK/FK→School", ""),
    ]},
    "MissionPerson": {"desc": "Mission ↔ Person (team).", "cols": [
        C("missionId", "String", "PK/FK (cascade)", ""), C("personId", "String", "PK/FK→Person", ""),
    ]},
    "MissionMedical": {"desc": "Mission ↔ MedicalTeamMember.", "cols": [
        C("missionId", "String", "PK/FK (cascade)", ""), C("memberId", "String", "PK/FK→MedicalTeamMember", ""),
    ]},
    "MorningAssembly": {"desc": "Six sections, each text OR an uploaded file.", "cols": [
        C("id", "String", "PK", ""), C("schoolId", "String?", "FK→School", ""), C("date", "DateTime?", "", ""),
        C("openingPrayer(+File)", "String?", "", ""), C("physicalExercise(+File)", "String?", "", ""),
        C("radio(+File)", "String?", "", ""), C("nationalAnthem(+File)", "String?", "", ""),
        C("inspection(+File)", "String?", "", ""), C("announcement(+File)", "String?", "", ""),
    ]},
    "LogType": {"desc": "Dashboard category for logs.", "cols": [
        C("id", "String", "PK", "e.g. medical_log"), C("key", "String", "UNIQUE", ""),
        C("label", "String", "", ""), C("icon", "String?", "", ""), C("expectedPerWorkingDay", "Int", "", "default 0"),
    ]},
    "MissionLog": {"desc": "The dashboard record; unifies missions and school tasks.", "cols": [
        C("id", "String", "PK", ""), C("logTypeId", "String", "FK→LogType", ""),
        C("schoolId", "String", "FK→School", ""), C("responsiblePersonId", "String?", "FK→Person", ""),
        C("logDate", "DateTime", "", ""), C("status", "String", "", "expected|pending|completed"),
        C("notes", "String?", "", "holds 'mission:<id>' tag or summary"), C("createdById", "String?", "FK→User", ""),
    ]},
    "TaskRecord": {"desc": "Granular performed/not-performed items under a log.", "cols": [
        C("id", "String", "PK", ""), C("missionLogId", "String", "FK→MissionLog (cascade)", ""),
        C("question", "String", "", ""), C("performed", "Boolean", "", "default false"),
        C("responsible", "String?", "", ""), C("recordedDate", "DateTime?", "", ""),
    ]},
    "Activity": {"desc": "Public activity feed item.", "cols": [
        C("id", "String", "PK", ""), C("caption", "String?", "", ""), C("activityDate", "DateTime?", "", ""),
        C("scope", "String", "", "school|local_flame|other"), C("summary", "String?", "", ""),
        C("schoolId", "String?", "FK→School", ""), C("imageUrl", "String?", "", ""),
    ]},
    "NewsPost": {"desc": "Public news post.", "cols": [
        C("id", "String", "PK", ""), C("title", "String", "", ""), C("body", "String?", "", ""),
        C("postDate", "DateTime?", "", ""), C("imageUrl", "String?", "", ""),
    ]},
    "FormField": {"desc": "A field in the dynamic Apply form.", "cols": [
        C("id", "String", "PK", ""), C("label", "String", "", ""), C("key", "String", "UNIQUE", ""),
        C("type", "String", "", "text|number|dropdown|toggle|rating"), C("options", "String?", "", "dropdown values"),
        C("required", "Boolean", "", "default false"), C("order", "Int", "", "default 0"), C("active", "Boolean", "", "default true"),
    ]},
    "Application": {"desc": "A submitted Apply form.", "cols": [
        C("id", "String", "PK", ""), C("values", "String", "", "JSON of answers"), C("submittedAt", "DateTime", "", ""),
    ]},
    "MiscEntry": {"desc": "Generic reference/lookup entries.", "cols": [
        C("id", "String", "PK", ""), C("category", "String", "", ""), C("label", "String", "", ""),
        C("value", "String?", "", ""), C("notes", "String?", "", ""),
    ]},
}

# Relationships for ERD edges
RELATIONS = [
    ("Country", "School", "has"), ("Country", "Residence", "has"), ("Country", "Person", "priest"),
    ("Residence", "Person", "houses"), ("School", "ClassLevel", "has"), ("School", "Person", "staff"),
    ("ClassLevel", "Student", "has"), ("ClassLevel", "Person", "teacher"),
    ("Curriculum", "CurriculumSchool", ""), ("School", "CurriculumSchool", ""),
    ("ClassLevel", "CurriculumClass", ""), ("Curriculum", "CurriculumClass", ""),
    ("ValuesClass", "ValuesClassSchool", ""), ("School", "ValuesClassSchool", ""),
    ("Formation", "FormationSchool", ""), ("School", "FormationSchool", ""),
    ("Mission", "MissionCountry", ""), ("Country", "MissionCountry", ""),
    ("Mission", "MissionSchool", ""), ("School", "MissionSchool", ""),
    ("Mission", "MissionPerson", ""), ("Person", "MissionPerson", ""),
    ("Mission", "MissionMedical", ""), ("MedicalTeamMember", "MissionMedical", ""),
    ("LogType", "MissionLog", "typed"), ("School", "MissionLog", "at"),
    ("Person", "MissionLog", "owner"), ("User", "MissionLog", "created"),
    ("MissionLog", "TaskRecord", "has"), ("School", "Activity", "at"),
]


# ═══════════════════════════ ERD renderer (Pillow) ═══════════════════════════
def render_erd(path):
    from PIL import Image, ImageDraw, ImageFont

    def font(sz, bold=False):
        try:
            return ImageFont.truetype("arialbd.ttf" if bold else "arial.ttf", sz)
        except Exception:
            return ImageFont.load_default()

    GROUPS = [
        ("Geography & People", ["Country", "Residence", "School", "ClassLevel", "Person", "Student", "MedicalTeamMember"]),
        ("Content", ["Curriculum", "CurriculumSchool", "CurriculumClass", "ValuesClass", "ValuesClassSchool", "ValuesClassClass", "Formation", "FormationSchool", "MorningAssembly"]),
        ("Missions & Logs", ["Mission", "MissionCountry", "MissionSchool", "MissionPerson", "MissionMedical", "LogType", "MissionLog", "TaskRecord"]),
        ("Feed & Admin", ["Activity", "NewsPost", "FormField", "Application", "User", "MiscEntry"]),
    ]
    BOX_W, PAD_X, PAD_Y = 236, 60, 46
    HEADER_H, ROW_H, TITLE_H = 28, 15, 60
    COL_GAP, ROW_GAP = 56, 24

    pos, max_h, col_x = {}, 0, PAD_X
    for gname, tbls in GROUPS:
        y = PAD_Y + TITLE_H
        for t in tbls:
            n = len(TABLES.get(t, {}).get("cols", []))
            h = HEADER_H + ROW_H * n + 8
            pos[t] = (col_x, y, BOX_W, h)
            y += h + ROW_GAP
        max_h = max(max_h, y)
        col_x += BOX_W + COL_GAP

    W, H = col_x + PAD_X, max_h + PAD_Y
    img = Image.new("RGB", (W, H), (255, 252, 248))
    d = ImageDraw.Draw(img)
    d.text((PAD_X, 22), "FLAME Platform — Database ERD", fill=FLAME_DEEP, font=font(30, True))

    col_x = PAD_X
    for gname, tbls in GROUPS:
        d.text((col_x, PAD_Y + 26), gname.upper(), fill=SKY, font=font(14, True))
        col_x += BOX_W + COL_GAP

    def anchor(t):
        x, y, w, h = pos[t]; return (x + w / 2, y + h / 2)

    for a, b, _ in RELATIONS:
        if a in pos and b in pos:
            ax, ay = anchor(a); bx, by = anchor(b)
            d.line([(ax, ay), (bx, by)], fill=(214, 203, 197), width=1)

    for t, (x, y, w, h) in pos.items():
        d.rounded_rectangle([x, y, x + w, y + h], radius=9, fill=(255, 255, 255), outline=(225, 214, 208), width=1)
        d.rectangle([x, y, x + w, y + HEADER_H], fill=FLAME)
        d.text((x + 9, y + 6), t, fill=(255, 255, 255), font=font(13, True))
        fy = y + HEADER_H + 3
        for (cn, ct, ck, _) in TABLES.get(t, {}).get("cols", []):
            is_key = ("PK" in ck) or ("FK" in ck)
            label = cn + ("  " + ck.split("→")[0] if ck else "")
            d.text((x + 9, fy), label[:34], fill=(SKY if "FK" in ck else (FLAME_DEEP if "PK" in ck else INK)), font=font(10, is_key))
            fy += ROW_H
    img.save(path)
    return path


# ═══════════════════════════ Presentation (PPTX) ═══════════════════════════
def build_pptx(path, erd_path):
    from pptx import Presentation
    from pptx.util import Inches, Pt, Emu
    from pptx.dml.color import RGBColor
    from pptx.enum.text import PP_ALIGN
    from pptx.enum.shapes import MSO_SHAPE
    from PIL import Image as PImage

    def rgb(t): return RGBColor(*t)
    prs = Presentation(); prs.slide_width = Inches(13.333); prs.slide_height = Inches(7.5)
    SW = prs.slide_width; blank = prs.slide_layouts[6]

    def bg(s, c): s.background.fill.solid(); s.background.fill.fore_color.rgb = rgb(c)
    def box(s, l, t, w, h, c, rad=True):
        shp = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE if rad else MSO_SHAPE.RECTANGLE, l, t, w, h)
        shp.fill.solid(); shp.fill.fore_color.rgb = rgb(c); shp.line.fill.background(); shp.shadow.inherit = False
        return shp
    def txt(s, l, t, w, h, text, size, color, bold=False, align=PP_ALIGN.LEFT, font="Segoe UI"):
        tb = s.shapes.add_textbox(l, t, w, h); tf = tb.text_frame; tf.word_wrap = True
        p = tf.paragraphs[0]; p.alignment = align; r = p.add_run(); r.text = text
        r.font.size = Pt(size); r.font.bold = bold; r.font.color.rgb = rgb(color); r.font.name = font
        return tb

    # Title
    s = prs.slides.add_slide(blank); bg(s, FLAME_DEEP)
    box(s, 0, Inches(2.5), SW, Inches(2.5), FLAME)
    txt(s, Inches(0.8), Inches(2.65), Inches(11.7), Inches(1.2), "FLAME Platform", 56, (255,255,255), True, PP_ALIGN.CENTER, "Georgia")
    txt(s, Inches(0.8), Inches(3.85), Inches(11.7), Inches(0.8), "Feature Showcase & Walkthrough", 24, (255,255,255), False, PP_ALIGN.CENTER)
    txt(s, Inches(0.8), Inches(5.7), Inches(11.7), Inches(0.6), "React + Vite · Node/Express · Prisma · SQLite · Leaflet", 14, (255,220,210), False, PP_ALIGN.CENTER)

    # Agenda
    s = prs.slides.add_slide(blank); bg(s, CREAM)
    txt(s, Inches(0.7), Inches(0.4), Inches(12), Inches(0.8), "What's inside", 32, FLAME_DEEP, True, font="Georgia")
    half = (len(FEATURES) + 1) // 2
    for i, f in enumerate(FEATURES):
        col = 0 if i < half else 1; row = i if i < half else i - half
        txt(s, Inches(0.9 + col*6.2), Inches(1.5 + row*0.62), Inches(6.0), Inches(0.55), f"{f['icon']}  {f['title']}", 15, INK)

    # Feature slides (2 per feature: overview+steps, then screenshot+highlights)
    for idx, f in enumerate(FEATURES, 1):
        s = prs.slides.add_slide(blank); bg(s, CREAM)
        box(s, 0, 0, SW, Inches(1.15), FLAME_DEEP, rad=False)
        txt(s, Inches(0.6), Inches(0.16), Inches(10), Inches(0.5), f"{f['icon']}  {f['title']}", 25, (255,255,255), True, font="Georgia")
        txt(s, Inches(0.62), Inches(0.76), Inches(12), Inches(0.35), f["summary"], 12, (255,224,214))

        # steps card
        box(s, Inches(0.5), Inches(1.45), Inches(5.2), Inches(5.5), (255,255,255))
        txt(s, Inches(0.72), Inches(1.62), Inches(4.8), Inches(0.4), "How to use it", 16, FLAME, True)
        yy = Inches(2.25)
        for n, step in enumerate(f["steps"], 1):
            tb = s.shapes.add_textbox(Inches(0.72), yy, Inches(4.78), Inches(0.9)); tf = tb.text_frame; tf.word_wrap = True
            p = tf.paragraphs[0]
            r1 = p.add_run(); r1.text = f"{n}. "; r1.font.bold = True; r1.font.size = Pt(12.5); r1.font.color.rgb = rgb(SKY)
            r2 = p.add_run(); r2.text = step; r2.font.size = Pt(12); r2.font.color.rgb = rgb(INK)
            yy = Emu(int(yy) + Inches(0.62))

        # screenshot
        sp = shot(f["shot"])
        if sp:
            iw, ih = PImage.open(sp).size
            maxw, maxh = Inches(6.6), Inches(4.0); ratio = min(maxw/iw, maxh/ih)
            w = Emu(int(iw*ratio)); h = Emu(int(ih*ratio))
            lft = Inches(6.0) + (maxw - w)//2
            box(s, lft-Emu(55000), Inches(1.5)-Emu(55000), w+Emu(110000), h+Emu(110000), (255,255,255))
            s.shapes.add_picture(sp, lft, Inches(1.5), width=w, height=h)
        # rules/highlights under screenshot
        box(s, Inches(6.0), Inches(5.7), Inches(6.6), Inches(1.3), (255,242,236))
        txt(s, Inches(6.2), Inches(5.78), Inches(6.3), Inches(0.3), "Key rules", 12, FLAME_DEEP, True)
        rules = f.get("rules", [])[:2]
        tb = s.shapes.add_textbox(Inches(6.2), Inches(6.08), Inches(6.3), Inches(0.95)); tf = tb.text_frame; tf.word_wrap = True
        for i, rl in enumerate(rules):
            p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
            r = p.add_run(); r.text = "• " + rl; r.font.size = Pt(9.5); r.font.color.rgb = rgb(MUTED)
        txt(s, Inches(11.6), Inches(7.05), Inches(1.5), Inches(0.4), f"{idx}/{len(FEATURES)}", 11, MUTED, False, PP_ALIGN.RIGHT)

    # ERD slide
    s = prs.slides.add_slide(blank); bg(s, (255,255,255))
    txt(s, Inches(0.5), Inches(0.22), Inches(12), Inches(0.6), "Database ERD", 26, FLAME_DEEP, True, font="Georgia")
    if os.path.exists(erd_path):
        iw, ih = PImage.open(erd_path).size
        maxw, maxh = Inches(12.6), Inches(6.3); ratio = min(maxw/iw, maxh/ih)
        w = Emu(int(iw*ratio)); h = Emu(int(ih*ratio))
        s.shapes.add_picture(erd_path, Inches(0.35) + (maxw - w)//2, Inches(0.95), width=w, height=h)

    # Closing
    s = prs.slides.add_slide(blank); bg(s, FLAME_DEEP)
    txt(s, Inches(0.8), Inches(3.0), Inches(11.7), Inches(1.0), "Thank you", 44, (255,255,255), True, PP_ALIGN.CENTER, "Georgia")
    txt(s, Inches(0.8), Inches(4.1), Inches(11.7), Inches(0.6), "FLAME Function · St. Paul Coptic Service", 18, (255,220,210), False, PP_ALIGN.CENTER)

    prs.save(path); return path


# ═══════════════════════════ Documentation (DOCX) ═══════════════════════════
def build_docx(path, erd_path):
    from docx import Document
    from docx.shared import Pt, Inches, RGBColor
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.oxml.ns import qn
    from docx.oxml import OxmlElement
    from PIL import Image as PImage

    doc = Document()
    doc.styles["Normal"].font.name = "Calibri"; doc.styles["Normal"].font.size = Pt(11)

    def heading(txt, size, color, sb=10, sa=6):
        p = doc.add_paragraph(); p.paragraph_format.space_before = Pt(sb); p.paragraph_format.space_after = Pt(sa)
        r = p.add_run(txt); r.bold = True; r.font.size = Pt(size); r.font.color.rgb = RGBColor(*color); return p

    def para(txt, size=11, color=INK, bold=False, italic=False):
        p = doc.add_paragraph(); r = p.add_run(txt); r.font.size = Pt(size); r.bold = bold; r.italic = italic
        r.font.color.rgb = RGBColor(*color); return p

    def shade(cell, hexclr):
        tcPr = cell._tc.get_or_add_tcPr(); sh = OxmlElement("w:shd")
        sh.set(qn("w:fill"), hexclr); tcPr.append(sh)

    def code_block(label, text):
        if not text: return
        p = doc.add_paragraph(); r = p.add_run(label); r.bold = True; r.font.size = Pt(10); r.font.color.rgb = RGBColor(*MUTED)
        tbl = doc.add_table(rows=1, cols=1); tbl.style = "Table Grid"
        cell = tbl.rows[0].cells[0]; shade(cell, "F4F1EE")
        cp = cell.paragraphs[0]; cr = cp.add_run(text); cr.font.name = "Consolas"; cr.font.size = Pt(9.5); cr.font.color.rgb = RGBColor(*INK)

    def add_image_fit(img_path, max_in=6.2):
        if not img_path or not os.path.exists(img_path): return
        iw, ih = PImage.open(img_path).size
        doc.add_picture(img_path, width=Inches(min(max_in, iw/96.0)))
        doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER

    # Cover
    t = doc.add_paragraph(); t.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = t.add_run("FLAME Platform"); r.bold = True; r.font.size = Pt(34); r.font.color.rgb = RGBColor(*FLAME_DEEP)
    st = doc.add_paragraph(); st.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = st.add_run("Technical & Feature Documentation"); r.font.size = Pt(16); r.font.color.rgb = RGBColor(*MUTED)
    sub = doc.add_paragraph(); sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = sub.add_run("For each feature: step-by-step usage with a screenshot, and the full implementation — frontend, API (request/response), database tables, and business rules — plus a typed database reference and an ERD."); r.italic = True; r.font.size = Pt(11); r.font.color.rgb = RGBColor(*MUTED)
    logo = os.path.join(HERE, "client", "public", "flame-logo.png")
    if os.path.exists(logo):
        doc.add_paragraph()
        try: doc.add_picture(logo, width=Inches(1.6)); doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER
        except Exception: pass

    # Architecture
    doc.add_page_break()
    heading("1. Architecture Overview", 20, FLAME_DEEP)
    para("Two-tier web application:", 11, bold=True)
    para("• Client — React 18 + Vite + Tailwind CSS (dev port 5173). react-router-dom routing; axios API client with a JWT interceptor; react-leaflet maps.", 11)
    para("• Server — Node.js + Express REST API (port 4000). Prisma ORM over SQLite (swap provider to PostgreSQL for production). JWT auth (jsonwebtoken), bcrypt password hashing, Multer uploads (≤12MB PDF / ≤2MB other) served from /uploads.", 11)
    para("Unified concept — Missions and MissionLogs are the same idea: creating a mission generates one MissionLog per visited school; the public dashboard reads these logs. School-level logs/tasks are the same MissionLog records created directly on a school.", 11)
    para("Status model — Expected (not started) · Pending (in progress) · Completed. Dashboard date filters treat the end date as end-of-day so same-day entries always count.", 11)
    para("Auth & roles — admin (full + the only one who manages users), content_editor, reviewer, form_manager. requireRole grants access if any of a user's roles is permitted.", 11)

    # Features
    doc.add_page_break()
    heading("2. Features", 22, FLAME_DEEP)
    for idx, f in enumerate(FEATURES, 1):
        heading(f"2.{idx}  {f['icon']} {f['title']}", 17, FLAME, sb=14)
        para(f["summary"], 11, MUTED, italic=True)

        heading("How to use it", 13, SKY, sb=8, sa=2)
        for step in f["steps"]:
            p = doc.add_paragraph(style="List Number"); p.add_run(step).font.size = Pt(11)

        add_image_fit(shot(f["shot"]))

        heading("Business rules", 13, SKY, sb=8, sa=2)
        for rl in f.get("rules", []):
            p = doc.add_paragraph(style="List Bullet"); p.add_run(rl).font.size = Pt(10.5)

        heading("Frontend", 13, SKY, sb=8, sa=2)
        para(f["frontend"], 10.5)

        heading("API", 13, SKY, sb=8, sa=2)
        for ep in f["api"]:
            method, url, desc = ep[0], ep[1], ep[2]
            req = ep[3] if len(ep) > 3 else None
            resp = ep[4] if len(ep) > 4 else None
            p = doc.add_paragraph()
            rm = p.add_run(method + "  "); rm.bold = True; rm.font.name = "Consolas"; rm.font.size = Pt(10.5); rm.font.color.rgb = RGBColor(*FLAME_DEEP)
            ru = p.add_run(url); ru.font.name = "Consolas"; ru.font.size = Pt(10.5); ru.font.color.rgb = RGBColor(*INK)
            dp = doc.add_paragraph(); dr = dp.add_run("   " + desc); dr.italic = True; dr.font.size = Pt(10); dr.font.color.rgb = RGBColor(*MUTED)
            if req: code_block("Request", req)
            if resp: code_block("Response", resp)

        heading("Database tables used", 13, SKY, sb=8, sa=2)
        para(", ".join(f["tables"]), 10.5)
        doc.add_paragraph()

    # DB reference
    doc.add_page_break()
    heading("3. Database Reference", 22, FLAME_DEEP)
    para("Every table with typed columns. Key = PK (primary key) / FK→Target (foreign key). '?' marks a nullable column.", 11, MUTED, italic=True)
    for name, meta in TABLES.items():
        heading(name, 14, FLAME, sb=10, sa=2)
        para(meta["desc"], 10.5, MUTED, italic=True)
        tbl = doc.add_table(rows=1, cols=4); tbl.style = "Light Grid Accent 1"
        hdr = tbl.rows[0].cells
        for i, h in enumerate(["Column", "Type", "Key / Constraint", "Notes"]):
            run = hdr[i].paragraphs[0].add_run(h); run.bold = True; run.font.size = Pt(9.5)
            shade(hdr[i], "A71914")
            run.font.color.rgb = RGBColor(255, 255, 255)
        for (cn, ct, ck, notes) in meta["cols"]:
            cells = tbl.add_row().cells
            for i, v in enumerate([cn, ct, ck, notes]):
                rr = cells[i].paragraphs[0].add_run(v); rr.font.size = Pt(9)
                if i == 0: rr.bold = True
        doc.add_paragraph()

    # ERD
    doc.add_page_break()
    heading("4. Entity-Relationship Diagram", 22, FLAME_DEEP)
    para("Tables grouped by domain (Geography & People · Content · Missions & Logs · Feed & Admin) with their relationships. PK in red, FK in blue.", 11, MUTED, italic=True)
    add_image_fit(erd_path, max_in=6.8)

    doc.save(path); return path


# ═══════════════════════════ Runner ═══════════════════════════
def main():
    erd_path = os.path.join(SHOTS, "_erd.png")
    print("Rendering ERD..."); render_erd(erd_path)
    pptx_path = os.path.join(HERE, "FLAME_Presentation.pptx")
    docx_path = os.path.join(HERE, "FLAME_Documentation.docx")
    print("Building presentation..."); build_pptx(pptx_path, erd_path); print("  ->", pptx_path)
    print("Building documentation..."); build_docx(docx_path, erd_path); print("  ->", docx_path)
    print("Done.")

if __name__ == "__main__":
    main()
