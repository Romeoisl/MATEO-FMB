'use strict';

const fs = require('fs');
const path = require('path');

const EMPTY_DB = { users: [], groups: [], history: [], statistics: { messages: 0, commands: 0, errors: 0 } };
const clone = value => JSON.parse(JSON.stringify(value));

class JsonDatabase {
  constructor({ rootDir = process.cwd(), logger } = {}) {
    this.logger = logger;
    this.file = path.join(rootDir, process.env.MATEO_DB_FILE || 'db.json');
    this.data = null;
  }
  async init() { await this.read(); return this; }
  async read() {
    if (!fs.existsSync(this.file)) { this.data = clone(EMPTY_DB); await this.write(); return this.data; }
    try {
      const parsed = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      this.data = { ...clone(EMPTY_DB), ...parsed };
      if (!Array.isArray(this.data.users)) this.data.users = [];
      if (!Array.isArray(this.data.groups)) this.data.groups = [];
      if (!Array.isArray(this.data.history)) this.data.history = [];
      if (!this.data.statistics || typeof this.data.statistics !== 'object') this.data.statistics = clone(EMPTY_DB.statistics);
    } catch (error) { throw new Error(`Invalid database file ${this.file}: ${error.message}`); }
    return this.data;
  }
  async write() {
    if (!this.data) this.data = clone(EMPTY_DB);
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const tempFile = `${this.file}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf8');
    fs.renameSync(tempFile, this.file);
  }
  getUser(userID) { return this.data?.users?.find(user => String(user.userID) === String(userID)) || null; }
  async ensureUser(userID, name = '') {
    if (!userID) return null;
    let user = this.getUser(userID);
    if (!user) {
      user = { userID: String(userID), name: name || String(userID), coins: 0, level: 1, xp: 0, messages: 0, commandsUsed: 0, firstSeen: new Date().toISOString(), lastSeen: new Date().toISOString() };
      this.data.users.push(user);
    } else { user.lastSeen = new Date().toISOString(); if (name) user.name = name; }
    return user;
  }
  getGroup(threadID) { return this.data?.groups?.find(group => String(group.threadID) === String(threadID)) || null; }
}
module.exports = JsonDatabase;
