process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.CORS_ORIGINS = 'https://app.example.com';
delete process.env.STUDENT_ID;
delete process.env.STUDENT_PASSWORD;

const test = require('node:test');
const assert = require('node:assert');
const app = require('../src/app');
const { syncDataset } = require('../src/controllers/syncController');

let server;
let base;

test.before(async () => {
    await new Promise(resolve => { server = app.listen(0, '127.0.0.1', resolve); });
    base = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
    await new Promise(resolve => server.close(resolve));
    await require('mongoose').disconnect();
});

test('sync endpoints require a login', async () => {
    for (const path of ['/api/sync', '/sync']) {
        const res = await fetch(`${base}${path}`, { method: 'POST' });
        assert.strictEqual(res.status, 401, path);
    }
});

test('sync refuses to run without configured credentials', async () => {
    let status; let body;
    const res = { status(c) { status = c; return this; }, json(b) { body = b; return this; } };
    await syncDataset({ body: {} }, res, () => {});
    assert.strictEqual(status, 503);
    assert.match(body.message, /STUDENT_ID/);
});
