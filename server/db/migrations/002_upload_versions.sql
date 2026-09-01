ALTER TABLE uploads ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

DROP INDEX IF EXISTS uploads_slot_unique;

CREATE UNIQUE INDEX IF NOT EXISTS uploads_active_slot_unique
ON uploads (slot) WHERE slot IS NOT NULL AND is_active = TRUE;
