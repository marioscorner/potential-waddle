import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const uploadDir = '/tmp/opencode/marioscorner-upload-tests';
process.env.UPLOAD_DIR = uploadDir;

const { getFileMimeType, getTimestampedFilename, getUploadPath } = await import('../server/routes/uploads.js');

test('upload paths are confined to the configured upload directory', () => {
  assert.equal(getUploadPath('cv-es.pdf'), path.join(uploadDir, 'cv-es.pdf'));
  assert.throws(() => getUploadPath('../outside.pdf'), { message: 'Invalid upload path' });
});

test('versioned uploads receive a date-stamped filename', () => {
  assert.match(getTimestampedFilename('hero-photo', 'webp'), /^hero-photo-\d{8}T\d{6}Z-[a-z0-9]{6}\.webp$/);
});

test('upload validation recognizes supported file signatures', async (t) => {
  await fs.mkdir(uploadDir, { recursive: true });
  t.after(() => fs.rm(uploadDir, { recursive: true, force: true }));

  const fixtures = [
    ['document.bin', Buffer.from('%PDF-1.7'), 'application/pdf'],
    ['image.bin', Buffer.from([0xff, 0xd8, 0xff, 0x00]), 'image/jpeg'],
    ['image.bin', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), 'image/png'],
    ['image.bin', Buffer.from('RIFF\x00\x00\x00\x00WEBP', 'binary'), 'image/webp'],
    ['invalid.bin', Buffer.from('not an upload'), null],
  ];

  for (const [filename, content, expectedMime] of fixtures) {
    const filePath = path.join(uploadDir, filename);
    await fs.writeFile(filePath, content);
    assert.equal(await getFileMimeType(filePath), expectedMime);
  }
});
