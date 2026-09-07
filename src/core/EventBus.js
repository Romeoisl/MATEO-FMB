'use strict';

const { EventEmitter } = require('events');

class EventBus extends EventEmitter {
  async dispatch(type, payload) {
    const listeners = this.listeners(type);
    for (const listener of listeners) {
      await listener(payload);
    }
  }
}

module.exports = EventBus;
