import multer from 'multer';
import path from 'node:path';
import os from 'node:os';
import { existsSync, mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// ──────────────────────────────────────────────────────────────
// File uploads.
//
// If Cloudflare R2 (S3-compatible) env vars are set, files are uploaded to R2
// and served from a public URL — this is PERSISTENT and works on serverless.
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL
//
// If those are NOT set, we fall back to local disk (dev / self-hosted). On
// serverless without R2 this is ephemeral (files vanish) — the warning case.
// ──────────────────────────────────────────────────────────────
const R2_ENABLED = !!(process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET && process.env.R2_ACCOUNT_ID);

let s3 = null;
if (R2_ENABLED) {
  s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

// ── Local-disk fallback (used only when R2 is not configured) ──
const isServerless = !!process.env.VERCEL || !!process.env.AWS_REGION;
const UPLOAD_DIR = isServerless ? path.join(os.tmpdir(), 'uploads') : path.resolve('uploads');
try {
  if (!R2_ENABLED && !existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
} catch (e) {
  console.warn('uploads dir not creatable (ok on serverless):', e.message);
}

// When R2 is on, keep the file in memory so we can stream it to R2.
// Otherwise write to disk as before.
const storage = R2_ENABLED
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (_, __, cb) => cb(null, UPLOAD_DIR),
      filename: (_, file, cb) => cb(null, `${randomUUID()}${path.extname(file.originalname)}`),
    });

export const uploadLarge = multer({ storage, limits: { fileSize: 12 * 1024 * 1024 } }); // PDFs
export const uploadSmall = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });  // images/other

// Upload a single in-memory file to R2 and return its public URL.
async function putToR2(file) {
  const key = `${randomUUID()}${path.extname(file.originalname)}`;
  await s3.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  }));
  const base = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');
  return `${base}/${key}`;
}

// Middleware: after multer parses the file, push it to R2 (if enabled) and set
// req.file.url. Place this AFTER uploadLarge.single('file') in the route chain.
export function toStorage(req, _res, next) {
  if (!req.file) return next();
  if (!R2_ENABLED) { req.file.url = `/uploads/${req.file.filename}`; return next(); }
  putToR2(req.file)
    .then((url) => { req.file.url = url; next(); })
    .catch(next);
}

// Middleware for multi-field uploads (multer .fields()). Pushes every parsed
// file to R2 and sets each file's .url. Place AFTER uploadSmall.fields(...).
export async function toStorageFields(req, _res, next) {
  try {
    if (!R2_ENABLED || !req.files) return next();
    const all = Object.values(req.files).flat();
    await Promise.all(all.map(async (f) => { f.url = await putToR2(f); }));
    next();
  } catch (e) { next(e); }
}

// Resolve the stored URL for a parsed file.
// Works for both R2 (req.file.url set by toStorage) and local disk.
export const fileUrl = (file) => {
  if (!file) return null;
  if (file.url) return file.url;                 // R2 (or already-resolved)
  if (file.filename) return `/uploads/${file.filename}`; // local disk
  return null;
};
