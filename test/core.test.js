'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const PermissionManager = require('../src/core/PermissionManager');
const GroupManager = require('../src/core/GroupManager');

function fakeConfig(values={}) { return { get(key, fallback) { return values[key] ?? fallback; } }; }

test('permission hierarchy keeps group admins below bot admins', () => {
  const db={data:{groups:[{threadID:'g1',adminIDs:['10']}]}};
  const permissions=new PermissionManager(fakeConfig({ownerID:'30',adminIDs:['20']}),db);
  assert.equal(permissions.levelFor('10','g1'),1);
  assert.equal(permissions.levelFor('20','g1'),2);
  assert.equal(permissions.levelFor('30','g1'),3);
  assert.equal(permissions.levelFor('99','g1'),0);
});

test('group manager creates isolated per-thread defaults', async () => {
  const writes=[]; const db={data:{groups:[]},async write(){writes.push(true);}};
  const groups=new GroupManager(db); const group=await groups.ensure('g1');
  assert.equal(group.threadID,'g1'); assert.equal(group.enabled,false); assert.deepEqual(group.adminIDs,[]); assert.equal(writes.length,1);
});
