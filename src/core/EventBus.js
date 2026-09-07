'use strict';

const { EventEmitter } = require('events');

class EventBus extends EventEmitter {
  async dispatch(type, payload) {
    const listeners = this.listeners(type);
    const results = [];

    for (const listener of listeners) {
      try {
        results.push({ ok: true, value: await listener(payload) });
      } catch (error) {
        results.push({ ok: false, error });
        this.emit('listener:error', { type, error });
      }
    }

    return results;
  }
}

module.exports = EventBus;
