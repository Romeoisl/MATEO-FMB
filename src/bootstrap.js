'use strict';

const BotApp = require('./core/BotApp');
const ConnectionManager = require('./core/ConnectionManager');

function printBanner() {
  const banner = [
    '',
    '╔══════════════════════════════════════════════════╗',
    '║                                                  ║',
    '║                  M A T E O - F M B             ║',
    '║                                                  ║',
    '║            Facebook Messenger Bot               ║',
    '║              Modular • Reliable • Fast          ║',
    '║                                                  ║',
    '╚══════════════════════════════════════════════════╝',
    '',
  ].join('\n');

  process.stdout.write(`${banner}\n`);
}

async function main() {
  printBanner();

  const app = new BotApp({ rootDir: process.cwd() });

  try {
    await app.start();
    app.logger.info(`${app.config.get('botName')} started.`);
  } catch (error) {
    if (error instanceof ConnectionManager.AppStateError) {
      console.log('[MATEO-FMB] AppState missing. Shutting down.');
      await app.shutdown('missing-appstate').catch(() => {});
      return;
    }

    console.error('[MATEO-FMB] Fatal startup error:', error.message || error);
    await app.shutdown('startup-failure').catch(() => {});
    process.exitCode = 1;
  }
}

main();
