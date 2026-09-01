import express from 'express';
import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';
import sharp from 'sharp';
import { getUploads, createUploadVersion, activateUpload, deleteUpload, logAudit } from '../db/queries.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');
const UPLOAD_TARGETS = {
  'cv-es': {
    filename: 'cv-es.pdf',
    language: 'es',
    documentType: 'cv',
    allowedMimes: ['application/pdf'],
  },
  'cv-en': {
    filename: 'cv-en.pdf',
    language: 'en',
    documentType: 'cv',
    allowedMimes: ['application/pdf'],
  },
  'hero-photo': {
    filename: 'hero-photo.webp',
    language: 'all',
    documentType: 'hero-photo',
    allowedMimes: ['image/jpeg', 'image/png', 'image/webp'],
  },
};

const getTimestampedFilename = (prefix, extension) => {
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${timestamp}-${random}.${extension}`;
};

const createRequestError = (message, status = 400) => Object.assign(new Error(message), { status });

const getUploadPath = (filename) => {
  const resolvedPath = path.resolve(UPLOAD_DIR, filename);
  if (!resolvedPath.startsWith(`${UPLOAD_DIR}${path.sep}`)) {
    throw createRequestError('Invalid upload path');
  }
  return resolvedPath;
};

// Ensure upload directory exists
const ensureUploadDir = async () => {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating upload directory:', error);
  }
};

ensureUploadDir();

// Configure multer - temporary storage before renaming
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
      cb(null, UPLOAD_DIR);
  },
  filename: (_req, _file, cb) => {
    // Use a temporary name; we'll rename it properly after validation
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    cb(null, `temp-${timestamp}-${randomStr}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    // Header validation is only an early filter; file signatures are verified after upload.
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and images are allowed.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

const uploadSingle = (req, res, next) => {
  upload.single('file')(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File size must be less than 10MB' });
    }
    return res.status(400).json({ error: error.message || 'Invalid upload' });
  });
};

const getFileMimeType = async (filePath) => {
  const file = await fs.open(filePath, 'r');
  const buffer = Buffer.alloc(12);

  try {
    await file.read(buffer, 0, buffer.length, 0);
  } finally {
    await file.close();
  }

  if (buffer.subarray(0, 5).toString('ascii') === '%PDF-') return 'application/pdf';
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  return null;
};

const createUploadFile = async (sourcePath, target, file) => {
  const extension = target.documentType === 'hero-photo' ? 'webp' : 'pdf';
  const prefix = target.documentType === 'hero-photo' ? 'hero-photo' : target.filename.replace(/\.pdf$/, '');
  const filename = getTimestampedFilename(prefix, extension);
  const destinationPath = getUploadPath(filename);
  let processedPath = sourcePath;
  let newFileMoved = false;

  try {
    if (target.documentType === 'hero-photo') {
      await sharp(sourcePath).rotate().webp({ quality: 86 }).toFile(destinationPath);
      newFileMoved = true;
    } else {
      await fs.rename(sourcePath, destinationPath);
      newFileMoved = true;
    }

    const uploadRecord = await createUploadVersion(
      file.target,
      filename,
      file.originalname,
      target.documentType === 'hero-photo' ? 'image/webp' : file.detectedMime,
      target.documentType === 'hero-photo' ? (await fs.stat(destinationPath)).size : file.size,
      `/uploads/${filename}`,
      target.language,
      target.documentType
    );

    return uploadRecord;
  } catch (error) {
    if (newFileMoved) await fs.unlink(destinationPath).catch(() => {});
    throw error;
  } finally {
    if (processedPath === sourcePath) await fs.unlink(sourcePath).catch(() => {});
  }
};

// GET /api/uploads
// Public route - get all uploads
router.get('/', async (req, res) => {
  try {
    const language = req.query.language;
    const includeHistory = req.query.history === '1';
    if (includeHistory && !req.session?.authenticated) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const uploads = await getUploads(language, includeHistory);
    res.json(uploads);
  } catch (error) {
    console.error('Error fetching uploads:', error);
    res.status(500).json({ error: 'Failed to fetch uploads' });
  }
});

// POST /api/uploads
// Admin route - upload file
router.post('/', requireAuth, uploadSingle, async (req, res) => {
  let tempPath;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    tempPath = getUploadPath(req.file.filename);
    const target = UPLOAD_TARGETS[req.body.target];
    if (!target) throw createRequestError('Choose a valid upload target');

    const detectedMime = await getFileMimeType(tempPath);
    if (!detectedMime || !target.allowedMimes.includes(detectedMime)) {
      throw createRequestError(target.documentType === 'cv'
        ? 'CV uploads must be valid PDF files'
        : 'Hero photos must be valid JPEG, PNG, or WebP images');
    }

    const uploadRecord = await createUploadFile(tempPath, target, {
      ...req.file,
      detectedMime,
      target: req.body.target,
    });
    tempPath = null;

    await logAudit('UPLOAD', 'uploads', {
      filename: uploadRecord.filename,
      originalName: req.file.originalname,
      target: req.body.target,
    }).catch((error) => console.warn('Failed to log upload:', error));

    res.json(uploadRecord);
  } catch (error) {
    console.error('Error uploading file:', error);
    if (tempPath) await fs.unlink(tempPath).catch(() => {});
    res.status(error.status || 500).json({ error: error.message || 'Failed to upload file' });
  }
});

router.put('/:filename/activate', requireAuth, async (req, res) => {
  try {
    const filename = req.params.filename;
    if (filename !== path.basename(filename)) return res.status(400).json({ error: 'Invalid upload filename' });

    const upload = await activateUpload(filename);
    if (!upload) return res.status(404).json({ error: 'Upload not found' });

    await logAudit('ACTIVATE_UPLOAD', 'uploads', { filename }).catch((error) => console.warn('Failed to log activation:', error));
    res.json(upload);
  } catch (error) {
    console.error('Error activating upload:', error);
    res.status(500).json({ error: 'Failed to activate upload' });
  }
});

// DELETE /api/uploads/:filename
// Admin route - delete upload
router.delete('/:filename', requireAuth, async (req, res) => {
  try {
    const filename = req.params.filename;
    if (filename !== path.basename(filename)) {
      return res.status(400).json({ error: 'Invalid upload filename' });
    }

    // Delete from database
    const deleted = await deleteUpload(filename);

    if (!deleted) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    // Delete from disk
    try {
      await fs.unlink(getUploadPath(filename));
    } catch (error) {
      console.warn(`Failed to delete file from disk: ${filename}`, error);
      // Don't fail the request if disk deletion fails
    }

    // Log the deletion
    await logAudit('DELETE', 'uploads', { filename }).catch((error) => console.warn('Failed to log deletion:', error));

    res.json({ success: true, deleted });
  } catch (error) {
    console.error('Error deleting upload:', error);
    res.status(500).json({ error: 'Failed to delete upload' });
  }
});

export { getFileMimeType, getTimestampedFilename, getUploadPath };
export default router;
