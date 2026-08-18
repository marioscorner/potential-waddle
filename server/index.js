import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { initDb } from './db/init.js';
import { pool } from './db/queries.js';
import authRoutes from './routes/auth.js';
import contentRoutes from './routes/content.js';
import uploadRoutes from './routes/uploads.js';
import { handler as astroHandler } from '../dist/server/entry.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const PgSession = connectPgSimple(session);
const SITE_URL = 'https://marioscorner.com';

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

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

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
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
app.use('/uploads', express.static(UPLOAD_DIR));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/uploads', uploadRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).send('healthy\n');
});

const clientPath = path.join(__dirname, '../dist/client');

app.use((req, res, next) => {
  if (req.hostname === 'www.marioscorner.com') {
    return res.redirect(301, `${SITE_URL}${req.originalUrl}`);
  }
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
app.use(astroHandler);

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize database and start server
const startServer = async () => {
  try {
    validateProductionEnv();

    // Initialize database tables
    await initDb();
    console.log('✅ Database initialized');

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

startServer();

export default app;
