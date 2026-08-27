CREATE TABLE IF NOT EXISTS content (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  section TEXT,
  changes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
