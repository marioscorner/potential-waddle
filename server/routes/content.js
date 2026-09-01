import express from 'express';
import { getContent, setContent, getAllContent, logAudit, getAuditLog, getAuditEntry } from '../db/queries.js';
import { requireAuth } from '../middleware/auth.js';
import defaultContent from './defaultContent.js';

const router = express.Router();

const isPlainObject = (value) =>
  value && typeof value === 'object' && !Array.isArray(value);

const mergeDefaults = (defaults, content) => {
  if (!isPlainObject(defaults) || !isPlainObject(content)) {
    return content ?? defaults;
  }

  return Object.entries({ ...defaults, ...content }).reduce((merged, [key, value]) => {
    merged[key] = mergeDefaults(defaults[key], value);
    return merged;
  }, {});
};

const isSafeExternalUrl = (value) => {
  if (typeof value !== 'string') return false;

  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

const isString = (value) => typeof value === 'string';
const isLocalizedText = (value) => (
  isPlainObject(value) &&
  isString(value.es) &&
  isString(value.en) &&
  Object.values(value).every(isString)
);
const isLocalizedSection = (value) => (
  isPlainObject(value) &&
  isPlainObject(value.es) &&
  isPlainObject(value.en) &&
  Object.values(value.es).every(isString) &&
  Object.values(value.en).every(isString)
);
const isSeoText = (value, maximumLength) =>
  isString(value) && value.trim().length > 0 && value.length <= maximumLength;
const isMonth = (value) => typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
const editableSections = new Set(Object.keys(defaultContent));

const getValidationError = (section, data) => {
  if (!editableSections.has(section)) {
    return 'Unknown content section';
  }

  if (['featured', 'projects'].includes(section) && !isSafeExternalUrl(data?.url)) {
    return 'Target URL must use http:// or https://';
  }

  if (section === 'social' && (
    !Array.isArray(data) ||
    data.some((link) => !isSafeExternalUrl(link?.url))
  )) {
    return 'Every social link must use http:// or https://';
  }

  if (section === 'social' && data.some((link) => (
    !isPlainObject(link) || !isString(link.name) || !isString(link.icon)
  ))) {
    return 'Social links require a name, URL, and icon';
  }

  if (['hero', 'about', 'contact', 'featured', 'projects', 'meta', 'footer', 'sectionTitles'].includes(section) && !isLocalizedSection(data)) {
    return 'This section requires Spanish and English text';
  }

  if (section === 'meta' && ['es', 'en'].some((language) => (
    !isSeoText(data[language].title, 60) || !isSeoText(data[language].description, 160)
  ))) {
    return 'Search titles must be 1-60 characters and descriptions must be 1-160 characters';
  }

  if (section === 'status' && (
    !isLocalizedSection(data) ||
    (data.indicatorColor !== undefined && (!isString(data.indicatorColor) || !/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(data.indicatorColor)))
  )) {
    return 'Status requires Spanish and English text and a valid hex indicator colour';
  }

  if (section === 'technologies' && (!isPlainObject(data) || !Array.isArray(data.items) || data.items.some((item) => !isString(item)))) {
    return 'Technologies must be a list of text values';
  }

  if (['certifications', 'languages'].includes(section) && (
    !Array.isArray(data) ||
    data.some((item) => !isPlainObject(item) || !isLocalizedText(item.name) || !isLocalizedText(item[section === 'certifications' ? 'issuer' : 'level']))
  )) {
    return `${section === 'certifications' ? 'Certifications' : 'Languages'} require Spanish and English text`;
  }

  if (section === 'experience' && (
    !Array.isArray(data) ||
    data.some((item) => !isPlainObject(item) || !isString(item.company) || !isMonth(item.startDate) ||
      !isString(item.endDate) || typeof item.isCurrent !== 'boolean' || !isLocalizedText(item.position) ||
      !isPlainObject(item.responsibilities) || ['es', 'en'].some((language) => (
        !Array.isArray(item.responsibilities[language]) || item.responsibilities[language].some((entry) => !isString(entry))
      )))
  )) {
    return 'Experience entries require valid dates and Spanish and English text';
  }

  return null;
};

// GET /api/content
// Public route - get all content
router.get('/', async (req, res) => {
  try {
    const allContent = await getAllContent();
    const storedContent = Object.fromEntries(
      Object.entries(allContent).filter(([section]) => editableSections.has(section))
    );
    
    // Merge with defaults to ensure all sections exist
    const merged = mergeDefaults(defaultContent, storedContent);
    
    res.json(merged);
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

router.get('/audit', requireAuth, async (req, res) => {
  try {
    const requestedLimit = Number(req.query.limit);
    const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 50;
    res.json(await getAuditLog(limit));
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

router.get('/export', requireAuth, async (req, res) => {
  try {
    const allContent = await getAllContent();
    const content = Object.fromEntries(Object.entries(allContent).filter(([section]) => editableSections.has(section)));
    res.set('Content-Disposition', 'attachment; filename="marioscorner-content.json"');
    res.json({ exportedAt: new Date().toISOString(), content });
  } catch (error) {
    console.error('Error exporting content:', error);
    res.status(500).json({ error: 'Failed to export content' });
  }
});

// GET /api/content/:id
// Public route - get specific content section
router.get('/:id', async (req, res) => {
  try {
    if (!editableSections.has(req.params.id)) {
      return res.status(404).json({ error: 'Content section not found' });
    }

    const content = await getContent(req.params.id);
    
    if (!content) {
      const defaultValue = defaultContent[req.params.id];
      return res.json(defaultValue || null);
    }
    
    res.json(mergeDefaults(defaultContent[req.params.id], content));
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// PUT /api/content/:id
// Admin route - update content section
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'Data is required' });
    }

    const validationError = getValidationError(req.params.id, data);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }
    
    const previous = await getContent(req.params.id);
    await setContent(req.params.id, data);
    
    // Log the change
    await logAudit('UPDATE', req.params.id, {
      before: previous,
      after: data,
      user: req.session.user,
      timestamp: new Date(),
    });
    
    res.json({ success: true, id: req.params.id });
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({ error: 'Failed to update content' });
  }
});

router.post('/:id/restore/:auditId', requireAuth, async (req, res) => {
  try {
    if (!editableSections.has(req.params.id)) return res.status(404).json({ error: 'Content section not found' });
    const entry = await getAuditEntry(req.params.auditId);
    const restoredData = entry?.section === req.params.id ? entry.changes?.after : null;
    const validationError = getValidationError(req.params.id, restoredData);
    if (!restoredData || validationError) return res.status(400).json({ error: 'This audit entry cannot be restored' });

    const previous = await getContent(req.params.id);
    await setContent(req.params.id, restoredData);
    await logAudit('RESTORE', req.params.id, {
      before: previous,
      after: restoredData,
      restoredFrom: entry.id,
      user: req.session.user,
      timestamp: new Date(),
    });
    res.json({ success: true, id: req.params.id });
  } catch (error) {
    console.error('Error restoring content:', error);
    res.status(500).json({ error: 'Failed to restore content' });
  }
});

router.post('/import', requireAuth, async (req, res) => {
  try {
    const importedContent = req.body?.content;
    if (!isPlainObject(importedContent)) return res.status(400).json({ error: 'A content export is required' });

    const entries = Object.entries(importedContent).filter(([section]) => editableSections.has(section));
    if (entries.length === 0) return res.status(400).json({ error: 'No editable sections found in this export' });

    for (const [section, data] of entries) {
      const validationError = getValidationError(section, data);
      if (validationError) return res.status(400).json({ error: `${section}: ${validationError}` });
    }

    for (const [section, data] of entries) {
      const previous = await getContent(section);
      await setContent(section, data);
      await logAudit('IMPORT', section, { before: previous, after: data, user: req.session.user, timestamp: new Date() });
    }
    res.json({ success: true, imported: entries.map(([section]) => section) });
  } catch (error) {
    console.error('Error importing content:', error);
    res.status(500).json({ error: 'Failed to import content' });
  }
});

// Seed default content on first run
router.post('/seed', requireAuth, async (req, res) => {
  try {
    for (const [key, value] of Object.entries(defaultContent)) {
      await setContent(key, value);
    }
    
    res.json({ success: true, message: 'Database seeded with default content' });
  } catch (error) {
    console.error('Error seeding content:', error);
    res.status(500).json({ error: 'Failed to seed content' });
  }
});

export { getValidationError, mergeDefaults };
export default router;
