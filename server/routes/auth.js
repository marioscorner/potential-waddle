import express from 'express';
import { rateLimit } from 'express-rate-limit';
import argon2 from 'argon2';
import { verifyPassword, requireAuth } from '../middleware/auth.js';
import { getAuditLog, pool } from '../db/queries.js';

const router = express.Router();

const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again later.' },
});

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
let adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

const getAdminPasswordHash = async () => {
  if (adminPasswordHash) return adminPasswordHash;

  if (process.env.ADMIN_PASSWORD) {
    adminPasswordHash = await argon2.hash(process.env.ADMIN_PASSWORD);
    return adminPasswordHash;
  }

  return null;
};

if (!adminPasswordHash && !process.env.ADMIN_PASSWORD) {
  console.warn(
    '⚠️  Warning: ADMIN_PASSWORD_HASH or ADMIN_PASSWORD is not set. Admin routes will not work. Run: pnpm hash-password or set ADMIN_PASSWORD.'
  );
}

// POST /api/auth/login
router.post('/login', loginRateLimit, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    if (username !== ADMIN_USER) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordHash = await getAdminPasswordHash();

    if (!passwordHash) {
      return res.status(500).json({ error: 'Admin authentication not configured' });
    }

    const isValid = await verifyPassword(password, passwordHash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await new Promise((resolve, reject) => {
      req.session.regenerate((sessionError) => {
        if (sessionError) return reject(sessionError);
        req.session.authenticated = true;
        req.session.user = username;
        resolve();
      });
    });
    res.json({ success: true, user: username });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

router.post('/logout-other-sessions', requireAuth, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM session WHERE (sess::jsonb ->> \'user\') = $1 AND sid <> $2',
      [req.session.user, req.sessionID]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to close other sessions:', error);
    res.status(500).json({ error: 'Failed to close other sessions' });
  }
});

router.get('/operations', requireAuth, async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    const [lastActivity] = await getAuditLog(1);
    res.json({
      database: 'connected',
      lastActivity: lastActivity?.created_at || null,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to read operations status:', error);
    res.status(503).json({ error: 'Database unavailable' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.session.user, authenticated: true });
});

// GET /api/auth/status
router.get('/status', (req, res) => {
  res.json({
    authenticated: !!(req.session && req.session.authenticated),
    user: req.session?.user || null,
  });
});

export default router;
