import assert from 'node:assert/strict';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { createApp } from '../src/app.js';
import { UserStore } from '../src/storage/userStore.js';

function request(server, method, pathname, body, token) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = {};
    if (payload) {
      headers['content-type'] = 'application/json';
      headers['content-length'] = Buffer.byteLength(payload);
    }
    if (token) {
      headers.authorization = `Bearer ${token}`;
    }

    const clientRequest = http.request({
      host: '127.0.0.1',
      port: server.address().port,
      path: pathname,
      method,
      headers
    }, (response) => {
      let responseBody = '';
      response.on('data', (chunk) => { responseBody += chunk; });
      response.on('end', () => resolve({
        status: response.statusCode,
        body: responseBody ? JSON.parse(responseBody) : null
      }));
    });
    clientRequest.on('error', reject);
    clientRequest.end(payload);
  });
}

async function run() {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'user-auth-api-'));
  const userStore = new UserStore(path.join(directory, 'users.json'));
  await userStore.init();

  const app = createApp({
    config: { jwtSecret: 'a-test-secret-that-is-longer-than-thirty-two-characters', jwtExpiresIn: '1h' },
    userStore
  });
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    const registration = await request(server, 'POST', '/api/auth/register', {
      email: 'ada@example.com',
      password: 'correct-horse-battery-staple'
    });
    assert.equal(registration.status, 201);
    assert.equal(registration.body.user.email, 'ada@example.com');
    assert.ok(registration.body.token);

    const duplicate = await request(server, 'POST', '/api/auth/register', {
      email: 'ada@example.com',
      password: 'correct-horse-battery-staple'
    });
    assert.equal(duplicate.status, 409);

    const login = await request(server, 'POST', '/api/auth/login', {
      email: 'ada@example.com',
      password: 'correct-horse-battery-staple'
    });
    assert.equal(login.status, 200);

    const profile = await request(server, 'GET', '/api/auth/me', null, login.body.token);
    assert.equal(profile.status, 200);
    assert.equal(profile.body.user.email, 'ada@example.com');
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await rm(directory, { force: true, recursive: true });
  }
}

run().then(() => console.log('Authentication API smoke test passed.')).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
