# File Upload Feature - Complete Implementation

## Overview

The admin dashboard now has a fully functional **Uploads** section that allows you to upload and manage files (CVs, documents, certificates, etc.) in multiple languages.

## Features

### Upload Management
- **Upload Tab**: Navigate to the "uploads" section in the admin dashboard sidebar
- **Document Types**: 
  - CV
  - Resume
  - Document
  - Certificate
- **Languages**: English (en) and Spanish (es)
- **Supported Formats**: PDF, JPEG, PNG, WebP
- **File Size Limit**: 10MB maximum

### File Organization
Files are automatically renamed to a standardized format: `{documentType}-{language}.{ext}`

Examples:
- `cv-en.pdf` (English CV)
- `cv-es.pdf` (Spanish CV)
- `resume-en.jpg` (English Resume as JPEG)
- `document-es.pdf` (Spanish Document)

### Key Features
1. **Automatic Replacement**: Uploading a new file with the same document type and language automatically replaces the old one
2. **File Metadata**: System preserves the original filename in the database
3. **Download**: Users can download files directly from the uploads list
4. **Delete**: Authenticated users can delete files from the uploads section
5. **Real-time Updates**: Upload list refreshes automatically after changes

## How to Use

### Uploading a File

1. **Log in** to the admin panel at `http://localhost:3000/admin`
   - Username: `admin`
   - Password: `SecureAdminPassword123!`

2. **Click the "uploads" tab** in the sidebar

3. **Select Options**:
   - **Document Type**: Choose from CV, Resume, Document, or Certificate
   - **Language**: Choose English or Spanish

4. **Click "Choose File"** and select your file (PDF, JPEG, PNG, or WebP)

5. **File is automatically uploaded** and appears in the uploaded files list

### Downloading a File

- Click the **"Download"** button next to any file in the list
- The file will download with its standardized name

### Deleting a File

- Click the **"Delete"** button next to the file
- Confirm the deletion
- File is removed from the server and database

## API Endpoints

### GET /api/uploads
Returns a list of all uploaded files

**Response Example:**
```json
[
  {
    "id": "6acb3bdd-946f-455a-90eb-562ed1005fcf",
    "filename": "cv-en.pdf",
    "original_name": "my-cv.pdf",
    "mime_type": "application/pdf",
    "size": 245000,
    "url": "/uploads/cv-en.pdf",
    "language": "en",
    "document_type": "cv",
    "created_at": "2026-05-16T19:40:46.638Z"
  }
]
```

### POST /api/uploads (Authenticated)
Upload a new file

**Required Fields**:
- `file` - Form file input
- `language` - "en" or "es"
- `documentType` - Document type (cv, resume, document, certificate)

**Example**:
```bash
curl -X POST http://localhost:3000/api/uploads \
  -F "file=@my-cv.pdf" \
  -F "language=en" \
  -F "documentType=cv" \
  -b "session_cookie"
```

### DELETE /api/uploads/:filename (Authenticated)
Delete a file by filename

**Example**:
```bash
curl -X DELETE http://localhost:3000/api/uploads/cv-en.pdf \
  -b "session_cookie"
```

## Technical Implementation

### Frontend (React)
- **File Input**: HTML5 file input with validation
- **Language Selection**: Dropdown selector
- **Document Type**: Dropdown selector
- **Upload Progress**: Shows "Uploading..." while request in progress
- **Error Handling**: User-friendly error messages
- **File List**: Auto-refreshing list with download/delete buttons

### Backend (Express)
- **Multer**: Handles file uploads with size and type validation
- **File Renaming**: Automatic standardization to `{type}-{language}.{ext}`
- **Old File Cleanup**: Automatically deletes previous file when replacing
- **Authentication**: Requires admin session for uploads/deletions
- **Database**: Stores file metadata in PostgreSQL `uploads` table
- **Static Serving**: Files served directly from `/uploads` directory

### Database Schema
```sql
CREATE TABLE uploads (
  id UUID PRIMARY KEY,
  filename TEXT NOT NULL UNIQUE,      -- Standardized name (cv-en.pdf)
  original_name TEXT NOT NULL,        -- Original upload name
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  url TEXT NOT NULL,
  language TEXT NOT NULL,             -- 'en' or 'es'
  document_type TEXT NOT NULL,        -- 'cv', 'resume', 'document', 'certificate'
  created_at TIMESTAMPTZ
);
```

## Security Features

- **Authentication Required**: Only logged-in admins can upload/delete files
- **File Type Validation**: Only PDF and image formats allowed
- **Size Validation**: 10MB maximum file size enforced
- **Filename Sanitization**: Files automatically renamed to safe, standardized names
- **Original Name Preservation**: Original filename stored separately for reference
- **Access Control**: Files are served publicly but can only be managed by admins

## File Structure

```
my-digital-canvas/
├── uploads/                          # Directory where files are stored
│   ├── cv-en.pdf
│   ├── cv-es.pdf
│   ├── resume-en.jpg
│   └── ...
├── server/
│   ├── routes/
│   │   └── uploads.js               # Upload handling logic
│   └── db/
│       └── queries.js               # Database operations
└── src/
    └── pages/
        └── AdminDashboard.tsx       # Upload UI component
```

## Troubleshooting

### File upload fails
1. Check file format (PDF, JPEG, PNG, WebP only)
2. Verify file size is under 10MB
3. Ensure you're logged in
4. Check browser console for error messages

### File doesn't appear in list
1. Refresh the page or click uploads tab again
2. Check that the file was actually uploaded
3. Verify database is connected

### Can't download uploaded file
1. Check that the file exists in `/uploads` directory
2. Verify file permissions allow reading
3. Check browser network tab for actual error

### File upload replaces previous file
This is intentional behavior! When uploading a file with the same document type and language, the old file is automatically deleted. This prevents having multiple versions.

## Future Enhancements

Possible improvements:
- Drag-and-drop upload interface
- Progress bar for large file uploads
- File preview before upload
- Version history/backup of replaced files
- Batch upload multiple files
- File compression for images
- Integration with download link in CV section

## Testing

To test the upload functionality:

1. **Test Upload**:
   ```bash
   curl -X POST http://localhost:3000/api/uploads \
     -F "file=@path/to/file.pdf" \
     -F "language=en" \
     -F "documentType=cv" \
     -b "connect.sid=YOUR_SESSION_ID"
   ```

2. **List Uploads**:
   ```bash
   curl http://localhost:3000/api/uploads
   ```

3. **Download File**:
   ```bash
   curl http://localhost:3000/uploads/cv-en.pdf -O
   ```

4. **Delete File**:
   ```bash
   curl -X DELETE http://localhost:3000/api/uploads/cv-en.pdf \
     -b "connect.sid=YOUR_SESSION_ID"
   ```

---

**Status**: ✅ Fully Functional and Tested
**Last Updated**: May 16, 2026
