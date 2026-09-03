const Bot = require('./src/core/Bot');
const Config = require('./src/core/Config');

async function main() {
  const bot = new Bot();

  try {
    await bot.initialize();
  } catch (err) {
    bot.logger.error('Fatal error during initialization:', err.message);
    process.exit(1);
  }

  process.on('SIGINT', async () => {
    await bot.shutdown();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await bot.shutdown();
    process.exit(0);
  });

  process.on('unhandledRejection', (reason, promise) => {
    bot.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (err) => {
    bot.logger.error('Uncaught Exception:', err);
    process.exit(1);
  });
}

main().catch(err => {
  console.error('Failed to start bot:', err.message);
  process.exit(1);
});
