import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const initDb = async () => {
  const client = await pool.connect();
  try {
    // Create content table
    await client.query(`
      CREATE TABLE IF NOT EXISTS content (
        id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Create uploads table
    await client.query(`
      CREATE TABLE IF NOT EXISTS uploads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        filename TEXT NOT NULL UNIQUE,
        original_name TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        url TEXT NOT NULL,
        language TEXT NOT NULL DEFAULT 'en',
        document_type TEXT NOT NULL DEFAULT 'cv',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        slot TEXT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Migrate existing canonical uploads before enforcing one file per public slot.
    await client.query(`
      ALTER TABLE uploads ADD COLUMN IF NOT EXISTS slot TEXT;
      ALTER TABLE uploads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
      UPDATE uploads
      SET slot = CASE filename
        WHEN 'cv-es.pdf' THEN 'cv-es'
        WHEN 'cv-en.pdf' THEN 'cv-en'
        WHEN 'hero-photo.webp' THEN 'hero-photo'
        ELSE slot
      END
      WHERE slot IS NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS uploads_slot_unique
      ON uploads (slot) WHERE slot IS NOT NULL;
    `);

    // Create audit log table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        action TEXT NOT NULL,
        section TEXT,
        changes JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    console.log('✅ Database tables created/verified');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

export { initDb, pool };
