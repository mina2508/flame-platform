// @ts-check
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.taskRecord.deleteMany();
  await prisma.missionLog.deleteMany();
  await prisma.missionMedical.deleteMany().catch(() => {});
  await prisma.missionPerson.deleteMany().catch(() => {});
  await prisma.missionSchool.deleteMany().catch(() => {});
  await prisma.missionCountry.deleteMany().catch(() => {});
  await prisma.mission.deleteMany();
  await prisma.morningAssembly.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.newsPost.deleteMany();
  await prisma.curriculumClass.deleteMany().catch(() => {});
  await prisma.curriculumSchool.deleteMany().catch(() => {});
  await prisma.curriculum.deleteMany();
  await prisma.valuesClassClass.deleteMany().catch(() => {});
  await prisma.valuesClassSchool.deleteMany().catch(() => {});
  await prisma.valuesClass.deleteMany();
  await prisma.formationSchool.deleteMany().catch(() => {});
  await prisma.formation.deleteMany();
  await prisma.application.deleteMany();
  await prisma.formField.deleteMany();
  await prisma.miscEntry.deleteMany();
  await prisma.medicalTeamMember.deleteMany();
  await prisma.student.deleteMany();
  await prisma.classLevel.deleteMany();
  await prisma.residence.deleteMany();
  await prisma.person.deleteMany();
  await prisma.school.deleteMany();
  await prisma.country.deleteMany();
  await prisma.logType.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleared existing data.');

  // ── Users (one per role) ──
  const seedUsers = [
    { name: 'Admin', email: 'admin@flame.org', password: 'Flame@Admin2026', role: 'admin' },
    { name: 'Content Editor', email: 'content@flame.org', password: 'Flame@Content2026', role: 'content_editor' },
    { name: 'Reviewer', email: 'reviewer@flame.org', password: 'Flame@Review2026', role: 'reviewer' },
    { name: 'Form Manager', email: 'forms@flame.org', password: 'Flame@Forms2026', role: 'form_manager' },
  ];
  for (const u of seedUsers) {
    await prisma.user.create({ data: {
      name: u.name, email: u.email, passwordHash: bcrypt.hashSync(u.password, 10), role: u.role,
    }});
  }
  console.log('Users seeded:', seedUsers.length);

  // ── Schools (all 6 from the public dashboard) ──
  const schoolData = [
    { id: 's1', name: 'St Phelopateer - Ghana', country: 'Ghana', region: 'Accra', latitude: 5.6037, longitude: -0.1870 },
    { id: 's2', name: 'St Peter - Ghana', country: 'Ghana', region: 'Accra', latitude: 5.5913, longitude: -0.2226 },
    { id: 's3', name: 'St Mathew - Ghana', country: 'Ghana', region: 'Kumasi', latitude: 6.6885, longitude: -1.6244 },
    { id: 's4', name: 'St Anthony - Ghana', country: 'Ghana', region: 'Tamale', latitude: 9.4034, longitude: -0.8424 },
    { id: 's5', name: 'St Moses - Ghana', country: 'Ghana', region: 'Cape Coast', latitude: 5.1315, longitude: -1.2795 },
    { id: 's6', name: 'St George - Ghana', country: 'Ghana', region: 'Takoradi', latitude: 4.8986, longitude: -1.7607 },
  ];
  for (const s of schoolData) {
    await prisma.school.create({ data: { ...s, workingDays: '1,2,3,4,5' } });
  }
  console.log('Schools seeded:', schoolData.length);

  // ── Log Types ──
  const logTypes = [
    { id: 'morning_assembly', key: 'morning_assembly', label: 'Morning Assembly', icon: '☀', expectedPerWorkingDay: 1 },
    { id: 'principals_visit', key: 'principals_visit', label: 'Principals Visit', icon: '👣', expectedPerWorkingDay: 5 },
    { id: 'values_class', key: 'values_class', label: 'Values Class', icon: '❤', expectedPerWorkingDay: 0 },
    { id: 'follow_up', key: 'follow_up', label: 'Follow Up', icon: '✚', expectedPerWorkingDay: 0 },
    { id: 'medical_log', key: 'medical_log', label: 'Medical Log', icon: '🏥', expectedPerWorkingDay: 0 },
    { id: 'activities', key: 'activities', label: 'Activities', icon: '🎉', expectedPerWorkingDay: 0 },
  ];
  for (const lt of logTypes) { await prisma.logType.create({ data: lt }); }
  console.log('Log types seeded.');

  // ── People (samples from the birthday calendar + dashboard) ──
  const people = [
    { fullName: 'Grace', position: 'Student', dob: new Date('2020-10-08'), schoolId: 's4' },
    { fullName: 'Maxwell', position: 'Student', dob: new Date('2018-10-14'), schoolId: 's4' },
    { fullName: 'Salomey Asare B', position: 'Teacher', dob: new Date('1992-10-17'), schoolId: 's3' },
    { fullName: 'Youssef Soliman', position: 'Servant', dob: new Date('2000-10-15') },
    { fullName: 'Kwabena', position: 'Student', dob: new Date('2021-10-24'), schoolId: 's4' },
    { fullName: 'Theopista', position: 'Student', dob: new Date('2019-10-26') },
    { fullName: 'Fredick', position: 'Student', dob: new Date('2020-10-30'), schoolId: 's4' },
    { fullName: 'Seyram', position: 'Student', dob: new Date('2019-11-01'), schoolId: 's4' },
    { fullName: 'Islam', position: 'Student', dob: new Date('2018-11-07'), schoolId: 's4' },
    { fullName: 'Fr.Bishoy', position: 'Priest', isPriest: true, dob: new Date('1985-03-02') },
  ];
  for (const p of people) { await prisma.person.create({ data: p }); }
  console.log('People seeded:', people.length);

  // ── Sample Mission Logs ──
  const bishoy = await prisma.person.findFirst({ where: { fullName: 'Fr.Bishoy' } });
  const salomey = await prisma.person.findFirst({ where: { fullName: 'Salomey Asare B' } });

  // Follow-up log with mixed task results
  await prisma.missionLog.create({ data: {
    logTypeId: 'follow_up', schoolId: 's1', responsiblePersonId: bishoy.id,
    logDate: new Date('2026-06-16'), status: 'pending',
    tasks: { create: [
      { question: 'Has the scheduled monthly medical visit been conducted?', performed: true, responsible: 'Fr.Bishoy - Ghana' },
      { question: 'Does the principal hold monthly staff meetings as per the pre-set agenda?', performed: false, responsible: 'Fr.Bishoy - Ghana' },
      { question: "Does the school principal hold a parents' meeting once per term?", performed: false, responsible: 'Fr.Bishoy - Ghana' },
    ]},
  }});
  // Morning assembly logs
  for (const date of ['2026-06-17', '2026-06-18', '2026-06-19', '2026-06-22', '2026-06-23']) {
    await prisma.missionLog.create({ data: {
      logTypeId: 'morning_assembly', schoolId: 's1', responsiblePersonId: bishoy.id,
      logDate: new Date(date), status: 'completed',
      tasks: { create: [
        { question: 'Prayer and anthem performed', performed: true },
        { question: 'Announcements delivered', performed: true },
        { question: 'Inspection completed', performed: true },
      ]},
    }});
  }
  // Values class log
  await prisma.missionLog.create({ data: {
    logTypeId: 'values_class', schoolId: 's1', responsiblePersonId: salomey?.id ?? bishoy.id,
    logDate: new Date('2026-06-18'), status: 'completed',
    tasks: { create: [
      { question: 'Kindness lesson delivered', performed: true },
      { question: 'Students participated in activity', performed: true },
    ]},
  }});
  // Principal visits
  for (const date of ['2026-06-17', '2026-06-18']) {
    await prisma.missionLog.create({ data: {
      logTypeId: 'principals_visit', schoolId: 's1', responsiblePersonId: bishoy.id,
      logDate: new Date(date), status: 'completed',
      tasks: { create: [
        { question: 'Class visit conducted', performed: true },
        { question: 'Teacher preparation checked', performed: true },
      ]},
    }});
  }
  // Medical log
  await prisma.missionLog.create({ data: {
    logTypeId: 'medical_log', schoolId: 's1', responsiblePersonId: bishoy.id,
    logDate: new Date('2026-06-20'), status: 'completed',
    tasks: { create: [{ question: 'Medical check completed', performed: true }]},
  }});
  console.log('Mission logs seeded.');

  // ── Activities (real from public site) ──
  const activitiesData = [
    { caption: 'Fruit day / ST Philipateer', activityDate: new Date('2026-10-06'), schoolId: 's1', imageUrl: 'https://lh3.googleusercontent.com/d/1BFT0x7D8DvnCp9SUdTGqgooDQFuZzkQK' },
    { caption: 'Fruit 🍓 day / St Philipateer', activityDate: new Date('2026-10-06'), schoolId: 's1', imageUrl: 'https://lh3.googleusercontent.com/d/187x_0yDKdEIxUWIXGGXgknpOkqWeLVZX' },
    { caption: 'Fruit day / St Philopateer', activityDate: new Date('2026-10-06'), schoolId: 's1', imageUrl: 'https://lh3.googleusercontent.com/d/1h2ZF54hV3CMZsDyDm7M3DqmmEcTCqoPS' },
    { caption: 'Kindness day 💐 ST Philopateer', activityDate: new Date('2026-10-02'), schoolId: 's1', imageUrl: 'https://lh3.googleusercontent.com/d/1HUfRGigrBsyMpEb4BZgFi08ApVJqGzDf' },
    { caption: 'Kindness day - ST Philopateer', activityDate: new Date('2026-09-30'), schoolId: 's1', imageUrl: 'https://lh3.googleusercontent.com/d/10JetPXNFFaHJ20DdrrnqcxMoJjgkdP8I' },
    { caption: 'Kindness day - ST Philopater', activityDate: new Date('2026-09-30'), schoolId: 's1', imageUrl: 'https://lh3.googleusercontent.com/d/1fV88MovFr1plKNb9Ojd4h3ypErel2Cjb' },
    { caption: 'Kindness day 💐 ST Philopateer', activityDate: new Date('2026-09-30'), schoolId: 's1', imageUrl: 'https://lh3.googleusercontent.com/d/1XWV4UeOUINHk8oh6dx6Y6jN8lzHr0W9E' },
    { caption: 'Kindness day - ST Philopateer', activityDate: new Date('2026-09-30'), schoolId: 's1', imageUrl: 'https://lh3.googleusercontent.com/d/1k-WXDtsSd3r0TabLlKNLkNZsk01_pugR' },
  ];
  for (const a of activitiesData) { await prisma.activity.create({ data: a }); }
  console.log('Activities seeded:', activitiesData.length);

  // ── News Posts (real from public site) ──
  const newsData = [
    { title: 'New Formation Program Launched', body: 'We are excited to announce the launch of the New Formation Program within Flame Function — a 12-session journey designed to help servants and students grow deeper in faith, build stronger community, and discover their mission in service.', postDate: new Date('2026-05-01'), imageUrl: 'https://lh3.googleusercontent.com/d/1nF_MeIaPOcCH9Y242WmA7Ds9BcFsBsUq' },
    { title: 'Coptic Church Building in Burundi — In Progress', body: 'Work is continuing on the construction of the new Coptic Orthodox Church in our school (Lycée technique sainte Marie - Burundi). With every step, this building is becoming a new place of prayer and spiritual growth.', postDate: new Date('2026-06-02'), imageUrl: 'https://lh3.googleusercontent.com/d/1WJy661JXr5rh0_pBNsfws0d3PU_uAK6w' },
    { title: 'New Land Secured in Gabon', body: 'A joyful step forward: the land for the new Coptic School in Gabon has been confirmed, opening the way for education, service, and hope for the community.', postDate: new Date('2026-06-02'), imageUrl: 'https://lh3.googleusercontent.com/d/1eTQjHRLrKGPponrMthqpD2g32s0cVO1S' },
    { title: 'Our Prayer', body: 'Heavenly Father, Thank You for this new day. Bless our families, teachers, friends, school, and country. Teach us to be kind, honest, and hardworking. Guide us and keep us close to You.', postDate: new Date('2026-06-13'), imageUrl: 'https://lh3.googleusercontent.com/d/1-y8EsU2vVMmPIyeP2cqU9JoDMs2WMcQF' },
    { title: 'Fun in the Computer Lab at St. Anthony School! 🖥️', body: 'Our students in Ghana are learning how to use computers today. They are very excited to build new digital skills!', postDate: new Date('2026-06-25'), imageUrl: 'https://lh3.googleusercontent.com/d/14NhnLpfsvrLbpEfeeyzCP6ymOF_RXTNm' },
    { title: 'Healthy Habits at St. Peter School! 🧼', body: 'Students in Ghana learned important lessons about hygiene today. They practiced how to wash their hands and keep their bodies healthy.', postDate: new Date('2026-06-17'), imageUrl: 'https://lh3.googleusercontent.com/d/1P_DmZ1ptreY7yyxFu-JiEjPLIiB57N37' },
    { title: 'Little Gardeners at St. Peter School! 🌱', body: 'Our students in Ghana planted onion and pepper seeds today. Every child has their own special plant to take care of and watch grow!', postDate: new Date('2026-06-25'), imageUrl: 'https://lh3.googleusercontent.com/d/1pT5CkbPEpbtIyRSx15JySms7CZFoObde' },
    { title: 'Reading Time at St. Matthew School! 📚', body: 'Our students in Ghana spent a wonderful time in the library today. They enjoyed reading books and sharing their favorite stories.', postDate: new Date('2026-06-25'), imageUrl: 'https://lh3.googleusercontent.com/d/1huJ-Vc74DBC6wn8o0zxQdR4hiq6yrooQ' },
    { title: 'Morning Assembly at St. Philopateer School! 📢', body: 'Today, the children did a great job reading out loud during assembly. They shared interesting facts about Ghana and how the human body works!', postDate: new Date('2026-06-24'), imageUrl: 'https://lh3.googleusercontent.com/d/1y_49G2FZ3BP6VNNM3HmdBVRLKpKUB591' },
    { title: 'Praying Together Every Day! 🙏', body: 'The children have learned our special school prayer. They now pray it together every single day with happy hearts!', postDate: new Date('2026-06-18'), imageUrl: 'https://lh3.googleusercontent.com/d/1xLVSwLFQoIIe2tkDgZPIuXd_1yTjtM4f' },
    { title: 'St. Philopateer School Joins the Planting Fun! 🌱', body: 'The gardening fun continues! Our students at St. Philopateer started planting their own seeds today.', postDate: new Date('2026-06-25'), imageUrl: 'https://lh3.googleusercontent.com/d/1tg30TjKyxlVZlhdMliP77lAFSuCsnXPh' },
    { title: 'Special Training for Our Teachers in Burundi! 📝', body: 'Our teachers in Burundi attended a special learning program. Our teachers are our partners, and we love helping them grow!', postDate: new Date('2026-05-02'), imageUrl: 'https://lh3.googleusercontent.com/d/1a70z7A71rQpdH-JJ1GqUWDaojcwsVYFw' },
  ];
  for (const n of newsData) { await prisma.newsPost.create({ data: n }); }
  console.log('News posts seeded:', newsData.length);

  // ── Curriculum (samples) ──
  const currData = [
    { title: 'نبتدى الحكاية 2', description: 'نبتدى الحكاية 2', language: 'ar' },
    { title: 'GBAT- JHS THIRD TERM S.O.L. B8', description: 'Ghana JHS B8 term 3', language: 'en' },
    { title: 'حوار صريح طالب', description: 'حوار صريح طالب', language: 'ar' },
    { title: 'منهج حصص الحياة', description: 'منهج حصص الحياة', language: 'ar' },
  ];
  for (const c of currData) { await prisma.curriculum.create({ data: c }); }
  console.log('Curriculum seeded:', currData.length);

  // ── Values classes (samples) ──
  const valuesData = [
    { title: 'Honesty', description: 'Honesty values lesson', language: 'en' },
    { title: 'Kindness', description: 'Kindness values lesson', language: 'en' },
    { title: 'Boundaries', description: 'Boundaries values lesson', language: 'en' },
  ];
  for (const v of valuesData) { await prisma.valuesClass.create({ data: v }); }
  console.log('Values classes seeded:', valuesData.length);

  // ── Default form fields for the application form ──
  const formFields = [
    { label: 'Full Name', key: 'fullName', type: 'text', required: true, order: 1 },
    { label: 'Country', key: 'country', type: 'text', required: true, order: 2 },
    { label: 'Function / Serving', key: 'function_serving', type: 'text', required: false, order: 3 },
    { label: 'Role', key: 'role', type: 'dropdown', options: JSON.stringify(['Teacher', 'Servant', 'Principal', 'Volunteer', 'Other']), required: true, order: 4 },
    { label: 'Experience (years)', key: 'experience_years', type: 'number', required: false, order: 5 },
    { label: 'Motivation Rating', key: 'motivation', type: 'rating', options: JSON.stringify({ min: 1, max: 10 }), required: false, order: 6 },
    { label: 'Available for travel', key: 'travel', type: 'toggle', required: false, order: 7 },
  ];
  for (const f of formFields) { await prisma.formField.create({ data: f }); }
  console.log('Form fields seeded:', formFields.length);

  // ── Countries ──
  const countries = [
    { name: 'Ghana', code: 'GH' },
    { name: 'Burundi', code: 'BI' },
    { name: 'Gabon', code: 'GA' },
    { name: 'Egypt', code: 'EG' },
  ];
  const countryByName = {};
  for (const c of countries) {
    const created = await prisma.country.create({ data: c });
    countryByName[c.name] = created.id;
  }
  // link schools to Ghana
  await prisma.school.updateMany({ where: { country: 'Ghana' }, data: { countryId: countryByName['Ghana'] } });
  console.log('Countries seeded:', countries.length);

  // ── Classes (per school) ──
  const classNames = [
    { name: 'KG1', stage: 'Pre-School', order: 1 },
    { name: 'KG2', stage: 'Pre-School', order: 2 },
    { name: 'G1', stage: 'Primary', order: 3 },
    { name: 'G2', stage: 'Primary', order: 4 },
    { name: 'JHS B7', stage: 'JHS', order: 5 },
    { name: 'JHS B8', stage: 'JHS', order: 6 },
  ];
  let classCount = 0;
  for (const s of schoolData.slice(0, 2)) { // seed classes for first 2 schools as sample
    for (const c of classNames) {
      await prisma.classLevel.create({ data: { ...c, schoolId: s.id } });
      classCount++;
    }
  }
  console.log('Classes seeded:', classCount);

  // ── Medical team sample ──
  const medics = [
    { fullName: 'Dr. Mina Fawzy', specialty: 'General Physician', contact: '+20 100 000 0001', available: true },
    { fullName: 'Nurse Mary Samir', specialty: 'Nurse', contact: '+20 100 000 0002', available: true },
    { fullName: 'Dr. George Adel', specialty: 'Pediatrician', contact: '+20 100 000 0003', available: false },
  ];
  for (const m of medics) { await prisma.medicalTeamMember.create({ data: m }); }
  console.log('Medical team seeded:', medics.length);

  // ── Misc entries ──
  const misc = [
    { category: 'Setting', label: 'Default working days', value: 'Mon–Fri' },
    { category: 'Setting', label: 'Strong signal threshold', value: '85%' },
    { category: 'Note', label: 'Service motto', value: 'Changing the world our way' },
  ];
  for (const m of misc) { await prisma.miscEntry.create({ data: m }); }
  console.log('Misc entries seeded:', misc.length);

  console.log('\nSeed complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
