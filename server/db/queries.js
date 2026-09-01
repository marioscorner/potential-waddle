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
const getUploads = async (language, includeInactive = false) => {
  const clauses = [];
  const params = [];

  if (language) {
    params.push(language);
    clauses.push(`language = $${params.length}`);
  }
  if (!includeInactive) clauses.push('is_active = TRUE');

  const query = `SELECT * FROM uploads${clauses.length ? ` WHERE ${clauses.join(' AND ')}` : ''} ORDER BY updated_at DESC`;
  const result = await pool.query(query, params);
  return result.rows;
};

const getActiveUploadBySlot = async (slot) => {
  const result = await pool.query(
    'SELECT * FROM uploads WHERE slot = $1 AND is_active = TRUE LIMIT 1',
    [slot]
  );
  return result.rows[0] || null;
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

const createUploadVersion = async (slot, filename, originalName, mimeType, size, url, language, documentType) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE uploads SET is_active = FALSE WHERE slot = $1 AND is_active = TRUE', [slot]);
    const result = await client.query(
      `INSERT INTO uploads (slot, filename, original_name, mime_type, size, url, language, document_type, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
       RETURNING *`,
      [slot, filename, originalName, mimeType, size, url, language, documentType]
    );
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
};

const activateUpload = async (filename) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT * FROM uploads WHERE filename = $1 FOR UPDATE', [filename]);
    const upload = rows[0];
    if (!upload) return null;

    await client.query('UPDATE uploads SET is_active = FALSE WHERE slot = $1 AND is_active = TRUE', [upload.slot]);
    const result = await client.query(
      'UPDATE uploads SET is_active = TRUE, updated_at = NOW() WHERE filename = $1 RETURNING *',
      [filename]
    );
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
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

const getAuditLog = async (limit = 50) => {
  const result = await pool.query(
    'SELECT id, action, section, changes, created_at FROM audit_log ORDER BY created_at DESC LIMIT $1',
    [limit]
  );
  return result.rows;
};

const getAuditEntry = async (id) => {
  const result = await pool.query(
    'SELECT id, action, section, changes, created_at FROM audit_log WHERE id = $1 LIMIT 1',
    [id]
  );
  return result.rows[0] || null;
};

export {
  pool,
  getContent,
  setContent,
  getAllContent,
  getUploads,
  getActiveUploadBySlot,
  upsertUploadBySlot,
  addUpload,
  createUploadVersion,
  activateUpload,
  deleteUpload,
  logAudit,
  getAuditLog,
  getAuditEntry,
};
