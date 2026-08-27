import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const migrationsDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations');

const loadMigrations = async (directory = migrationsDirectory) => {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const names = entries
    .filter((entry) => entry.isFile() && /^\d+_.+\.sql$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();

  return Promise.all(names.map(async (name) => ({
    name,
    sql: await fs.readFile(path.join(directory, name), 'utf8'),
  })));
};

const applyMigrations = async (client, migrations) => {
  const migrationNames = new Set(migrations.map((migration) => migration.name));
  if (migrationNames.size !== migrations.length) {
    throw new Error('Migration names must be unique');
  }

  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const { rows } = await client.query('SELECT name FROM schema_migrations');
  const appliedNames = new Set(rows.map((row) => row.name));
  let appliedCount = 0;

  for (const migration of migrations) {
    if (appliedNames.has(migration.name)) continue;

    let transactionStarted = false;
    try {
      await client.query('BEGIN');
      transactionStarted = true;
      await client.query(migration.sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [migration.name]);
      await client.query('COMMIT');
      appliedCount += 1;
    } catch (error) {
      if (transactionStarted) await client.query('ROLLBACK').catch(() => {});
      throw error;
    }
  }

  return appliedCount;
};

const initDb = async () => {
  const client = await pool.connect();
  try {
    const appliedCount = await applyMigrations(client, await loadMigrations());
    console.log(`Database migrations verified (${appliedCount} applied)`);
  } catch (error) {
    console.error('Error applying database migrations:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

export { applyMigrations, initDb, loadMigrations, pool };
