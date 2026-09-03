const { spawn } = require('child_process');
const path = require('path');

class Supervisor {
  constructor(config) {
    this.config = config;
    this.botProcess = null;
    this.isRunning = false;
    this.restartCount = 0;
    this.restartInterval = config.advanced.autoRestartInterval * 60 * 1000;
  }

  start() {
    if (this.isRunning) {
      console.log('[Supervisor] Bot is already running');
      return;
    }

    this.isRunning = true;
    this._spawnBot();

    if (this.restartInterval > 0) {
      setInterval(() => {
        console.log('[Supervisor] Scheduled restart...');
        this._restart();
      }, this.restartInterval);
    }

    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());
  }

  _spawnBot() {
    const botPath = path.join(__dirname, '..', '..', 'bot.js');

    this.botProcess = spawn('node', [botPath], {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    this.botProcess.on('exit', (code) => {
      console.log(`[Supervisor] Bot process exited with code ${code}`);
      this.isRunning = false;

      if (code !== 0) {
        this.restartCount++;
        if (this.restartCount < 5) {
          console.log(`[Supervisor] Restarting bot (attempt ${this.restartCount}/5)...`);
          setTimeout(() => this._spawnBot(), 2000);
        } else {
          console.error('[Supervisor] Max restart attempts reached. Shutting down.');
          process.exit(1);
        }
      } else {
        this.restartCount = 0;
      }
    });

    this.botProcess.on('error', (err) => {
      console.error('[Supervisor] Failed to start bot process:', err.message);
    });
  }

  _restart() {
    if (this.botProcess) {
      this.botProcess.kill('SIGTERM');
      setTimeout(() => this._spawnBot(), 1000);
    }
  }

  stop() {
    console.log('[Supervisor] Stopping bot...');
    this.isRunning = false;

    if (this.botProcess) {
      this.botProcess.kill('SIGTERM');
    }
  }
}

module.exports = Supervisor;
