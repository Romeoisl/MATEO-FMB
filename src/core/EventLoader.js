'use strict';

const fs = require('fs');
const path = require('path');

class EventLoader {
  constructor({ eventsDir, bus, logger, apiProvider }) {
    this.eventsDir = eventsDir;
    this.bus = bus;
    this.logger = logger;
    this.apiProvider = apiProvider;
  }

  load() {
    if (!fs.existsSync(this.eventsDir)) return this;

    const files = fs.readdirSync(this.eventsDir).filter(file => file.endsWith('.js'));
    for (const file of files) {
      const fullPath = path.join(this.eventsDir, file);
      delete require.cache[require.resolve(fullPath)];

      try {
        const mod = require(fullPath);
        const definitions = mod.default ? [mod.default] : [mod];
        for (const definition of definitions) {
          if (!definition?.eventType || typeof definition.run !== 'function') {
            this.logger.warn(`Skipping invalid event module: ${file}`);
            continue;
          }

          this.bus.on(definition.eventType, async payload => {
            await definition.run(payload.api || this.apiProvider(), payload.event || payload);
          });
          this.logger.info(`Registered event ${definition.eventType} from ${file}`);
        }
      } catch (error) {
        this.logger.error(`Failed to load event ${file}:`, error);
      }
    }
    return this;
  }
}

module.exports = EventLoader;
