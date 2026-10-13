import multer from 'multer';
import path from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const UPLOAD_DIR = path.resolve('uploads');
if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });

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
