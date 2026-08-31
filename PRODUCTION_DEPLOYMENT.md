# Production Deployment Guide

This guide covers deploying the admin panel system to production with Docker and Traefik.

## Prerequisites

- Docker and Docker Compose installed
- Domain with DNS configured
- Server with at least 1GB RAM (for Node.js + PostgreSQL)
- HTTPS certificate managed by Let's Encrypt (automatic via Traefik)

## Step 1: Generate Admin Password

Generate a secure password hash locally:

```bash
npm run hash-password
```

You'll be prompted to enter a password. Copy the generated hash (it starts with `$argon2id$...`).

**Keep this password safe!** You'll need it to log into the admin panel.

## Step 2: Prepare Production Environment Variables

Create a `.env` file on your production server:

```bash
# Server Configuration
NODE_ENV=production
PORT=3000

# Database Configuration
# Use a STRONG password and change the default!
DB_PASSWORD=your_very_secure_password_here_min_32_chars
DATABASE_URL=postgres://portfolio:your_very_secure_password_here_min_32_chars@postgres:5432/portfolio

# Admin Configuration
ADMIN_USER=admin
ADMIN_PASSWORD_HASH='<paste_the_hash_from_Step_1>'  # Note: Single quotes prevent variable interpolation
SESSION_SECRET=<generate_a_random_secret_32_chars_minimum>

# File Upload Configuration
UPLOAD_DIR=./uploads
```

### Generating a Secure Session Secret

Run this command locally to generate a secure random secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output to `SESSION_SECRET` in your `.env` file.

### Important Security Notes

- **Never** commit `.env` to version control
- Use strong passwords (minimum 32 characters with mixed case, numbers, special chars)
- Keep the original password (not the hash) secure for future reference
- Store `.env` in a safe location on your production server
- Restrict `.env` file permissions: `chmod 600 .env`

## Step 3: Deploy with Docker Compose

On your production server:

The Astro deployment starts with a new PostgreSQL database. If a final archive
of the old database is required, create it before deleting the old volume:

```bash
mkdir -p backups
docker compose exec -T postgres pg_dump -U portfolio -Fc portfolio > backups/portfolio-before-astro.dump
tar -czf backups/uploads-before-astro.tar.gz uploads
git rev-parse HEAD > backups/previous-commit.txt
```

After confirming that the archive is readable, stop the old stack and remove
its PostgreSQL volume. This operation is intentionally destructive and must not
be run until the new-database decision is confirmed:

```bash
docker compose down --volumes
```

The next startup applies `001_initial_schema.sql` to an empty PostgreSQL volume.
Astro serves the bundled default content and assets until sections or uploads
are changed through the admin interface.

```bash
# Copy/clone the repository
git clone <your-repo-url> my-digital-canvas
cd my-digital-canvas

# Verify your .env file is in place
ls -la .env

# Run the local quality gates
pnpm install --frozen-lockfile
pnpm test
pnpm lint
pnpm build

# Build and start the services only after the gates pass
docker compose up -d --build
```

The deployment includes:

- **PostgreSQL** (port 15432 bound to the server loopback interface only)
- **Node.js/Express** backend (port 3000, proxied through Traefik)
- **Astro SSR** for public pages, with React islands for the admin interface
- **Traefik** reverse proxy with Let's Encrypt HTTPS

### Verify Deployment

Check that all services are running:

```bash
docker compose ps
```

Expected output:
```
NAME                    STATUS
portfolio-postgres      Up (healthy)
my-digital-canvas       Up (healthy)
traefik                 Up
```

Test the health endpoint:

```bash
curl https://marioscorner.com/health
```

Expected response: `healthy`

Verify the public route and indexing contracts:

```bash
curl -I https://marioscorner.com/
curl -I https://marioscorner.com/es
curl -I https://marioscorner.com/en
curl -I https://www.marioscorner.com/en/
curl -I https://marioscorner.com/does-not-exist
curl -s https://marioscorner.com/es/ | grep -E 'canonical|hreflang|application/ld\+json'
curl -s https://marioscorner.com/robots.txt
curl -s https://marioscorner.com/sitemap.xml
```

The first four requests must redirect directly to the canonical apex URL, the
unknown URL must return `404`, and `/es/` and `/en/` must return rendered HTML.

## Step 4: Access the Admin Panel

Navigate to: `https://marioscorner.com/admin/`

1. Log in with username: `admin` and the password you generated in Step 1
2. The dashboard allows you to edit all portfolio content
3. Changes are immediately reflected on the public site

## File Structure

Key directories for production:

```
.
├── .env                     # Production environment variables (not in git)
├── docker-compose.yml       # Docker services definition
├── Dockerfile               # Node.js app build
├── dist/                    # Built Astro server and client output
├── server/                  # Express backend
│   ├── index.js            # Main server
│   ├── db/                 # Database initialization
│   ├── routes/             # API endpoints
│   └── middleware/         # Authentication
├── src/                     # Astro pages and React admin islands
├── uploads/                 # User uploaded files (persistent volume)
├── letsencrypt/            # HTTPS certificates (auto-managed by Traefik)
└── data/                   # Additional persistent data
```

## Monitoring and Maintenance

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f my-digital-canvas
docker compose logs -f postgres
```

### Database Backup

PostgreSQL data is persisted in the `postgres_data` Docker volume:

```bash
# Create a backup
docker compose exec postgres pg_dump -U portfolio portfolio > backup.sql

# Restore from backup
docker compose exec -T postgres psql -U portfolio portfolio < backup.sql
```

### Update the Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker compose up -d --build
```

### Update Content/Translations

Use the admin panel at `/admin` to edit all content. No rebuilds needed!

### Rollback

If route, admin, API, or data validation fails, rebuild the commit recorded in
`backups/previous-commit.txt` and restart only the `web` service. The archived
old database is not restored into Astro unless a separate data-import decision
is made.

After a successful deployment, submit `https://marioscorner.com/sitemap.xml`
in Google Search Console and inspect `/es/` and `/en/`. Monitor indexing,
canonical selection, Core Web Vitals, and structured data without requesting
repeated recrawls.

## Troubleshooting

### Admin login fails

1. Verify `ADMIN_PASSWORD_HASH` is set correctly:
   ```bash
   grep ADMIN_PASSWORD_HASH .env
   ```

2. Check the hash starts with `$argon2id$` (not `$$argon2id$$`)

3. Regenerate the hash locally and update `.env`

### Database connection error

1. Check PostgreSQL is healthy:
   ```bash
   docker compose logs postgres
   ```

2. Verify `DATABASE_URL` format:
   ```bash
   grep DATABASE_URL .env
   ```

3. Ensure the password in `DATABASE_URL` matches `DB_PASSWORD`

### Uploads not working

1. Check upload directory permissions:
   ```bash
   docker compose exec my-digital-canvas ls -la /app/uploads
   ```

2. Ensure the directory is writable:
   ```bash
   docker compose exec my-digital-canvas chmod 755 /app/uploads
   ```

### HTTPS certificate issues

Traefik automatically manages Let's Encrypt certificates. If issues occur:

```bash
# Remove and regenerate
rm -rf letsencrypt/
docker compose restart traefik
```

Wait 2-3 minutes for certificate generation.

### Application stuck or unresponsive

Restart the services:

```bash
docker compose restart my-digital-canvas
docker compose restart postgres
```

Or full restart:

```bash
docker compose down
docker compose up -d
```

## Security Checklist

- [ ] `.env` file created with strong passwords
- [ ] `.env` is NOT in version control (check `.gitignore`)
- [ ] Database password is at least 32 characters
- [ ] Session secret is generated and unique
- [ ] Admin password hash is stored (for recovery)
- [ ] HTTPS is working (`https://` not `http://`)
- [ ] File permissions are restricted (`chmod 600 .env`)
- [ ] Regular backups of PostgreSQL are scheduled
- [ ] Uploaded files are accessible only through the app

## Performance Optimization

For production with many concurrent users:

1. **Enable Docker resource limits** in `docker-compose.yml`:
   ```yaml
   services:
     my-digital-canvas:
       deploy:
         resources:
           limits:
             cpus: '1.0'
             memory: 1G
   ```

2. **Database optimization**:
   - Monitor slow queries with `docker compose exec postgres psql`
   - Enable PostgreSQL slow query log

3. **Caching**:
   - Content is cached in React and can be further optimized with CDN
   - Consider Redis for session storage if scaling beyond single instance

4. **Monitoring**:
   - Set up alerts for container health
   - Monitor disk space for uploads and database

## Support and Issues

For issues or questions:

1. Check `ADMIN_SETUP.md` for general admin panel documentation
2. Review logs: `docker compose logs -f`
3. Verify all environment variables are set: `env | grep -E "^(NODE_ENV|ADMIN|DATABASE|SESSION)"`
4. Test API endpoints directly:
   ```bash
   curl https://marioscorner.com/api/content/hero
   curl https://marioscorner.com/health
   ```

## Next Steps

1. **Set up monitoring** - Configure alerts for container health
2. **Automate backups** - Schedule daily PostgreSQL backups
3. **Enable CDN** - Serve static assets from a CDN
4. **Configure email** - Set up notifications for admin actions
5. **Custom domain** - Update Traefik configuration for your domain

## Additional Resources

- Docker Documentation: https://docs.docker.com/
- Traefik Documentation: https://doc.traefik.io/
- PostgreSQL Documentation: https://www.postgresql.org/docs/
- Node.js/Express: https://expressjs.com/
- React: https://react.dev/

---

**Last Updated**: May 2026
**Version**: 1.0
