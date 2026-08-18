# Refactoring Traceability

| Functionality | Previous implementation | Target implementation | Validation | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| Spanish portfolio | React SPA plus manual Express HTML | Astro SSR `/es/` | Build; runtime pending | In progress | PostgreSQL fallback retained |
| English portfolio | React SPA plus manual Express HTML | Astro SSR `/en/` | Build; runtime pending | In progress | PostgreSQL fallback retained |
| SEO metadata | Client effects and duplicated template | Astro layout | Static check; runtime pending | In progress | Canonical, hreflang, OG, Twitter, JSON-LD |
| Theme | `next-themes` React provider | Minimal browser script | Build; browser pending | In progress | Local preference retained |
| Language switch | React context and navigation | Language links | Build; browser pending | In progress | Stable language URLs |
| Admin login | React Router page | React island | Build; integration pending | In progress | API unchanged |
| Content editor | React SPA page | React island | Build; integration pending | In progress | API unchanged |
| Content API | Express | Express-compatible contract | Baseline only | Pending tests | No contract change |
| Authentication | Express session in PostgreSQL | Existing implementation | Baseline only | Pending tests | Production sessions preserved |
| Uploads | Express, PostgreSQL, filesystem | Existing implementation | Baseline only | Pending tests | Production volume preserved |
| Deployment | Docker Compose and Traefik | Same topology with Astro build | Not validated | Pending | Docker unavailable in WSL |
