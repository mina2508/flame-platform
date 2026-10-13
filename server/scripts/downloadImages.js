// Downloads all remote images (activities + news) into server/uploads/ and
// updates each record's localPath so the app serves images locally.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { createWriteStream, mkdirSync, existsSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import path from 'node:path';

const prisma = new PrismaClient();
const UPLOAD_DIR = path.resolve('uploads');

if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });

async function download(url, filename) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
  const dest = path.join(UPLOAD_DIR, filename);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
  return `/uploads/${filename}`;
}

async function run() {
  let ok = 0, fail = 0;

  const activities = await prisma.activity.findMany({ where: { imageUrl: { not: null } } });
  for (const a of activities) {
    try {
      const localPath = await download(a.imageUrl, `activity_${a.id}.jpg`);
      await prisma.activity.update({ where: { id: a.id }, data: { localPath } });
      ok++; console.log(`✓ activity ${a.id}`);
    } catch (e) { fail++; console.log(`✗ activity ${a.id}: ${e.message}`); }
  }

  const news = await prisma.newsPost.findMany({ where: { imageUrl: { not: null } } });
  for (const n of news) {
    try {
      const localPath = await download(n.imageUrl, `news_${n.id}.jpg`);
      await prisma.newsPost.update({ where: { id: n.id }, data: { localPath } });
      ok++; console.log(`✓ news ${n.id}`);
    } catch (e) { fail++; console.log(`✗ news ${n.id}: ${e.message}`); }
  }

  console.log(`\nDownloaded ${ok} images, ${fail} failed. Saved to ${UPLOAD_DIR}`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
