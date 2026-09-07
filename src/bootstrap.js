'use strict';

const BotApp = require('./core/BotApp');

async function main() {
  const app = new BotApp({ rootDir: process.cwd() });
  await app.start();
  app.logger.info(`${app.config.get('botName')} started.`);
}

main().catch(error => {
  console.error('[MATEO-FMB] Fatal startup error:', error);
  process.exitCode = 1;
});
