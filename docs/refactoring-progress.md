# Refactoring Progress

## Baseline

- Source imported from the selected local working tree into a clean Git history.
- `pnpm install --frozen-lockfile`: validated after repairing the Argon2 lockfile mismatch.
- TypeScript: passed.
- Vite production build: passed.
- ESLint: passed with four pre-existing fast-refresh warnings.
- Tests: none existed.
- Dependency audit: 22 findings, including 12 high severity findings.

## Phase status

| Phase | Status | Evidence |
| --- | --- | --- |
| Repository and baseline | Completed | `e5f6239`; main and migration branch published |
| Astro public SSR | Ready for deployment validation | SSR pages, canonical redirects, custom 404 fallback, metadata, and local route checks pass |
| Admin islands | In progress | Compile and contract tests pass; authenticated PostgreSQL workflow pending |
| API characterization | In progress | Twelve `node:test` contracts cover auth, rate limiting, content, uploads, health, API 404, and canonical redirects |
| Database migrations | In progress | Versioned runner with transactional application and mock-client tests; PostgreSQL integration pending |
| Dependency hardening | Completed for current dependencies | Removed obsolete SPA dependencies, upgraded Multer, added login rate limiting, and production audit is clear |
| Docker and clean environment | In progress | Compose syntax is validated and uses a separate new PostgreSQL volume; image and runtime validation pending |
| Production migration | Approved, not executed | Requires server access, deployment, and live validation before retiring the old volume |

## Known pre-existing issues

- The admin dashboard consumes schemaless CMS data and needs authenticated PostgreSQL integration coverage.
- Content validation only covers selected URLs.
- Database and filesystem upload changes are not atomic.
- Deployment documentation references CI files that do not exist.
