// Schema validation runs without a database connection.
const test = require('node:test');
const assert = require('node:assert');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Issue = require('../src/models/Issue');

test('User requires name, email and password', () => {
    const err = new User({}).validateSync();
    assert.ok(err.errors.name && err.errors.email && err.errors.password);
});

test('User defaults to an active developer', () => {
    const u = new User({ name: 'A', email: 'a@b.co', password: 'x' });
    assert.strictEqual(u.validateSync(), undefined);
    assert.strictEqual(u.role, 'developer');
    assert.strictEqual(u.status, 'active');
});

test('User rejects an unknown role', () => {
    const err = new User({ name: 'A', email: 'a@b.co', password: 'x', role: 'superuser' }).validateSync();
    assert.ok(err.errors.role);
});

test('comparePassword checks against the stored bcrypt hash', async () => {
    const u = new User({ name: 'A', email: 'a@b.co', password: await bcrypt.hash('s3cret', 4) });
    assert.strictEqual(await u.comparePassword('s3cret'), true);
    assert.strictEqual(await u.comparePassword('nope'), false);
});

test('Issue requires issueId, title and project', () => {
    const err = new Issue({}).validateSync();
    assert.ok(err.errors.issueId && err.errors.title && err.errors.project);
});

test('Issue gets sensible defaults', () => {
    const i = new Issue({ issueId: 'I-1', title: 'Bug', project: new mongoose.Types.ObjectId() });
    assert.strictEqual(i.validateSync(), undefined);
    assert.strictEqual(i.priority, 'medium');
    assert.strictEqual(i.severity, 'minor');
    assert.strictEqual(i.status, 'open');
});

test('Issue rejects invalid enum values', () => {
    const err = new Issue({
        issueId: 'I-2', title: 'x', project: new mongoose.Types.ObjectId(),
        priority: 'urgent', severity: 'huge', status: 'done',
    }).validateSync();
    assert.ok(err.errors.priority && err.errors.severity && err.errors.status);
});
