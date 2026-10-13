import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { month, q } = req.query;

    // People — use birthdate (new field) or dob (legacy), whichever is set
    let people = (await prisma.person.findMany({
      where: { OR: [{ birthdate: { not: null } }, { dob: { not: null } }] },
    })).map(p => {
      const d = p.birthdate || p.dob;
      return {
        id: p.id, name: p.fullName, position: p.position || 'Person',
        contact: p.contact || null, contactLabel: p.contact ? 'Contact' : null,
        dob: d, day: d.getDate(), month: d.getMonth() + 1,
        schoolId: p.schoolId, source: 'person',
      };
    });

    // Students (with birthday)
    let students = (await prisma.student.findMany({
      where: { birthday: { not: null } },
      include: { classLevel: { include: { school: true } } },
    })).map(s => {
      // Prefer the student's own phone; fall back to a parent contact.
      const contact = s.phone || s.fatherContact || s.motherContact || null;
      const contactLabel = s.phone ? 'Phone' : s.fatherContact ? `Father${s.fatherName ? ` (${s.fatherName})` : ''}` : s.motherContact ? `Mother${s.motherName ? ` (${s.motherName})` : ''}` : null;
      return {
        id: s.id, name: s.fullName, position: `Student${s.classLevel?.name ? ` - ${s.classLevel.name}` : ''}${s.classLevel?.school?.name ? ` (${s.classLevel.school.name})` : ''}`,
        contact, contactLabel,
        dob: s.birthday, day: s.birthday.getDate(), month: s.birthday.getMonth() + 1,
        schoolId: s.classLevel?.school?.id || null, source: 'student',
      };
    });

    let all = [...people, ...students];

    if (month) {
      const m = parseInt(month, 10);
      all = all.filter(p => p.month === m);
    }
    if (q) {
      const lower = q.toLowerCase();
      all = all.filter(p => p.name.toLowerCase().includes(lower) || (p.position || '').toLowerCase().includes(lower));
    }

    res.json(all.map(p => ({
      ...p,
      dob: p.dob?.toISOString?.() ? p.dob.toISOString().slice(0, 10) : String(p.dob).slice(0, 10),
    })));
  } catch (e) { next(e); }
});

export default router;
