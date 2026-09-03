class CommandContext {
  constructor(config, api, message, args, db, permissions, logger) {
    this.config = config;
    this.api = api;
    this.message = message;
    this.args = args;
    this.text = message.body.substring(message.body.indexOf(' ') + 1).trim();
    this.db = db;
    this.permissions = permissions;
    this.logger = logger;

    this.sender = null;
    this.group = null;
    this.userLevel = 0;
  }

  async loadUserData() {
    if (this.db) {
      this.sender = await this.db.getUser(this.message.senderID);
    }
  }

  async loadGroupData() {
    if (this.db && this.message.isGroup) {
      this.group = await this.db.getGroup(this.message.threadID);
    }
  }

  async loadPermissions() {
    if (this.permissions) {
      this.userLevel = await this.permissions.getUserLevel(
        this.message.senderID,
        this.message.threadID
      );
    }
  }

  reply(text, callback = null) {
    return this.api.sendMessage(text, this.message.threadID, callback);
  }

  replyWithAttachment(body, attachment, callback = null) {
    return this.api.sendMessage(
      { body, attachment },
      this.message.threadID,
      callback
    );
  }

  replyPrivate(text, callback = null) {
    return this.api.sendMessage(text, this.message.senderID, callback);
  }

  react(emoji, callback = null) {
    return this.api.setMessageReaction(emoji, this.message.messageID, callback);
  }

  isAdmin() {
    return this.userLevel >= 1;
  }

  isBotAdmin() {
    return this.userLevel >= 2;
  }

  isOwner() {
    return this.userLevel >= 3;
  }

  embed(title, description, color = '#00B0F4') {
    return {
      title,
      description,
      color,
      timestamp: new Date().toISOString(),
    };
  }

  requirePermission(level) {
    if (this.userLevel < level) {
      const requiredLevel = this.permissions.getLevelName(level);
      throw new Error(`This command requires ${requiredLevel} permission`);
    }
  }

  async run() {
    await this.loadUserData();
    await this.loadGroupData();
    await this.loadPermissions();
  }
}

module.exports = CommandContext;
