UPDATE content
SET data = jsonb_set(
  jsonb_set(data, '{es,title}', '"Contacta conmigo"'::jsonb, TRUE),
  '{en,title}', '"Let''s get in touch"'::jsonb,
  TRUE
), updated_at = NOW()
WHERE id = 'contact';
