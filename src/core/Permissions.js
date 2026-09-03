class Permissions {
  static LEVELS = {
    USER: 0,
    GROUP_ADMIN: 1,
    BOT_ADMIN: 2,
    OWNER: 3,
  };

  static LEVEL_NAMES = {
    0: 'User',
    1: 'Group Admin',
    2: 'Bot Admin',
    3: 'Owner',
  };

  constructor(config, database) {
    this.config = config;
    this.database = database;
  }

  async getUserLevel(userID, groupID = null) {
    if (userID === this.config.bot.ownerID) {
      return Permissions.LEVELS.OWNER;
    }

    const adminIDs = this.config.get('ADMIN_IDS', '').split(',').filter(id => id.trim());
    if (adminIDs.includes(userID)) {
      return Permissions.LEVELS.BOT_ADMIN;
    }

    if (groupID && this.database) {
      const group = await this.database.getGroup(groupID);
      if (group && group.admins && group.admins.includes(userID)) {
        return Permissions.LEVELS.GROUP_ADMIN;
      }
    }

    return Permissions.LEVELS.USER;
  }

  hasPermission(userLevel, requiredLevel) {
    return userLevel >= requiredLevel;
  }

  getLevelName(level) {
    return Permissions.LEVEL_NAMES[level] || 'Unknown';
  }
}

module.exports = Permissions;
