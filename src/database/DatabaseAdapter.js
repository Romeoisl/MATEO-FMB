class DatabaseAdapter {
  async connect() {
    throw new Error('connect() not implemented');
  }

  async disconnect() {
    throw new Error('disconnect() not implemented');
  }

  async getUser(userID) {
    throw new Error('getUser() not implemented');
  }

  async saveUser(user) {
    throw new Error('saveUser() not implemented');
  }

  async getGroup(groupID) {
    throw new Error('getGroup() not implemented');
  }

  async saveGroup(group) {
    throw new Error('saveGroup() not implemented');
  }

  async getAllUsers() {
    throw new Error('getAllUsers() not implemented');
  }

  async getAllGroups() {
    throw new Error('getAllGroups() not implemented');
  }

  async deleteUser(userID) {
    throw new Error('deleteUser() not implemented');
  }

  async deleteGroup(groupID) {
    throw new Error('deleteGroup() not implemented');
  }

  async getUsersByCoins(limit = 10) {
    throw new Error('getUsersByCoins() not implemented');
  }

  async getUsersByLevel(limit = 10) {
    throw new Error('getUsersByLevel() not implemented');
  }
}

module.exports = DatabaseAdapter;
