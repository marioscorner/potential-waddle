import assert from 'node:assert/strict';
import { request } from 'node:http';
import test from 'node:test';
import express from 'express';

process.env.ADMIN_USER = 'test-admin';
process.env.ADMIN_PASSWORD = 'test-password';

const createServer = async () => {
  const { default: authRoutes } = await import(`../server/routes/auth.js?test=${crypto.randomUUID()}`);
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.session = {
      authenticated: false,
      user: null,
      destroy: (callback) => callback(null),
    };
    next();
  });
  app.use('/api/auth', authRoutes);

  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  return server;
};

const send = (server, method, path, body) => new Promise((resolve, reject) => {
  const requestBody = body ? JSON.stringify(body) : undefined;
  const req = request({
    hostname: '127.0.0.1',
    port: server.address().port,
    path,
    method,
    headers: requestBody ? { 'content-type': 'application/json', 'content-length': Buffer.byteLength(requestBody) } : undefined,
  }, (res) => {
    let responseBody = '';
    res.setEncoding('utf8');
    res.on('data', (chunk) => { responseBody += chunk; });
    res.on('end', () => resolve({ status: res.statusCode, body: responseBody ? JSON.parse(responseBody) : null }));
  });
  req.on('error', reject);
  req.end(requestBody);
});

const close = (server) => new Promise((resolve) => server.close(resolve));

test('authentication endpoint preserves status, login, and logout contracts', async () => {
  const server = await createServer();
  try {
    assert.deepEqual(await send(server, 'GET', '/api/auth/status'), { status: 200, body: { authenticated: false, user: null } });
    assert.deepEqual(await send(server, 'GET', '/api/auth/me'), { status: 401, body: { error: 'Unauthorized' } });
    assert.deepEqual(await send(server, 'POST', '/api/auth/login', {}), { status: 400, body: { error: 'Username and password required' } });
    assert.deepEqual(await send(server, 'POST', '/api/auth/login', { username: 'wrong', password: 'test-password' }), { status: 401, body: { error: 'Invalid credentials' } });
    assert.deepEqual(await send(server, 'POST', '/api/auth/login', { username: 'test-admin', password: 'test-password' }), { status: 200, body: { success: true, user: 'test-admin' } });
    assert.deepEqual(await send(server, 'POST', '/api/auth/logout'), { status: 200, body: { success: true } });
  } finally {
    await close(server);
  }
});

test('authentication endpoint blocks the eleventh login attempt in its window', async () => {
  const server = await createServer();
  try {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      assert.equal((await send(server, 'POST', '/api/auth/login', { username: 'wrong', password: 'invalid' })).status, 401);
    }
    assert.deepEqual(await send(server, 'POST', '/api/auth/login', { username: 'wrong', password: 'invalid' }), {
      status: 429,
      body: { error: 'Too many login attempts. Try again later.' },
    });
  } finally {
    await close(server);
  }
});
