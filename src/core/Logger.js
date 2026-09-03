const fs = require('fs');
const path = require('path');

const LogLevels = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

class Logger {
  constructor(config) {
    this.config = config;
    this.level = LogLevels[config.logging.level.toUpperCase()] || LogLevels.INFO;
    this.colors = config.logging.colors;
    this.logsDir = path.join(process.cwd(), 'logs');

    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }

    this.logFile = path.join(this.logsDir, `${new Date().toISOString().split('T')[0]}.log`);
  }

  _getTimestamp() {
    return new Date().toISOString();
  }

  _formatMessage(level, message, data = null) {
    const timestamp = this._getTimestamp();
    const msg = typeof message === 'string' ? message : JSON.stringify(message);
    const dataStr = data ? ` | ${typeof data === 'string' ? data : JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level}] ${msg}${dataStr}`;
  }

  _write(level, message, data) {
    const formatted = this._formatMessage(level, message, data);

    try {
      fs.appendFileSync(this.logFile, formatted + '\n', 'utf8');
    } catch (err) {
      console.error('Failed to write to log file:', err.message);
    }
  }

  _getColorCode(level) {
    const codes = {
      DEBUG: '\x1b[36m',
      INFO: '\x1b[32m',
      WARN: '\x1b[33m',
      ERROR: '\x1b[31m',
      RESET: '\x1b[0m',
    };
    return codes[level] || '';
  }

  _log(level, levelNum, message, data) {
    if (levelNum < this.level) return;

    const formatted = this._formatMessage(level, message, data);

    if (this.colors) {
      const color = this._getColorCode(level);
      const reset = this._getColorCode('RESET');
      console.log(`${color}${formatted}${reset}`);
    } else {
      console.log(formatted);
    }

    this._write(level, message, data);
  }

  debug(message, data) {
    this._log('DEBUG', LogLevels.DEBUG, message, data);
  }

  info(message, data) {
    this._log('INFO', LogLevels.INFO, message, data);
  }

  warn(message, data) {
    this._log('WARN', LogLevels.WARN, message, data);
  }

  error(message, data) {
    this._log('ERROR', LogLevels.ERROR, message, data);
  }

  success(message, data) {
    const formatted = this._formatMessage('SUCCESS', message, data);
    const color = '\x1b[32m';
    const reset = '\x1b[0m';
    if (this.colors) {
      console.log(`${color}${formatted}${reset}`);
    } else {
      console.log(formatted);
    }
    this._write('SUCCESS', message, data);
  }
}

module.exports = Logger;
