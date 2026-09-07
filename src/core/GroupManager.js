'use strict';

const DEFAULTS = Object.freeze({
  enabled: true,
  prefix: null,
  welcome: true,
  goodbye: true,
  antiSpam: false,
  antiLink: false,
  language: 'en',
  adminIDs: [],
});

class GroupManager {
  constructor(db) { this.db = db; }

  get(threadID) {
    const id = String(threadID);
    const existing = this.db.data.groups.find(group => String(group.threadID) === id);
    return existing || { threadID: id, ...JSON.parse(JSON.stringify(DEFAULTS)) };
  }

  async ensure(threadID, overrides = {}) {
    const id = String(threadID);
    let group = this.db.data.groups.find(item => String(item.threadID) === id);
    if (!group) {
      group = { threadID: id, ...JSON.parse(JSON.stringify(DEFAULTS)), ...overrides };
      this.db.data.groups.push(group);
    } else {
      Object.assign(group, overrides);
    }
    await this.db.write();
    return group;
  }

  async set(threadID, key, value) {
    const group = await this.ensure(threadID);
    if (!(key in DEFAULTS)) throw new Error(`Unknown group setting: ${key}`);
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
    const id = String(userID);
    group.adminIDs = group.adminIDs.filter(item => String(item) !== id);
    await this.db.write();
    return group;
  }
}

GroupManager.DEFAULTS = DEFAULTS;
module.exports = GroupManager;
