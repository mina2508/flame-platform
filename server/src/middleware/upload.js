import multer from 'multer';
import path from 'node:path';
import os from 'node:os';
import { existsSync, mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// ──────────────────────────────────────────────────────────────
// File uploads — any S3-compatible object store (Supabase Storage, Cloudflare
// R2, AWS S3, ...). When configured, files are uploaded to the store and served
// from a public URL — PERSISTENT and works on serverless.
//
// Preferred env vars (generic S3):
//   S3_ENDPOINT          e.g. https://xxxx.supabase.co/storage/v1/s3
//   S3_REGION            e.g. eu-central-1  (any value is fine for Supabase)
//   S3_ACCESS_KEY_ID
//   S3_SECRET_ACCESS_KEY
//   S3_BUCKET            e.g. flame-uploads
//   S3_PUBLIC_URL        public base URL for objects, e.g.
//                        https://xxxx.supabase.co/storage/v1/object/public/flame-uploads
//
// Backward-compatible Cloudflare R2 vars are also accepted:
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL
//
// If none are set, we fall back to local disk (dev / self-hosted). On serverless
// without a store this is ephemeral (files vanish) — the warning case.
// ──────────────────────────────────────────────────────────────

// Resolve a unified config from either the generic S3_* vars or the legacy R2_* vars.
const STORE = (() => {
  if (process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY && process.env.S3_BUCKET && process.env.S3_ENDPOINT) {
    return {
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION || 'auto',
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      bucket: process.env.S3_BUCKET,
      publicUrl: process.env.S3_PUBLIC_URL || '',
      // Supabase (and most non-AWS S3) require path-style addressing.
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
    };
  }
  if (process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET && process.env.R2_ACCOUNT_ID) {
    return {
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      region: 'auto',
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      bucket: process.env.R2_BUCKET,
      publicUrl: process.env.R2_PUBLIC_URL || '',
      forcePathStyle: false,
    };
  }
  return null;
})();

const STORE_ENABLED = !!STORE;

let s3 = null;
if (STORE_ENABLED) {
  s3 = new S3Client({
    region: STORE.region,
    endpoint: STORE.endpoint,
    forcePathStyle: STORE.forcePathStyle,
    credentials: {
      accessKeyId: STORE.accessKeyId,
      secretAccessKey: STORE.secretAccessKey,
    },
  });
}

// ── Local-disk fallback (used only when no object store is configured) ──
const isServerless = !!process.env.VERCEL || !!process.env.AWS_REGION;
const UPLOAD_DIR = isServerless ? path.join(os.tmpdir(), 'uploads') : path.resolve('uploads');
try {
  if (!STORE_ENABLED && !existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
} catch (e) {
  console.warn('uploads dir not creatable (ok on serverless):', e.message);
}

// When an object store is on, keep the file in memory so we can stream it up.
// Otherwise write to disk as before.
const storage = STORE_ENABLED
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (_, __, cb) => cb(null, UPLOAD_DIR),
      filename: (_, file, cb) => cb(null, `${randomUUID()}${path.extname(file.originalname)}`),
    });

export const uploadLarge = multer({ storage, limits: { fileSize: 12 * 1024 * 1024 } }); // PDFs
export const uploadSmall = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });  // images/other

// Upload a single in-memory file to the object store and return its public URL.
async function putToStore(file) {
  const key = `${randomUUID()}${path.extname(file.originalname)}`;
  await s3.send(new PutObjectCommand({
    Bucket: STORE.bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  }));
  const base = (STORE.publicUrl || '').replace(/\/$/, '');
  return `${base}/${key}`;
}

// Middleware: after multer parses the file, push it to the store (if enabled) and
// set req.file.url. Place this AFTER uploadLarge.single('file') in the route chain.
export function toStorage(req, _res, next) {
  if (!req.file) return next();
  if (!STORE_ENABLED) { req.file.url = `/uploads/${req.file.filename}`; return next(); }
  putToStore(req.file)
    .then((url) => { req.file.url = url; next(); })
    .catch(next);
}

// Middleware for multi-field uploads (multer .fields()). Pushes every parsed
// file to the store and sets each file's .url. Place AFTER uploadSmall.fields(...).
export async function toStorageFields(req, _res, next) {
  try {
    if (!STORE_ENABLED || !req.files) return next();
    const all = Object.values(req.files).flat();
    await Promise.all(all.map(async (f) => { f.url = await putToStore(f); }));
    next();
  } catch (e) { next(e); }
}

// Resolve the stored URL for a parsed file.
// Works for both the object store (req.file.url set by toStorage) and local disk.
export const fileUrl = (file) => {
  if (!file) return null;
  if (file.url) return file.url;                 // object store (or already-resolved)
  if (file.filename) return `/uploads/${file.filename}`; // local disk
  return null;
};
