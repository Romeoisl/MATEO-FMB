const fs = require('fs');
const path = require('path');
const DatabaseAdapter = require('./DatabaseAdapter');

class JSONAdapter extends DatabaseAdapter {
  constructor(config, logger) {
    super();
    this.config = config;
    this.logger = logger;
    this.dataDir = path.join(process.cwd(), 'data');
    this.dbPath = path.join(this.dataDir, 'database.json');
    this.data = { users: [], groups: [] };
  }

  async connect() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      if (fs.existsSync(this.dbPath)) {
        this.data = JSON.parse(fs.readFileSync(this.dbPath, 'utf8'));
      } else {
        await this._save();
      }

      this.logger.info('JSON database connected');
      return true;
    } catch (err) {
      this.logger.error('Failed to connect to database:', err.message);
      throw err;
    }
  }

  async disconnect() {
    await this._save();
    this.logger.info('JSON database disconnected');
  }

  async _save() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      this.logger.error('Failed to save database:', err.message);
    }
  }

  async getUser(userID) {
    const user = this.data.users.find(u => u.id === userID);
    return user || null;
  }

  async saveUser(user) {
    const index = this.data.users.findIndex(u => u.id === user.id);
    if (index > -1) {
      this.data.users[index] = user;
    } else {
      this.data.users.push(user);
    }
    await this._save();
  }

  async getGroup(groupID) {
    const group = this.data.groups.find(g => g.id === groupID);
    return group || null;
  }

  async saveGroup(group) {
    const index = this.data.groups.findIndex(g => g.id === group.id);
    if (index > -1) {
      this.data.groups[index] = group;
    } else {
      this.data.groups.push(group);
    }
    await this._save();
  }

  async getAllUsers() {
    return [...this.data.users];
  }

  async getAllGroups() {
    return [...this.data.groups];
  }

  async deleteUser(userID) {
    const index = this.data.users.findIndex(u => u.id === userID);
    if (index > -1) {
      this.data.users.splice(index, 1);
      await this._save();
      return true;
    }
    return false;
  }

  async deleteGroup(groupID) {
    const index = this.data.groups.findIndex(g => g.id === groupID);
    if (index > -1) {
      this.data.groups.splice(index, 1);
      await this._save();
      return true;
    }
    return false;
  }

  async getUsersByCoins(limit = 10) {
    return this.data.users
      .sort((a, b) => (b.coins || 0) - (a.coins || 0))
      .slice(0, limit);
  }

  async getUsersByLevel(limit = 10) {
    return this.data.users
      .sort((a, b) => (b.level || 1) - (a.level || 1))
      .slice(0, limit);
  }
}

module.exports = JSONAdapter;
