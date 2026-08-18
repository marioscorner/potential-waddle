# ADR 0001: Astro SSR with the existing Express API

- Status: accepted
- Date: 2026-08-18

## Context

The React SPA required duplicated HTML generation in Express to expose meaningful SEO content. The same application also contains a stateful CMS, PostgreSQL sessions, and filesystem uploads already running in production.

## Decision

Use Astro 7 SSR with the official Node adapter for pages and retain Express as the outer server and API host during migration. Keep React only for the administration islands. Preserve all API paths, PostgreSQL tables, and upload locations.

## Alternatives

- Full rewrite in one deployment: rejected because it combines presentation, authentication, API, and data risks.
- Static Astro output: rejected because public content is edited at runtime in PostgreSQL.
- Keep the React SPA: rejected because it preserves unnecessary client JavaScript and duplicated SEO rendering.

## Consequences

- Public pages return complete HTML and metadata without client rendering.
- Existing production sessions and API consumers remain compatible.
- Express remains a temporary architectural boundary and can be reconsidered only after API characterization tests exist.
