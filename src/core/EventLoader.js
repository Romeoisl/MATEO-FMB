'use strict';
const fs=require('fs'); const path=require('path');
class EventLoader {
 constructor({eventsDir,bus,logger,apiProvider,services={}}){this.eventsDir=eventsDir;this.bus=bus;this.logger=logger;this.apiProvider=apiProvider;this.services=services;}
 load(){if(!fs.existsSync(this.eventsDir))return this;for(const file of fs.readdirSync(this.eventsDir).filter(f=>f.endsWith('.js'))){const fullPath=path.join(this.eventsDir,file);delete require.cache[require.resolve(fullPath)];try{const mod=require(fullPath);const definitions=mod.default?[mod.default]:[mod];for(const definition of definitions){if(!definition||!definition.eventType||typeof definition.run!=='function'){this.logger.warn(`Skipping invalid event module: ${file}`);continue;}for(const eventType of (Array.isArray(definition.eventType)?definition.eventType:[definition.eventType])){this.bus.on(eventType,async payload=>{await definition.run(payload.api||this.apiProvider(),payload.event||payload,this.services);});this.logger.info(`Registered event ${eventType} from ${file}`);}}}catch(error){this.logger.error(`Failed to load event ${file}:`,error);}}return this;}
}
module.exports=EventLoader;
