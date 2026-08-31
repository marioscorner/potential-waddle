# marioscorner.com

Personal portfolio and content-managed site rendered with Astro SSR. Express continues to host the existing API, PostgreSQL session store, and uploads while the migration proceeds.

## Stack

- Astro 7 SSR with the Node adapter for public pages and SEO.
- React islands for `/admin/` and `/admin/dashboard/`.
- Express for `/api`, authentication, uploads, and health checks.
- PostgreSQL for content, sessions, upload metadata, and audit history.
- Tailwind CSS for styles.

## Requirements

- Node.js 22.
- Corepack and `pnpm@11.1.1`.
- PostgreSQL for the Express application; public Astro development routes use safe default content if it is unavailable.

## Local Development

```sh
corepack enable
corepack prepare pnpm@11.1.1 --activate
pnpm install --frozen-lockfile
pnpm dev
```

Astro runs on port 4321. To run the complete Express application, first build it and provide `DATABASE_URL`, `SESSION_SECRET`, and admin credentials:

```sh
pnpm build
DATABASE_URL=postgres://... SESSION_SECRET=... ADMIN_PASSWORD_HASH=... pnpm server
```

Generate a password hash with `pnpm hash-password`.

## Validation

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm lint
pnpm test:seo
pnpm audit --prod --audit-level moderate
```

## Deployment

`docker-compose.yml` retains the VPS topology: Traefik terminates TLS, the `web` container runs Express and the Astro handler on port 3000, PostgreSQL stores application data, and `./uploads` is mounted at `/app/uploads`.

At startup Express applies pending SQL files from `server/db/migrations`; see `docs/migrations.md` before adding or deploying one.

Do not run the Compose stack against production data without a verified PostgreSQL backup, a tested restore, upload integrity checks, and explicit production approval. Docker validation is currently blocked in this WSL environment because Docker Desktop integration is unavailable.

See `docs/architecture.md`, `docs/traceability.md`, and `docs/refactoring-progress.md` for migration details.
