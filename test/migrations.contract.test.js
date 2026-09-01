import assert from 'node:assert/strict';
import test from 'node:test';
import { applyMigrations, loadMigrations } from '../server/db/init.js';

test('migration files are discovered in lexical order', async () => {
  const migrations = await loadMigrations();
  assert.deepEqual(migrations.map((migration) => migration.name), ['001_initial_schema.sql', '002_upload_versions.sql', '003_update_hero_slogan.sql', '004_update_contact_heading.sql']);
  assert.match(migrations[0].sql, /CREATE TABLE IF NOT EXISTS content/);
  assert.match(migrations[1].sql, /is_active BOOLEAN/);
  assert.match(migrations[2].sql, /Turning today''s ideas/);
  assert.match(migrations[3].sql, /Contacta conmigo/);
});

test('only pending migrations are applied and recorded transactionally', async () => {
  const queries = [];
  const client = {
    async query(sql, params) {
      queries.push({ sql, params });
      if (sql === 'SELECT name FROM schema_migrations') {
        return { rows: [{ name: '001_existing.sql' }] };
      }
      return { rows: [] };
    },
  };
  const migrations = [
    { name: '001_existing.sql', sql: 'SELECT 1;' },
    { name: '002_pending.sql', sql: 'SELECT 2;' },
  ];

  assert.equal(await applyMigrations(client, migrations), 1);
  assert.match(queries[0].sql, /CREATE TABLE IF NOT EXISTS schema_migrations/);
  assert.deepEqual(queries.slice(1).map(({ sql }) => sql), [
    'SELECT name FROM schema_migrations',
    'BEGIN',
    'SELECT 2;',
    'INSERT INTO schema_migrations (name) VALUES ($1)',
    'COMMIT',
  ]);
  assert.deepEqual(queries[4].params, ['002_pending.sql']);
});

test('failed migrations roll back their transaction', async () => {
  const queries = [];
  const client = {
    async query(sql) {
      queries.push(sql);
      if (sql === 'SELECT name FROM schema_migrations') return { rows: [] };
      if (sql === 'INVALID SQL') throw new Error('invalid migration');
      return { rows: [] };
    },
  };

  await assert.rejects(applyMigrations(client, [{ name: '001_invalid.sql', sql: 'INVALID SQL' }]), /invalid migration/);
  assert.deepEqual(queries.slice(-3), ['BEGIN', 'INVALID SQL', 'ROLLBACK']);
});
