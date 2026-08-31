# Architecture

## Current target

The public portfolio is rendered on demand by Astro and the official Node adapter. Express owns the existing API, authentication sessions, uploads, health check, and process startup. PostgreSQL and the upload volume remain the systems of record.

```text
Traefik
  -> Express :3000
       -> /api/auth, /api/content, /api/uploads
       -> /uploads
       -> Astro middleware
            -> /es/, /en/, /admin/, /admin/dashboard/
            -> PostgreSQL reads for server-rendered content
```

## Boundaries

- `src/pages`: Astro routes.
- `src/components/PortfolioPage.astro`: server-rendered public portfolio.
- `src/components/admin`: React islands used only by the content editor.
- `src/lib/server`: server-only content composition.
- `server/routes`: stable Express API contracts.
- `server/db`: PostgreSQL access and versioned SQL migrations.

## Data

- `content`: JSONB sections keyed by section name.
- `uploads`: metadata for CV and hero image slots.
- `audit_log`: content and file-operation history.
- `session`: Express sessions managed by `connect-pg-simple`.
- `/app/uploads`: persistent files mounted by Docker Compose.

The Astro deployment starts with a new PostgreSQL volume. The previous database is not imported; public pages use bundled defaults until content is saved through the admin interface. Deleting the old volume remains a separate, explicitly destructive production operation.
