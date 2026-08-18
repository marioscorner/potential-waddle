import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Content queries
const getContent = async (id) => {
  const result = await pool.query(
    'SELECT data FROM content WHERE id = $1',
    [id]
  );
  return result.rows[0]?.data || null;
};

const setContent = async (id, data) => {
  await pool.query(
    'INSERT INTO content (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = NOW()',
    [id, JSON.stringify(data)]
  );
};

const getAllContent = async () => {
  const result = await pool.query('SELECT id, data, updated_at FROM content');
  const content = {};
  result.rows.forEach((row) => {
    content[row.id] = row.data;
  });
  return content;
};

// Upload queries
const getUploads = async (language) => {
  const query = language
    ? 'SELECT * FROM uploads WHERE language = $1 ORDER BY updated_at DESC'
    : 'SELECT * FROM uploads ORDER BY updated_at DESC';
  const params = language ? [language] : [];
  const result = await pool.query(query, params);
  return result.rows;
};

const upsertUploadBySlot = async (slot, filename, originalName, mimeType, size, url, language, documentType) => {
  const result = await pool.query(
    `INSERT INTO uploads (slot, filename, original_name, mime_type, size, url, language, document_type)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (slot) WHERE slot IS NOT NULL
     DO UPDATE SET
       filename = EXCLUDED.filename,
       original_name = EXCLUDED.original_name,
       mime_type = EXCLUDED.mime_type,
       size = EXCLUDED.size,
       url = EXCLUDED.url,
       language = EXCLUDED.language,
       document_type = EXCLUDED.document_type,
       updated_at = NOW()
     RETURNING *`,
    [slot, filename, originalName, mimeType, size, url, language, documentType]
  );
  return result.rows[0];
};

const addUpload = async (filename, originalName, mimeType, size, url, language = 'en', documentType = 'cv') => {
  const result = await pool.query(
    'INSERT INTO uploads (filename, original_name, mime_type, size, url, language, document_type) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [filename, originalName, mimeType, size, url, language, documentType]
  );
  return result.rows[0];
};

const deleteUpload = async (filename) => {
  const result = await pool.query(
    'DELETE FROM uploads WHERE filename = $1 RETURNING *',
    [filename]
  );
  return result.rows[0];
};

const logAudit = async (action, section, changes) => {
  await pool.query(
    'INSERT INTO audit_log (action, section, changes) VALUES ($1, $2, $3)',
    [action, section, JSON.stringify(changes)]
  );
};

export {
  pool,
  getContent,
  setContent,
  getAllContent,
  getUploads,
  upsertUploadBySlot,
  addUpload,
  deleteUpload,
  logAudit,
};
