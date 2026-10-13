// Simple in-memory data store with seed data so the API runs with no DB.
// Swap this for Prisma/Mongoose later — keep the same shape.
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';

export const LOG_TYPES = [
  { id: 'morning_assembly', key: 'morning_assembly', label: 'Morning Assembly', icon: '☀', expectedPerWorkingDay: 1 },
  { id: 'principals_visit', key: 'principals_visit', label: 'Principals Visit', icon: '👣', expectedPerWorkingDay: 5 },
  { id: 'values_class', key: 'values_class', label: 'Values Class', icon: '❤', expectedPerWorkingDay: 0 },
  { id: 'follow_up', key: 'follow_up', label: 'Follow Up', icon: '✚', expectedPerWorkingDay: 0 },
  { id: 'medical_log', key: 'medical_log', label: 'Medical Log', icon: '✚', expectedPerWorkingDay: 0 },
  { id: 'activities', key: 'activities', label: 'Activities', icon: '🎉', expectedPerWorkingDay: 0 },
];

export const schools = [
  { id: 's1', name: 'St Phelopateer - Ghana', country: 'Ghana', region: 'Ghana', workingDays: [1,2,3,4,5], active: true },
  { id: 's2', name: 'St Peter - Ghana', country: 'Ghana', region: 'Ghana', workingDays: [1,2,3,4,5], active: true },
  { id: 's3', name: 'St Mathew - Ghana', country: 'Ghana', region: 'Ghana', workingDays: [1,2,3,4,5], active: true },
  { id: 's4', name: 'St Anthony - Ghana', country: 'Ghana', region: 'Ghana', workingDays: [1,2,3,4,5], active: true },
];

export const people = [
  { id: 'p1', fullName: 'Grace', position: 'Kg1 - St Anthony - Ghana', type: 'student', dob: '2020-10-08', schoolId: 's4' },
  { id: 'p2', fullName: 'Maxwell', position: 'G2 - St Anthony - Ghana', type: 'student', dob: '2018-10-14', schoolId: 's4' },
  { id: 'p3', fullName: 'Fr.Bishoy', position: 'Priest - Ghana', type: 'servant', dob: '1985-03-02', schoolId: null },
  { id: 'p4', fullName: 'Salomey Asare', position: 'St. Matthew - Ghana', type: 'teacher', dob: '1992-10-17', schoolId: 's3' },
];

export const missionLogs = [
  {
    id: 'm1', logTypeId: 'follow_up', schoolId: 's1', responsiblePersonId: 'p3',
    logDate: '2026-06-16', status: 'pending', notes: '',
    tasks: [
      { id: 't1', question: 'Has the scheduled monthly medical visit been conducted?', performed: true, responsible: 'Fr.Bishoy - Ghana' },
      { id: 't2', question: 'Does the principal hold monthly staff meetings as per the pre-set agenda?', performed: false, responsible: 'Fr.Bishoy - Ghana' },
      { id: 't3', question: "Does the school principal hold a parents' meeting once per term?", performed: false, responsible: 'Fr.Bishoy - Ghana' },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'm2', logTypeId: 'morning_assembly', schoolId: 's1', responsiblePersonId: 'p3',
    logDate: '2026-06-17', status: 'completed', notes: '',
    tasks: [
      { id: 't4', question: 'Prayer and anthem performed', performed: true, responsible: 'Fr.Bishoy - Ghana' },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'm3', logTypeId: 'values_class', schoolId: 's1', responsiblePersonId: 'p4',
    logDate: '2026-06-18', status: 'completed', notes: '',
    tasks: [{ id: 't5', question: 'Kindness lesson delivered', performed: true, responsible: 'Teacher' }],
    createdAt: new Date().toISOString(),
  },
];

export const curriculumFiles = [
  { id: 'c1', title: 'نبتدى الحكاية 2', description: 'نبتدى الحكاية 2', folder: null, language: 'ar', fileUrl: 'https://drive.google.com/...' },
  { id: 'c2', title: 'GBAT- JHS THIRD TERM S.O.L. B8', description: 'Ghana curriculum B8', folder: "Ghana's Curriculum", language: 'en', fileUrl: 'https://drive.google.com/...' },
];

export const activities = [
  { id: 'a1', caption: 'Fruit day / ST Philipateer', activityDate: '2026-10-06', schoolId: 's1', imageUrl: 'https://lh3.googleusercontent.com/d/1BFT0x7D8DvnCp9SUdTGqgooDQFuZzkQK' },
  { id: 'a2', caption: 'Kindness day 💐 ST Philopateer', activityDate: '2026-10-02', schoolId: 's1', imageUrl: 'https://lh3.googleusercontent.com/d/1HUfRGigrBsyMpEb4BZgFi08ApVJqGzDf' },
];

export const newsPosts = [
  { id: 'n1', title: 'New Formation Program Launched', body: 'A 12-session journey to help servants and students grow deeper in faith.', postDate: '2026-05-01', imageUrl: '' },
  { id: 'n2', title: 'New Land Secured in Gabon', body: 'The land for the new Coptic School in Gabon has been confirmed.', postDate: '2026-06-02', imageUrl: '' },
];

export const users = [
  { id: randomUUID(), name: 'Admin', email: 'admin@flame.org', passwordHash: bcrypt.hashSync('admin123', 10), role: 'admin' },
];

export const genId = () => randomUUID();
