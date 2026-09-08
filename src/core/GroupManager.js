'use strict';

const DEFAULTS = Object.freeze({
  enabled: false,
  approved: false,
  approvedAt: null,
  approvedBy: null,
  prefix: null,
  welcome: true,
  goodbye: true,
  antiSpam: false,
  antiLink: false,
  antiSpamLimit: 6,
  antiSpamWindowMs: 10000,
  language: 'en',
  adminIDs: [],
});

const clone = value => JSON.parse(JSON.stringify(value));

class GroupManager {
  constructor(db) { this.db = db; }

  get(threadID) {
    const id = String(threadID);
    const existing = this.db.data.groups.find(group => String(group.threadID) === id);
    return existing || { threadID: id, ...clone(DEFAULTS) };
  }

  isApproved(threadID) {
    return this.get(threadID).approved === true;
  }

  async ensure(threadID, overrides = {}) {
    const id = String(threadID);
    let group = this.db.data.groups.find(item => String(item.threadID) === id);
    if (!group) {
      group = { threadID: id, ...clone(DEFAULTS), ...overrides, adminIDs: Array.isArray(overrides.adminIDs) ? overrides.adminIDs.map(String) : [] };
      this.db.data.groups.push(group);
    } else {
      Object.assign(group, overrides);
      group.adminIDs = Array.isArray(group.adminIDs) ? [...new Set(group.adminIDs.map(String))] : [];
      if (typeof group.approved !== 'boolean') group.approved = false;
      if (!Object.prototype.hasOwnProperty.call(group, 'approvedAt')) group.approvedAt = null;
      if (!Object.prototype.hasOwnProperty.call(group, 'approvedBy')) group.approvedBy = null;
    }
    await this.db.write();
    return group;
  }

  async approve(threadID, actorID) {
    const group = await this.ensure(threadID);
    group.approved = true;
    group.enabled = true;
    group.approvedAt = new Date().toISOString();
    group.approvedBy = String(actorID || '');
    await this.db.write();
    return group;
  }

  async revokeApproval(threadID, actorID) {
    const group = await this.ensure(threadID);
    group.approved = false;
    group.enabled = false;
    group.approvedAt = null;
    group.approvedBy = String(actorID || '');
    await this.db.write();
    return group;
  }

  async set(threadID, key, value) {
    if (!(key in DEFAULTS)) throw new Error(`Unknown group setting: ${key}`);
    const group = await this.ensure(threadID);
    if (key === 'adminIDs') value = Array.isArray(value) ? [...new Set(value.map(String))] : [];
    group[key] = value;
    await this.db.write();
    return group;
  }

  async addAdmin(threadID, userID) {
    const group = await this.ensure(threadID);
    const id = String(userID);
    if (!group.adminIDs.map(String).includes(id)) group.adminIDs.push(id);
    await this.db.write();
    return group;
  }

  async removeAdmin(threadID, userID) {
    const group = await this.ensure(threadID);
    group.adminIDs = group.adminIDs.filter(item => String(item) !== String(userID));
    await this.db.write();
    return group;
  }
}

GroupManager.DEFAULTS = DEFAULTS;
module.exports = GroupManager;
