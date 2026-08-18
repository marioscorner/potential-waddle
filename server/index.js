import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import path from 'path';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { initDb } from './db/init.js';
import { pool, getAllContent } from './db/queries.js';
import authRoutes from './routes/auth.js';
import contentRoutes from './routes/content.js';
import uploadRoutes from './routes/uploads.js';
import defaultContent from './routes/defaultContent.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const PgSession = connectPgSimple(session);
const SITE_URL = 'https://marioscorner.com';

const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

const mergeDefaults = (defaults, content) => {
  if (!isPlainObject(defaults) || !isPlainObject(content)) return content ?? defaults;

  return Object.entries({ ...defaults, ...content }).reduce((merged, [key, value]) => {
    merged[key] = mergeDefaults(defaults[key], value);
    return merged;
  }, {});
};

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const safeExternalUrl = (value, fallback = '#') => {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : fallback;
  } catch {
    return fallback;
  }
};

const renderPublicDocument = (indexTemplate, language, content) => {
  const copy = content.meta?.[language] || defaultContent.meta[language];
  const hero = content.hero?.[language] || defaultContent.hero[language];
  const about = content.about?.[language] || defaultContent.about[language];
  const contact = content.contact?.[language] || defaultContent.contact[language];
  const projects = content.projects?.[language] || defaultContent.projects[language];
  const featured = content.featured?.[language] || defaultContent.featured[language];
  const experience = Array.isArray(content.experience) ? content.experience : defaultContent.experience;
  const technologies = content.technologies?.items || defaultContent.technologies.items;
  const canonical = `${SITE_URL}/${language}/`;
  const locale = language === 'es' ? 'es_ES' : 'en_US';
  const image = `${SITE_URL}/MY_PHOTO.png`;
  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: 'marioscorner',
        url: SITE_URL,
        inLanguage: language,
      },
      {
        '@type': 'ProfilePage',
        mainEntity: {
          '@type': 'Person',
          name: hero.name,
          url: canonical,
          image,
          jobTitle: language === 'es' ? 'Desarrollador full stack' : 'Full stack developer',
          sameAs: (content.social || []).map((link) => safeExternalUrl(link.url)).filter((url) => url !== '#'),
        },
      },
    ],
  }).replaceAll('<', '\\u003c');
  const assets = indexTemplate.match(/<script type="module"[^>]*><\/script>|<link rel="stylesheet"[^>]*>/g)?.join('\n    ') || '';
  const body = `<main id="main-content">
      <header>
        <p>${escapeHtml(hero.greeting)} <strong>${escapeHtml(hero.name)}</strong>, ${escapeHtml(hero.intro)}</p>
        <h1>${escapeHtml(language === 'es' ? 'Mario Gutiérrez, desarrollador full stack' : 'Mario Gutiérrez, full stack developer')}</h1>
        <p>${escapeHtml(hero.cta)}</p>
      </header>
      <section aria-labelledby="about-title">
        <h2 id="about-title">${escapeHtml(about.title)}</h2>
        <p>${escapeHtml(about.paragraph1)}</p>
        <p>${escapeHtml(about.paragraphFullStack)}</p>
        <p>${escapeHtml(about.paragraph2)}</p>
      </section>
      <section aria-labelledby="contact-title">
        <h2 id="contact-title">${escapeHtml(contact.title)}</h2>
        <address><a href="mailto:${escapeHtml(contact.email)}">${escapeHtml(contact.email)}</a><br>${escapeHtml(contact.location)}</address>
      </section>
      <section aria-labelledby="projects-title">
        <h2 id="projects-title">${escapeHtml(projects.title)}</h2>
        <p>${escapeHtml(projects.description)}</p>
        <p><a href="${escapeHtml(safeExternalUrl(content.projects?.url || defaultContent.projects.url))}">${escapeHtml(projects.visitGitHub)}</a></p>
      </section>
      <section aria-labelledby="featured-title">
        <h2 id="featured-title">${escapeHtml(featured.title)}</h2>
        <article>
          <h3>${escapeHtml(featured.projectTitle)}</h3>
          <p>${escapeHtml(featured.description)}</p>
          <p>${escapeHtml(featured.description2)}</p>
        </article>
      </section>
      <section aria-labelledby="technologies-title">
        <h2 id="technologies-title">${language === 'es' ? 'Tecnologías' : 'Technologies'}</h2>
        <ul>${technologies.map((technology) => `<li>${escapeHtml(technology)}</li>`).join('')}</ul>
      </section>
      <section aria-labelledby="experience-title">
        <h2 id="experience-title">${language === 'es' ? 'Experiencia' : 'Experience'}</h2>
        ${experience.map((job) => `<article><h3>${escapeHtml(job.position?.[language])}</h3><p>${escapeHtml(job.company)}</p>${job.responsibilities?.[language]?.length ? `<ul>${job.responsibilities[language].map((responsibility) => `<li>${escapeHtml(responsibility)}</li>`).join('')}</ul>` : ''}</article>`).join('')}
      </section>
    </main>`;

  return `<!DOCTYPE html>
<html lang="${language}">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(copy.title)}</title>
    <meta name="description" content="${escapeHtml(copy.description)}">
    <meta name="author" content="marioscorner">
    <link rel="canonical" href="${canonical}">
    <link rel="alternate" hreflang="es" href="${SITE_URL}/es/">
    <link rel="alternate" hreflang="en" href="${SITE_URL}/en/">
    <link rel="alternate" hreflang="x-default" href="${SITE_URL}/es/">
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${escapeHtml(copy.title)}">
    <meta property="og:description" content="${escapeHtml(copy.description)}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:image" content="${image}">
    <meta property="og:image:alt" content="${escapeHtml(hero.name)}">
    <meta property="og:locale" content="${locale}">
    <meta property="og:site_name" content="marioscorner">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(copy.title)}">
    <meta name="twitter:description" content="${escapeHtml(copy.description)}">
    <meta name="twitter:image" content="${image}">
    <script type="application/ld+json">${schema}</script>
    ${assets}
  </head>
  <body>
    <div id="root">${body}</div>
  </body>
</html>`;
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

const distPath = path.join(__dirname, '../dist');
const indexPath = path.join(distPath, 'index.html');

app.use((req, res, next) => {
  if (req.hostname === 'www.marioscorner.com') {
    return res.redirect(301, `${SITE_URL}${req.originalUrl}`);
  }
  next();
});

app.get('/', (req, res) => res.redirect(301, '/es/'));

app.get(['/:language(es|en)', '/:language(es|en)/'], async (req, res, next) => {
  try {
    if (!req.path.endsWith('/')) {
      return res.redirect(301, `/${req.params.language}/`);
    }
    const [indexTemplate, storedContent] = await Promise.all([
      readFile(indexPath, 'utf8'),
      getAllContent().catch(() => ({})),
    ]);
    res.set('Cache-Control', 'public, max-age=0, must-revalidate');
    res.type('html').send(renderPublicDocument(indexTemplate, req.params.language, mergeDefaults(defaultContent, storedContent)));
  } catch (error) {
    next(error);
  }
});

app.get(['/admin', '/admin/dashboard'], (req, res) => {
  res.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  res.sendFile(indexPath);
});

app.use(express.static(distPath, {
  index: false,
  setHeaders: (res, filePath) => {
    if (filePath.includes(`${path.sep}assets${path.sep}`)) {
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
      return;
    }
    res.set('Cache-Control', 'public, max-age=0, must-revalidate');
  },
}));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.status(404).type('html').send('<!DOCTYPE html><html lang="en"><head><meta name="robots" content="noindex"><title>404 - Page not found</title></head><body><main><h1>404 - Page not found</h1><p>The requested page does not exist.</p><a href="/es/">Go to the homepage</a></main></body></html>');
});

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
