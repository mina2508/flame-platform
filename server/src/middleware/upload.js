import multer from 'multer';
import path from 'node:path';
import os from 'node:os';
import { existsSync, mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

// Serverless hosts (Vercel) have a read-only filesystem except for the OS temp
// dir, so use that there. Locally/containers use ./uploads. Never let a failed
// mkdir crash the server — wrap it so the app always boots.
const isServerless = !!process.env.VERCEL || !!process.env.AWS_REGION;
const UPLOAD_DIR = isServerless ? path.join(os.tmpdir(), 'uploads') : path.resolve('uploads');
try {
  if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
} catch (e) {
  console.warn('uploads dir not creatable (ok on serverless):', e.message);
}

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${randomUUID()}${ext}`);
  },
});

// 12MB limit — for curriculum / values / formation documents (PDFs)
export const uploadLarge = multer({ storage, limits: { fileSize: 12 * 1024 * 1024 } });
// 2MB limit — for any other file (images, assembly files, etc.)
export const uploadSmall = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });

// Helper to turn a stored file into a public URL
export const fileUrl = (file) => (file ? `/uploads/${file.filename}` : null);
