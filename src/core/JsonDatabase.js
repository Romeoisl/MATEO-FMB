'use strict';

const fs = require('fs');
const path = require('path');

const EMPTY_DB = {
  users: [],
  groups: [],
  history: [],
};

class JsonDatabase {
  constructor({ rootDir = process.cwd(), logger } = {}) {
    this.logger = logger;
    this.file = path.join(rootDir, process.env.MATEO_DB_FILE || 'db.json');
    this.data = null;
  }

  async init() {
    await this.read();
    return this;
  }

  async read() {
    if (!fs.existsSync(this.file)) {
      this.data = JSON.parse(JSON.stringify(EMPTY_DB));
      await this.write();
      return this.data;
    }

    try {
      const parsed = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      this.data = {
        ...JSON.parse(JSON.stringify(EMPTY_DB)),
        ...parsed,
      };
    } catch (error) {
      throw new Error(`Invalid database file ${this.file}: ${error.message}`);
    }
    return this.data;
  }

  async write() {
    if (!this.data) this.data = JSON.parse(JSON.stringify(EMPTY_DB));
    const tempFile = `${this.file}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf8');
    fs.renameSync(tempFile, this.file);
  }
}

module.exports = JsonDatabase;
