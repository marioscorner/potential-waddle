import assert from 'node:assert/strict';
import { request } from 'node:http';
import test from 'node:test';
import app from '../server/index.js';

const server = app.listen(0, '127.0.0.1');
await new Promise((resolve) => server.once('listening', resolve));

const send = (path, headers) => new Promise((resolve, reject) => {
  const req = request({ hostname: '127.0.0.1', port: server.address().port, path, headers }, (res) => {
    let body = '';
    res.setEncoding('utf8');
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
  });
  req.on('error', reject);
  req.end();
});

test('Express health and unknown API routes keep their public contract', async () => {
  const health = await send('/health');
  assert.equal(health.status, 200);
  assert.equal(health.headers['content-type'], 'text/html; charset=utf-8');
  assert.equal(health.body, 'healthy\n');

  const response = await send('/api/unknown');
  assert.equal(response.status, 404);
  assert.equal(response.headers['content-type'], 'application/json; charset=utf-8');
  assert.deepEqual(JSON.parse(response.body), { error: 'Not found' });
});

test('www requests are permanently redirected to the canonical host', async () => {
  const response = await send('/es/?source=test', { host: 'www.marioscorner.com' });
  assert.equal(response.status, 301);
  assert.equal(response.headers.location, 'https://marioscorner.com/es/?source=test');

  const root = await send('/', { host: 'www.marioscorner.com' });
  assert.equal(root.status, 301);
  assert.equal(root.headers.location, 'https://marioscorner.com/es/');
});

test('public page aliases redirect directly to their canonical URLs', async (t) => {
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const root = await send('/');
  assert.equal(root.status, 301);
  assert.equal(root.headers.location, 'https://marioscorner.com/es/');

  const english = await send('/en?source=test');
  assert.equal(english.status, 301);
  assert.equal(english.headers.location, 'https://marioscorner.com/en/?source=test');

  const admin = await send('/admin');
  assert.equal(admin.status, 301);
  assert.equal(admin.headers.location, 'https://marioscorner.com/admin/');

  const dashboard = await send('/admin/dashboard/');
  assert.equal(dashboard.status, 302);
  assert.equal(dashboard.headers.location, '/admin/');

  const uploadedCv = await send('/uploads/cv-es.pdf');
  assert.equal(uploadedCv.status, 301);
  assert.equal(uploadedCv.headers.location, 'https://marioscorner.com/cv-es.pdf');
});
