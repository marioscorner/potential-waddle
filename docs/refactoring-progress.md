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
| Astro public SSR | In progress | Astro check, lint, build, and local SSR route checks pass |
| Admin islands | In progress | Compile and build pass; runtime integration pending |
| API characterization | In progress | Six `node:test` contracts cover auth, rate limiting, content merging, URL validation, and upload signatures |
| Dependency hardening | Completed for current dependencies | Removed obsolete SPA dependencies, upgraded Multer, added login rate limiting, and production audit is clear |
| Docker and clean environment | Blocked by environment | Docker WSL integration unavailable |
| Production migration | Requires decision | No production action authorized |

## Known pre-existing issues

- The admin dashboard has schemaless state and weak TypeScript coverage.
- Content validation only covers selected URLs.
- Schema creation is not represented by versioned migrations.
- Database and filesystem upload changes are not atomic.
- Deployment documentation references CI files that do not exist.
