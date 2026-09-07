'use strict';

/**
 * Shared response presentation for MATEO-FMB.
 * Identity lives here so commands stay focused on behavior.
 */
class Formatter {
  constructor(config) {
    this.config = config;
  }

  get name() {
    return this.config.get('botName', 'MATEO-FMB');
  }

  get tagline() {
    return this.config.get('tagline', 'A modern Messenger bot.');
  }

  get separator() {
    return this.config.get('style.separator', '━━━━━━━━━━━━━━━━');
  }

  title(text) {
    return [`╭─ ${this.name}`, `│ ${text}`].join('\n');
  }

  lines(items = []) {
    return items.filter(item => item !== null && item !== undefined && String(item).length > 0)
      .map(item => `│ ${item}`)
      .join('\n');
  }

  footer() {
    const footer = this.config.get('style.footer', this.name);
    return `╰─ ${footer} ─╯`;
  }

  box(title, items = [], { includeTagline = false } = {}) {
    const body = [this.title(title)];
    if (includeTagline && this.tagline) body.push(`│ ${this.tagline}`);
    const rendered = this.lines(items);
    if (rendered) body.push(rendered);
    body.push(this.footer());
    return body.join('\n');
  }

  command(command) {
    const aliases = command.aliases?.length ? `Aliases: ${command.aliases.join(', ')}` : null;
    const usage = command.usage ? `Usage: ${command.usage}` : null;
    return this.box(command.name, [command.description || 'No description provided.', usage, aliases].filter(Boolean));
  }

  error(message) {
    return this.box('Error', [message]);
  }

  info(message) {
    return this.box('Info', [message]);
  }
}

module.exports = Formatter;
