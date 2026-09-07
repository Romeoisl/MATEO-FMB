'use strict';

/**
 * Shared response styling for MATEO-FMB.
 * Keeping presentation in one place makes the bot feel consistent without
 * coupling individual commands to a particular feature or service.
 */
class Formatter {
  constructor(config) {
    this.config = config;
  }

  title(text) {
    return `╭─ ${this.config.get('botName', 'MATEO-FMB')} ─╮\n│ ${text}`;
  }

  lines(items = []) {
    return items.map(item => `│ ${item}`).join('\n');
  }

  footer() {
    return `╰─ ${this.config.get('botName', 'MATEO-FMB')} ─╯`;
  }

  box(title, items = []) {
    const body = [this.title(title), this.lines(items), this.footer()];
    return body.filter(Boolean).join('\n');
  }

  command(command) {
    const aliases = command.aliases?.length ? `Aliases: ${command.aliases.join(', ')}` : null;
    const usage = command.usage ? `Usage: ${command.usage}` : null;
    return this.box(command.name, [
      command.description || 'No description provided.',
      usage,
      aliases,
    ].filter(Boolean));
  }

  error(message) {
    return this.box('Error', [message]);
  }
}

module.exports = Formatter;
