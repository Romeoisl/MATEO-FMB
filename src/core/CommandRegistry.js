const fs = require('fs');
const path = require('path');

class CommandRegistry {
  constructor(logger) {
    this.logger = logger;
    this.commands = new Map();
    this.aliases = new Map();
  }

  register(command) {
    if (!command.name) {
      throw new Error('Command must have a name property');
    }

    if (this.commands.has(command.name)) {
      this.logger.warn(`Command "${command.name}" already registered, overwriting`);
    }

    this.commands.set(command.name, command);

    if (command.aliases && Array.isArray(command.aliases)) {
      for (const alias of command.aliases) {
        this.aliases.set(alias, command.name);
      }
    }

    this.logger.debug(`Registered command: ${command.name}`);
  }

  unregister(commandName) {
    if (!this.commands.has(commandName)) {
      return false;
    }

    const command = this.commands.get(commandName);

    if (command.aliases) {
      for (const alias of command.aliases) {
        this.aliases.delete(alias);
      }
    }

    this.commands.delete(commandName);
    this.logger.debug(`Unregistered command: ${commandName}`);
    return true;
  }

  get(commandName) {
    const resolved = this.aliases.get(commandName) || commandName;
    return this.commands.get(resolved);
  }

  getAll() {
    return Array.from(this.commands.values());
  }

  getAllByCategory() {
    const categories = {};

    for (const command of this.commands.values()) {
      const category = command.category || 'other';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(command);
    }

    return categories;
  }

  async loadFromDirectory(dirPath) {
    try {
      if (!fs.existsSync(dirPath)) {
        this.logger.warn(`Command directory not found: ${dirPath}`);
        return 0;
      }

      const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.js'));
      let count = 0;

      for (const file of files) {
        try {
          const filePath = path.join(dirPath, file);
          delete require.cache[require.resolve(filePath)];
          const command = require(filePath);

          this.register(command);
          count++;
        } catch (err) {
          this.logger.error(`Failed to load command from ${file}:`, err.message);
        }
      }

      this.logger.info(`Loaded ${count} commands from ${dirPath}`);
      return count;
    } catch (err) {
      this.logger.error(`Failed to load commands from directory:`, err.message);
      return 0;
    }
  }

  async executeCommand(ctx, commandName) {
    const command = this.get(commandName);

    if (!command) {
      throw new Error(`Command not found: ${commandName}`);
    }

    if (!command.execute || typeof command.execute !== 'function') {
      throw new Error(`Command "${commandName}" has no execute function`);
    }

    try {
      await command.execute(ctx);
    } catch (err) {
      this.logger.error(`Error executing command "${commandName}":`, err.message);
      throw err;
    }
  }

  search(query) {
    const lowerQuery = query.toLowerCase();
    const results = [];

    for (const command of this.commands.values()) {
      if (
        command.name.includes(lowerQuery) ||
        (command.description && command.description.toLowerCase().includes(lowerQuery))
      ) {
        results.push(command);
      }
    }

    return results;
  }
}

module.exports = CommandRegistry;
