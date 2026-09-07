'use strict';

class Logger {
  constructor(scope = 'MATEO-FMB') {
    this.scope = scope;
  }

  _write(level, args) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${this.scope}] [${level}]`;
    const method = level === 'ERROR' ? console.error : level === 'WARN' ? console.warn : console.log;
    method(prefix, ...args);
  }

  info(...args) { this._write('INFO', args); }
  warn(...args) { this._write('WARN', args); }
  error(...args) { this._write('ERROR', args); }
  debug(...args) {
    if (process.env.MATEO_DEBUG === '1') this._write('DEBUG', args);
  }
}

module.exports = Logger;
