// Run with: npm test  (uses Node's built-in test runner, no extra dependencies)
process.env.NODE_ENV = 'test';
process.env.CORS_ORIGINS = 'https://app.example.com';
process.env.JWT_SECRET = 'test-secret';
delete process.env.SEED_DEMO_USERS;

const test = require('node:test');
const assert = require('node:assert');
const app = require('../src/app');

let server;
let base;

test.before(async () => {
    await new Promise(resolve => {
        server = app.listen(0, '127.0.0.1', resolve);
    });
    base = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
    await new Promise(resolve => server.close(resolve));
    await require('mongoose').disconnect();
});

test('health route responds', async () => {
    const res = await fetch(`${base}/`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual((await res.json()).success, true);
});

test('CORS allows a listed origin', async () => {
    const res = await fetch(`${base}/`, { headers: { Origin: 'https://app.example.com' } });
    assert.strictEqual(res.headers.get('access-control-allow-origin'), 'https://app.example.com');
});

test('CORS does not allow an unlisted origin', async () => {
    const res = await fetch(`${base}/`, { headers: { Origin: 'https://evil.example.com' } });
    assert.strictEqual(res.headers.get('access-control-allow-origin'), null);
});

test('protected routes reject requests without a token', async () => {
    const res = await fetch(`${base}/api/sync`, { method: 'GET' });
    assert.ok([401, 404].includes(res.status), `unexpected status ${res.status}`);
});
