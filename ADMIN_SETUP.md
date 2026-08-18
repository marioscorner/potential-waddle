# Admin Panel Setup Guide

This project now includes a complete admin management system for editing portfolio content and uploading documents without taking the site down.

## Quick Start

### 1. Generate Admin Password Hash

First, create a password hash for your admin account:

```bash
npm run hash-password
```

Follow the prompt to enter your desired admin password. Copy the generated hash.

### 2. Create Environment File

Create a `.env` file in the root directory (copy from `.env.example`):

```bash
cp .env.example .env
```

Update the following variables:

```env
DATABASE_URL=postgres://portfolio:your_secure_password@postgres:5432/portfolio
ADMIN_USER=your_admin_username
ADMIN_PASSWORD_HASH=<paste_the_hash_from_step_1>
SESSION_SECRET=your_secure_random_string_here
DB_PASSWORD=your_secure_password
```

### 3. Local Development

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

In a separate terminal, start the Express server:

```bash
npm run server
```

Access the admin panel at `http://localhost:3000/admin`

### 4. Docker Production Deployment

Build and run with Docker Compose:

```bash
docker-compose up -d --build
```

The admin panel will be available at `https://marioscorner.com/admin`

## Admin Features

### Access the Admin Panel

Visit `/admin` to access the login page.

### Manage Content

The admin dashboard allows you to:

- **Edit all portfolio sections** in both Spanish (es) and English (en):
  - Hero section greeting and introduction
  - About me paragraphs
  - Status/employment information
  - Contact details
  - Featured project information
  - Technologies list
  - Work experience entries
  - Certifications
  - Languages
  - Projects description
  - Footer and metadata

- **Upload and manage documents**:
  - Replace CV files for each language
  - Upload other documents (PDFs, images)
  - Manage document metadata

- **Edit social links and other URLs**

All changes are immediately reflected on the public portfolio page.

## Security

- Admin passwords are **hashed with Argon2** (not encrypted)
- Sessions use **HTTP-only cookies** and are secure by default
- All write/upload operations require authentication
- Credentials are stored in environment variables, not in code
- HTTPS is automatically enabled in production via Traefik

## Database

The system uses **PostgreSQL** with three main tables:

- `content` - Stores all editable portfolio content as JSONB
- `uploads` - Manages uploaded files (CVs, documents)
- `audit_log` - Tracks all changes made through the admin panel

Data is automatically persisted via Docker volumes:

- `postgres_data` - Database files
- `./uploads` - User-uploaded documents
- `./data` - Additional data storage

## API Endpoints

### Public Routes

- `GET /api/content` - Fetch all portfolio content
- `GET /api/content/:id` - Fetch specific section
- `GET /api/uploads` - List all uploaded documents

### Admin Routes (Require Authentication)

- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/logout` - Logout
- `GET /api/auth/status` - Check authentication status
- `PUT /api/content/:id` - Update content section
- `POST /api/uploads` - Upload new document
- `DELETE /api/uploads/:filename` - Delete document
- `POST /api/content/seed` - Seed default content

## Troubleshooting

### Admin login not working

Ensure `ADMIN_PASSWORD_HASH` is set correctly. Regenerate if needed:

```bash
npm run hash-password
```

### Database connection error

Verify `DATABASE_URL` environment variable format:
```
postgres://username:password@host:5432/database
```

### Uploads not saving

Ensure the `uploads` directory exists and has proper permissions:

```bash
mkdir -p uploads
chmod 755 uploads
```

## Development Notes

- The frontend fetches content from `/api/content` on load
- Default content is bundled as fallback if the API is unavailable
- The admin dashboard uses a simple form generator based on content structure
- Components are updated to pull from the `ContentContext` instead of hardcoded values

## Next Steps

1. Set up environment variables in production
2. Generate a secure admin password hash
3. Deploy with Docker Compose
4. Access `/admin` to start managing content
5. (Optional) Set up a backup strategy for PostgreSQL data
