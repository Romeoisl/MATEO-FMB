const EventEmitter = require('events');

class EventBus extends EventEmitter {
  constructor(logger) {
    super();
    this.logger = logger;
    this.handlers = new Map();
  }

  on(event, handler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event).push(handler);
    super.on(event, handler);
  }

  off(event, handler) {
    if (this.handlers.has(event)) {
      const handlers = this.handlers.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
    super.off(event, handler);
  }

  async emit(event, ...args) {
    this.logger.debug(`Event emitted: ${event}`);
    return super.emit(event, ...args);
  }

  async emitAsync(event, ...args) {
    const handlers = this.handlers.get(event) || [];
    for (const handler of handlers) {
      try {
        await handler(...args);
      } catch (err) {
        this.logger.error(`Error in event handler for "${event}":`, err.message);
      }
    }
  }

  getHandlers(event) {
    return this.handlers.get(event) || [];
  }

  listenerCount(event) {
    return this.handlers.get(event)?.length || 0;
  }
}

module.exports = EventBus;
