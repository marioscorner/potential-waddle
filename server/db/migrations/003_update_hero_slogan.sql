UPDATE content
SET data = jsonb_set(
  jsonb_set(data, '{es,intro}', '"Convirtiendo las ideas de hoy en las soluciones de mañana."'::jsonb, TRUE),
  '{en,intro}', '"Turning today''s ideas into the solutions of tomorrow."'::jsonb,
  TRUE
), updated_at = NOW()
WHERE id = 'hero';
