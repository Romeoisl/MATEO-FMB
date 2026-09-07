'use strict';

const { EventEmitter } = require('events');

class EventBus extends EventEmitter {
  async dispatch(type, payload) {
    const listeners = this.listeners(type);
    const results = [];
    for (const listener of listeners) {
      results.push(await listener(payload));
    }
    return results;
  }
}

module.exports = EventBus;
