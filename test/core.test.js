'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const PermissionManager = require('../src/core/PermissionManager');
const GroupManager = require('../src/core/GroupManager');
const PerformanceManager = require('../src/core/PerformanceManager');
const MessageDelay = require('../src/core/MessageDelay');
const CommandRegistry = require('../src/core/CommandRegistry');
const ConnectionManager = require('../src/core/ConnectionManager');
const SafetyMonitor = require('../src/core/SafetyMonitor');

function fakeConfig(values = {}) {
  return { get(key, fallback) { return values[key] ?? fallback; }, all() { return values; } };
}

function fakeState() {
  const state = new Map();
  return {
    setState(key, value) { state.set(key, value); },
    getState(key, fallback = null) { return state.has(key) ? state.get(key) : fallback; },
    incrementStat(key, amount = 1) { const next = Number(state.get(`stats.${key}`) || 0) + amount; state.set(`stats.${key}`, next); },
  };
}

test('permission hierarchy keeps group admins below bot admins', () => {
  const db = { data: { groups: [{ threadID: 'g1', adminIDs: ['10'] }] } };
  const permissions = new PermissionManager(fakeConfig({ ownerID: '30', adminIDs: ['20'] }), db);
  assert.equal(permissions.levelFor('10', 'g1'), 1);
  assert.equal(permissions.levelFor('20', 'g1'), 2);
  assert.equal(permissions.levelFor('30', 'g1'), 3);
  assert.equal(permissions.levelFor('99', 'g1'), 0);
});

test('group manager creates isolated per-thread defaults', async () => {
  const writes = [];
  const db = { data: { groups: [] }, async write() { writes.push(true); } };
  const groups = new GroupManager(db);
  const group = await groups.ensure('g1');
  assert.equal(group.threadID, 'g1');
  assert.equal(group.enabled, false);
  assert.deepEqual(group.adminIDs, []);
  assert.equal(writes.length, 1);
});

test('performance governor enforces bounded command concurrency and drains in order', async () => {
  const performance = new PerformanceManager({ config: fakeConfig({ 'performance.mode': 'low' }), state: fakeState() });
  const active = { value: 0, max: 0 };
  const started = [];
  const work = id => performance.run(async () => {
    active.value += 1;
    active.max = Math.max(active.max, active.value);
    started.push(id);
    await new Promise(resolve => setTimeout(resolve, 15));
    active.value -= 1;
    return id;
  });
  const results = await Promise.all([work(1), work(2), work(3)]);
  assert.deepEqual(results, [1, 2, 3]);
  assert.equal(active.max, 1);
  assert.deepEqual(started, [1, 2, 3]);
});

test('message delay preserves per-thread order and callback compatibility when disabled', async () => {
  const sent = [];
  const delay = new MessageDelay({ config: fakeConfig({ 'messageDelay.enabled': false }) });
  const api = {
    sendMessage(text, threadID, callback) {
      sent.push(`${threadID}:${text}`);
      callback?.();
    },
  };
  let callbacks = 0;
  await Promise.all([
    delay.send(api, 'one', 'thread', error => { assert.ifError(error); callbacks += 1; }),
    delay.send(api, 'two', 'thread', error => { assert.ifError(error); callbacks += 1; }),
  ]);
  assert.deepEqual(sent, ['thread:one', 'thread:two']);
  assert.equal(callbacks, 2);
  assert.equal(delay.queues.size, 0);
});

test('command registry does not require group approval for direct messages', async () => {
  const sent = [];
  const db = {
    getGroup() { return null; },
    async ensureUser(id) { return { userID: id, commandsUsed: 0 }; },
    async write() {},
  };
  const command = { name: 'ping', aliases: [], category: 'system', role: 0, cooldown: 0, async execute(ctx) { await ctx.reply('pong'); } };
  const registry = new CommandRegistry({
    commandsDir: path.join(os.tmpdir(), 'mateo-no-commands'),
    config: fakeConfig({ prefix: '/', allowedGroups: [] }),
    db,
    permissions: { hasLevel: () => true, levelFor: () => 0, isOwner: () => false },
    logger: { warn() {}, error() {}, info() {} },
    services: { formatter: { box: (title, items) => [title, ...items].join('\n') } },
  });
  registry.commands.set('ping', command);
  const result = await registry.execute({ sendMessage(text) { sent.push(text); } }, { threadID: 'dm1', senderID: 'u1', body: '/ping' });
  assert.equal(result, true);
  assert.deepEqual(sent, ['pong']);
});

test('connection manager rejects missing appstate before login', () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mateo-fmb-'));
  const manager = new ConnectionManager({
    config: fakeConfig({}),
    state: fakeState(),
    events: { dispatch: async () => [] },
    logger: { warn() {}, error() {}, info() {} },
    rootDir,
  });
  assert.throws(() => manager._loadAppState(), error => error instanceof ConnectionManager.AppStateError && error.code === 'MISSING');
  fs.rmSync(rootDir, { recursive: true, force: true });
});

test('safety monitor prefers structured error codes over message regexes', () => {
  const monitor = new SafetyMonitor({ state: fakeState(), logger: { warn() {}, error() {} } });
  assert.equal(monitor.classify({ code: 'RATE_LIMIT', message: 'unrelated text' }), 'rate_limit');
  assert.equal(monitor.classify({ code: 'TIMEOUT', message: 'ordinary timeout wording' }), 'connection');
  assert.equal(monitor.classify({ code: 'SUSPENSION', message: 'account issue' }), 'suspension');
  assert.equal(monitor.classify({ message: 'socket timeout' }), 'connection');
});
