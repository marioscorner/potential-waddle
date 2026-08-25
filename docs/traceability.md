# Refactoring Traceability

| Functionality | Previous implementation | Target implementation | Validation | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| Spanish portfolio | React SPA plus manual Express HTML | Astro SSR `/es/` | Build and local SSR response | In progress | PostgreSQL fallback retained |
| English portfolio | React SPA plus manual Express HTML | Astro SSR `/en/` | Build and local SSR response | In progress | PostgreSQL fallback retained |
| SEO metadata | Client effects and duplicated template | Astro layout | Build and local SSR response | In progress | Canonical, hreflang, OG, Twitter, JSON-LD |
| Theme | `next-themes` React provider | Minimal browser script | Build; browser pending | In progress | Local preference retained |
| Language switch | React context and navigation | Language links | Build; browser pending | In progress | Stable language URLs |
| Admin login | React Router page | React island | Build and local SSR response | In progress | API unchanged; rate limited |
| Content editor | React SPA page | React island | Build; integration pending | In progress | API unchanged |
| Content API | Express | Express-compatible contract | Merge and URL validation tests | In progress | No contract change |
| Authentication | Express session in PostgreSQL | Existing implementation | Login rate-limit request check | In progress | Production sessions preserved; 10 attempts per 15 minutes |
| Uploads | Express, PostgreSQL, filesystem | Existing implementation | Baseline only | Pending tests | Production volume preserved |
| Deployment | Docker Compose and Traefik | Same topology with Astro build | Not validated | Pending | Docker unavailable in WSL |
