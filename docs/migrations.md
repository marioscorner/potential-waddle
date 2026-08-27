# Database Migrations

The Express process applies sorted SQL files from `server/db/migrations` at startup. Each migration is recorded by filename in `schema_migrations` and runs in its own transaction. A failed migration is rolled back and prevents the server from listening.

## Adding A Migration

1. Add a uniquely named, zero-padded SQL file, for example `002_add_example.sql`.
2. Make the SQL safe for existing data and reversible through a follow-up migration.
3. Add a `node:test` contract for runner behavior when needed.
4. Validate against a disposable PostgreSQL database, then rehearse backup and restore.

## Production Safety

Do not start a new image against production until the migration has been reviewed, a PostgreSQL backup and restore have been verified, and upload metadata integrity has been checked. Production migration requires explicit approval.
