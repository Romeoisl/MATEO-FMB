'use strict';

const BotApp = require('./core/BotApp');

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
  await app.start();
  app.logger.info(`${app.config.get('botName')} started.`);
}

main().catch(error => {
  console.error('[MATEO-FMB] Fatal startup error:', error);
  process.exitCode = 1;
});
