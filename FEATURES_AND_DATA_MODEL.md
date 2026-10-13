# FLAME Platform — Features & Data Model

A React + Node.js rebuild of the FLAME Function platform (currently Google
AppSheet admin + GitHub Pages public site backed by Google Sheets).

---

## 1. Feature List

### Admin (authenticated) — replaces the AppSheet "Flame-Admin" app
- **Auth & roles**: Admin, Priest/Supervisor, Teacher, Viewer.
- **Schools management**: CRUD schools (name, country, region, working days).
- **People management**: Teachers, Principals, Students, Servants — with DOB,
  position, assigned school.
- **Mission log entry**: record log entries by category:
  - Morning Assembly, Principals Visit, Values Class, Follow-Up, Medical Log, Activities.
  - Each log holds task/question records (checklist of performed / not performed).
- **Curriculum manager**: upload/link PDF lessons, description, folder, language.
- **Activities manager**: upload activity photos with caption + date + school.
- **News manager**: create news posts (title, body, image, date).
- **Birthdays**: derived automatically from People DOB (no separate entry).

### Public (read-only) — replaces the GitHub Pages site
- **Public Logs Dashboard**: date-range filter; schools × missions summary with
  actual/expected counts; KPI cards (total missions, active schools, completion
  signal); per-school drill-down (performed / not performed tasks); progress by
  category and by school; print view.
- **Activities gallery**: photo grid with captions and dates.
- **Last News feed**: cards with image, date, title, body.
- **Curriculum library**: searchable list of PDFs (search by description), folder
  grouping, open/download links.
- **Birthdays calendar**: monthly calendar aggregating all people's birthdays,
  DOB mapped to current year, day detail, name/position search.
- **World Missions map**: interactive map of mission locations.
- **Apply form**: application submission (or link out).

---

## 2. Core Domain Concepts

- **School**: a site where missions happen. Has country, working-day calendar.
- **Person**: teacher / principal / student / servant, optionally tied to a school.
- **LogType**: Morning Assembly, Principals Visit, Values Class, Follow-Up,
  Medical Log, Activities. Each has an *expected per working day* rule.
- **MissionLog**: one recorded instance (responsible person + school + date +
  log type). Contains many TaskRecords.
- **TaskRecord**: a single checklist item/question with a done/not-done result.
- **Mission** (derived, not stored): unique (responsiblePerson, school, date,
  logType). Completion = all its task records done.

### Expected-count rule (from the current dashboard)
- Per working day: **1 Morning Assembly** + **5 Principals Visits** per school.
- Expected totals = rule × working days in the selected range.

---

## 3. Data Model (relational / PostgreSQL)

```
users
  id (uuid, pk)
  name
  email (unique)
  password_hash
  role            enum: admin | supervisor | teacher | viewer
  created_at

schools
  id (uuid, pk)
  name
  country
  region
  working_days    int[]  -- 0..6 (Sun..Sat), e.g. {1,2,3,4,5}
  active          bool
  created_at

people
  id (uuid, pk)
  full_name
  position         -- "G2 - St Anthony", "Teacher", "Principal", "Student"
  type             enum: teacher | principal | student | servant
  dob              date
  school_id        fk -> schools.id (nullable)
  created_at

log_types
  id (uuid, pk)
  key              -- morning_assembly | principals_visit | values_class |
                   --   follow_up | medical_log | activities
  label
  icon             -- emoji or icon name
  expected_per_working_day  int   -- 1, 5, 0...

mission_logs
  id (uuid, pk)
  log_type_id      fk -> log_types.id
  school_id        fk -> schools.id
  responsible_person_id fk -> people.id
  log_date         date
  status           enum: completed | pending | partial  (derived or stored)
  notes            text
  created_by       fk -> users.id
  created_at

task_records
  id (uuid, pk)
  mission_log_id   fk -> mission_logs.id
  question         text
  performed        bool
  responsible      -- free text e.g. "Fr.Bishoy - Ghana"
  recorded_date    date

curriculum_files
  id (uuid, pk)
  title
  description
  folder           -- "Ghana's Curriculum", "Cours de vie", null
  language         -- ar | en | fr
  file_url         -- Drive link or local storage path
  created_at

activities
  id (uuid, pk)
  caption
  activity_date    date
  school_id        fk -> schools.id (nullable)
  image_url
  created_at

news_posts
  id (uuid, pk)
  title
  body             text
  post_date        date
  image_url
  created_at

applications            -- optional, if not using Google Forms
  id (uuid, pk)
  full_name
  email
  phone
  message
  submitted_at
```

### Derived / computed (not tables)
- **Mission**: group mission_logs or task_records by
  (responsible_person_id, school_id, log_date, log_type_id).
- **Dashboard summary**: aggregate missions by school and log type within a date
  range; compute expected via working_days × expected_per_working_day.
- **Birthdays**: `SELECT ... FROM people WHERE dob IS NOT NULL`; map month/day to
  current year on the client/API.

---

## 4. MongoDB alternative (if you prefer NoSQL)

Collections mirror the tables above. `mission_logs` embeds `task_records` as a
subdocument array (common access pattern = read a log with all its tasks):

```json
{
  "_id": "...",
  "logType": "morning_assembly",
  "schoolId": "...",
  "responsiblePersonId": "...",
  "logDate": "2026-06-16",
  "status": "completed",
  "tasks": [
    { "question": "...", "performed": true,  "responsible": "Fr.Bishoy - Ghana" },
    { "question": "...", "performed": false, "responsible": "Fr.Bishoy - Ghana" }
  ],
  "createdBy": "...",
  "createdAt": "..."
}
```

Reference collections (`schools`, `people`, `logTypes`, `curriculumFiles`,
`activities`, `newsPosts`) stay separate and are joined via `$lookup` or in code.
