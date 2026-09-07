'use strict';

const DEFAULTS = Object.freeze({ coins: 0, level: 1, xp: 0, messages: 0, commandsUsed: 0 });

class UserManager {
  constructor(db) { this.db = db; }

  get(userID) {
    const id = String(userID);
    return this.db.data.users.find(user => String(user.userID) === id) || null;
  }

  async ensure(userID, name = '') {
    const id = String(userID);
    let user = this.get(id);
    if (!user) {
      user = { userID: id, name: name || id, ...JSON.parse(JSON.stringify(DEFAULTS)), firstSeen: new Date().toISOString(), lastSeen: new Date().toISOString() };
      this.db.data.users.push(user);
    } else {
      if (name) user.name = name;
      user.lastSeen = new Date().toISOString();
    }
    await this.db.write();
    return user;
  }

  async recordMessage(userID, name = '') {
    const user = await this.ensure(userID, name);
    user.messages += 1;
    user.xp += 1;
    while (user.xp >= user.level * 100) {
      user.xp -= user.level * 100;
      user.level += 1;
    }
    await this.db.write();
    return user;
  }
}

UserManager.DEFAULTS = DEFAULTS;
module.exports = UserManager;
