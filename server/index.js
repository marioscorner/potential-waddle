import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { existsSync } from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { initDb } from './db/init.js';
import { pool } from './db/queries.js';
import authRoutes from './routes/auth.js';
import contentRoutes from './routes/content.js';
import uploadRoutes from './routes/uploads.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const PgSession = connectPgSimple(session);
const SITE_URL = 'https://marioscorner.com';
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');
const clientPath = path.join(__dirname, '../dist/client');
const pageRedirects = new Map([
  ['/', '/es/'],
  ['/es', '/es/'],
  ['/en', '/en/'],
  ['/admin', '/admin/'],
  ['/admin/dashboard', '/admin/dashboard/'],
  ['/uploads/cv-es.pdf', '/cv-es.pdf'],
  ['/uploads/cv-en.pdf', '/cv-en.pdf'],
]);
let astroHandler;

const setAstroHandler = (handler) => {
  astroHandler = handler;
};

const getCanonicalRedirect = (req) => {
  if (!['GET', 'HEAD'].includes(req.method)) return null;

  const targetPath = pageRedirects.get(req.path) || req.path;
  if (req.hostname !== 'www.marioscorner.com' && targetPath === req.path) return null;

  const queryIndex = req.originalUrl.indexOf('?');
  const query = queryIndex >= 0 ? req.originalUrl.slice(queryIndex) : '';
  return `${SITE_URL}${targetPath}${query}`;
};

const validateProductionEnv = () => {
  if (process.env.NODE_ENV !== 'production') return;

  const missing = ['SESSION_SECRET'].filter((key) => !process.env[key]);

  if (!process.env.ADMIN_PASSWORD_HASH && !process.env.ADMIN_PASSWORD) {
    missing.push('ADMIN_PASSWORD_HASH or ADMIN_PASSWORD');
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required production environment variables: ${missing.join(', ')}. ` +
        'Set ADMIN_PASSWORD for automatic startup hashing, or generate ADMIN_PASSWORD_HASH with: pnpm hash-password'
    );
  }
};

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// The portfolio and CMS use same-origin requests; do not grant cross-origin API access.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use((req, res, next) => {
  const redirect = getCanonicalRedirect(req);
  if (redirect) return res.redirect(301, redirect);
  next();
});

// Session configuration
app.use(
  session({
    store: new PgSession({
      pool,
      tableName: 'session',
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Serve uploads directory
app.use('/uploads', express.static(UPLOAD_DIR));

const serveCv = (language) => (req, res, next) => {
  const filename = `cv-${language}.pdf`;
  const uploadedPath = path.join(UPLOAD_DIR, filename);
  const fallbackPath = path.join(clientPath, filename);
  const filePath = existsSync(uploadedPath) ? uploadedPath : fallbackPath;

  res.sendFile(filePath, {
    headers: { 'Cache-Control': 'public, max-age=0, must-revalidate' },
  }, (error) => {
    if (error) next(error);
  });
};

app.get('/cv-es.pdf', serveCv('es'));
app.get('/cv-en.pdf', serveCv('en'));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/uploads', uploadRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).send('healthy\n');
});

app.use('/admin', (req, res, next) => {
  res.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  next();
});

app.use(express.static(clientPath, {
  setHeaders: (res, filePath) => {
    if (filePath.includes(`${path.sep}assets${path.sep}`)) {
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
      return;
    }
    res.set('Cache-Control', 'public, max-age=0, must-revalidate');
  },
}));

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));
app.use((req, res, next) => {
  if (!astroHandler) return next();
  return astroHandler(req, res, next);
});
app.use((req, res, next) => {
  if (!astroHandler || res.headersSent) return next();

  const originalUrl = req.url;
  req.url = '/404/';
  res.once('finish', () => { req.url = originalUrl; });
  return astroHandler(req, res, (error) => {
    req.url = originalUrl;
    next(error);
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize database and start server
const startServer = async () => {
  try {
    validateProductionEnv();

    // Initialize database tables
    await initDb();
    console.log('✅ Database initialized');

    const { handler } = await import('../dist/server/entry.mjs');
    setAstroHandler(handler);

    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Admin dashboard: http://localhost:${PORT}/admin`);
      console.log(`📍 API: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  startServer();
}

export { getCanonicalRedirect, setAstroHandler, startServer };
export default app;
