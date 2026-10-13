import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { CAN_EDIT_CONTENT } from '../permissions.js';
import { uploadLarge, fileUrl } from '../middleware/upload.js';

// ─── Curriculum (PDF ≤12MB, assignable to many classes & schools) ───
export const curriculumRouter = Router();

curriculumRouter.get('/', async (req, res, next) => {
  try {
    const { q, language } = req.query;
    const where = {};
    if (q) where.description = { contains: q };
    if (language) where.language = language;
    const items = await prisma.curriculum.findMany({
      where, orderBy: { title: 'asc' },
      include: { classes: { include: { classLevel: true } }, schools: { include: { school: true } } },
    });
    res.json(items);
  } catch (e) { next(e); }
});

curriculumRouter.post('/', requireAuth, requireRole(...CAN_EDIT_CONTENT), uploadLarge.single('file'), async (req, res, next) => {
  try {
    const { title, description, language, classIds, schoolIds } = req.body;
    const cur = await prisma.curriculum.create({
      data: {
        title, description, language,
        fileUrl: fileUrl(req.file),
        classes: classIds ? { create: JSON.parse(classIds).map(id => ({ classId: id })) } : undefined,
        schools: schoolIds ? { create: JSON.parse(schoolIds).map(id => ({ schoolId: id })) } : undefined,
      },
    });
    res.status(201).json(cur);
  } catch (e) { next(e); }
});

// Edit an existing curriculum, including its school/class assignments.
curriculumRouter.patch('/:id', requireAuth, requireRole(...CAN_EDIT_CONTENT), async (req, res, next) => {
  try {
    const { title, description, language, schoolIds, classIds } = req.body;
    const data = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (language !== undefined) data.language = language;

    if (Array.isArray(schoolIds)) {
      // Keep existing statuses for schools still assigned; add new ones as "expected".
      const existing = await prisma.curriculumSchool.findMany({ where: { curriculumId: req.params.id } });
      const keep = new Set(schoolIds);
      await prisma.curriculumSchool.deleteMany({ where: { curriculumId: req.params.id, schoolId: { notIn: schoolIds.length ? schoolIds : ['__none__'] } } });
      for (const sid of schoolIds) {
        if (!existing.find(e => e.schoolId === sid)) {
          await prisma.curriculumSchool.create({ data: { curriculumId: req.params.id, schoolId: sid } }).catch(() => {});
        }
      }
    }
    if (Array.isArray(classIds)) {
      await prisma.curriculumClass.deleteMany({ where: { curriculumId: req.params.id } });
      for (const cid of classIds) await prisma.curriculumClass.create({ data: { curriculumId: req.params.id, classId: cid } }).catch(() => {});
    }

    await prisma.curriculum.update({ where: { id: req.params.id }, data });
    const updated = await prisma.curriculum.findUnique({
      where: { id: req.params.id },
      include: { classes: { include: { classLevel: true } }, schools: { include: { school: true } } },
    });
    res.json(updated);
  } catch (e) { next(e); }
});

// Update the per-school status of a curriculum assignment (expected|pending|completed)
curriculumRouter.patch('/:id/school/:schoolId', requireAuth, requireRole(...CAN_EDIT_CONTENT), async (req, res, next) => {
  try {
    const { status } = req.body;
    const updated = await prisma.curriculumSchool.update({
      where: { curriculumId_schoolId: { curriculumId: req.params.id, schoolId: req.params.schoolId } },
      data: { status },
    });
    res.json(updated);
  } catch (e) { next(e); }
});

curriculumRouter.delete('/:id', requireAuth, requireRole(...CAN_EDIT_CONTENT), async (req, res, next) => {
  try { await prisma.curriculum.delete({ where: { id: req.params.id } }); res.status(204).end(); }
  catch (e) { next(e); }
});

// ─── Values Classes (same logic) ───
export const valuesRouter = Router();

valuesRouter.get('/', async (_, res, next) => {
  try {
    res.json(await prisma.valuesClass.findMany({
      orderBy: { title: 'asc' },
      include: { classes: { include: { classLevel: true } }, schools: { include: { school: true } } },
    }));
  } catch (e) { next(e); }
});

valuesRouter.post('/', requireAuth, requireRole(...CAN_EDIT_CONTENT), uploadLarge.single('file'), async (req, res, next) => {
  try {
    const { title, description, language, classIds, schoolIds } = req.body;
    const v = await prisma.valuesClass.create({
      data: {
        title, description, language,
        fileUrl: fileUrl(req.file),
        classes: classIds ? { create: JSON.parse(classIds).map(id => ({ classId: id })) } : undefined,
        schools: schoolIds ? { create: JSON.parse(schoolIds).map(id => ({ schoolId: id })) } : undefined,
      },
    });
    res.status(201).json(v);
  } catch (e) { next(e); }
});

valuesRouter.patch('/:id', requireAuth, requireRole(...CAN_EDIT_CONTENT), async (req, res, next) => {
  try {
    const { title, description, language, schoolIds, classIds } = req.body;
    const data = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (language !== undefined) data.language = language;

    if (Array.isArray(schoolIds)) {
      const existing = await prisma.valuesClassSchool.findMany({ where: { valuesClassId: req.params.id } });
      await prisma.valuesClassSchool.deleteMany({ where: { valuesClassId: req.params.id, schoolId: { notIn: schoolIds.length ? schoolIds : ['__none__'] } } });
      for (const sid of schoolIds) {
        if (!existing.find(e => e.schoolId === sid)) {
          await prisma.valuesClassSchool.create({ data: { valuesClassId: req.params.id, schoolId: sid } }).catch(() => {});
        }
      }
    }
    if (Array.isArray(classIds)) {
      await prisma.valuesClassClass.deleteMany({ where: { valuesClassId: req.params.id } });
      for (const cid of classIds) await prisma.valuesClassClass.create({ data: { valuesClassId: req.params.id, classId: cid } }).catch(() => {});
    }

    await prisma.valuesClass.update({ where: { id: req.params.id }, data });
    const updated = await prisma.valuesClass.findUnique({
      where: { id: req.params.id },
      include: { classes: { include: { classLevel: true } }, schools: { include: { school: true } } },
    });
    res.json(updated);
  } catch (e) { next(e); }
});

valuesRouter.patch('/:id/school/:schoolId', requireAuth, requireRole(...CAN_EDIT_CONTENT), async (req, res, next) => {
  try {
    const { status } = req.body;
    const updated = await prisma.valuesClassSchool.update({
      where: { valuesClassId_schoolId: { valuesClassId: req.params.id, schoolId: req.params.schoolId } },
      data: { status },
    });
    res.json(updated);
  } catch (e) { next(e); }
});

valuesRouter.delete('/:id', requireAuth, requireRole(...CAN_EDIT_CONTENT), async (req, res, next) => {
  try { await prisma.valuesClass.delete({ where: { id: req.params.id } }); res.status(204).end(); }
  catch (e) { next(e); }
});

// ─── Formation (files, multi-school) ───
export const formationRouter = Router();

formationRouter.get('/', async (_, res, next) => {
  try {
    res.json(await prisma.formation.findMany({
      orderBy: { title: 'asc' },
      include: { schools: { include: { school: true } } },
    }));
  } catch (e) { next(e); }
});

formationRouter.post('/', requireAuth, requireRole(...CAN_EDIT_CONTENT), uploadLarge.single('file'), async (req, res, next) => {
  try {
    const { title, description, schoolIds } = req.body;
    const f = await prisma.formation.create({
      data: {
        title, description, fileUrl: fileUrl(req.file),
        schools: schoolIds ? { create: JSON.parse(schoolIds).map(id => ({ schoolId: id })) } : undefined,
      },
    });
    res.status(201).json(f);
  } catch (e) { next(e); }
});

formationRouter.patch('/:id', requireAuth, requireRole(...CAN_EDIT_CONTENT), async (req, res, next) => {
  try {
    const { title, description, schoolIds } = req.body;
    const data = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;

    if (Array.isArray(schoolIds)) {
      const existing = await prisma.formationSchool.findMany({ where: { formationId: req.params.id } });
      await prisma.formationSchool.deleteMany({ where: { formationId: req.params.id, schoolId: { notIn: schoolIds.length ? schoolIds : ['__none__'] } } });
      for (const sid of schoolIds) {
        if (!existing.find(e => e.schoolId === sid)) {
          await prisma.formationSchool.create({ data: { formationId: req.params.id, schoolId: sid } }).catch(() => {});
        }
      }
    }

    await prisma.formation.update({ where: { id: req.params.id }, data });
    const updated = await prisma.formation.findUnique({
      where: { id: req.params.id },
      include: { schools: { include: { school: true } } },
    });
    res.json(updated);
  } catch (e) { next(e); }
});

formationRouter.patch('/:id/school/:schoolId', requireAuth, requireRole(...CAN_EDIT_CONTENT), async (req, res, next) => {
  try {
    const { status } = req.body;
    const updated = await prisma.formationSchool.update({
      where: { formationId_schoolId: { formationId: req.params.id, schoolId: req.params.schoolId } },
      data: { status },
    });
    res.json(updated);
  } catch (e) { next(e); }
});

formationRouter.delete('/:id', requireAuth, requireRole(...CAN_EDIT_CONTENT), async (req, res, next) => {
  try { await prisma.formation.delete({ where: { id: req.params.id } }); res.status(204).end(); }
  catch (e) { next(e); }
});
