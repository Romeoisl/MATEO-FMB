'use strict';

const LEVELS = Object.freeze({ USER: 0, GROUP_ADMIN: 1, BOT_ADMIN: 2, OWNER: 3 });

class PermissionManager {
  constructor(config) {
    this.config = config;
  }

  levelFor(userID, threadID) {
    if (!userID) return LEVELS.USER;
    if (String(this.config.get('ownerID', '')) === String(userID)) return LEVELS.OWNER;
    if ((this.config.get('adminIDs', []) || []).map(String).includes(String(userID))) return LEVELS.BOT_ADMIN;

    const group = (this.config.get('groups', {}) || {})[threadID];
    const groupAdmins = group?.adminIDs || [];
    if (groupAdmins.map(String).includes(String(userID))) return LEVELS.GROUP_ADMIN;

    return LEVELS.USER;
  }

  hasLevel(userID, threadID, requiredLevel) {
    return this.levelFor(userID, threadID) >= requiredLevel;
  }

  isOwner(userID) { return this.levelFor(userID) >= LEVELS.OWNER; }
  isBotAdmin(userID, threadID) { return this.levelFor(userID, threadID) >= LEVELS.BOT_ADMIN; }
  isGroupAdmin(userID, threadID) { return this.levelFor(userID, threadID) >= LEVELS.GROUP_ADMIN; }
}

PermissionManager.LEVELS = LEVELS;
module.exports = PermissionManager;
