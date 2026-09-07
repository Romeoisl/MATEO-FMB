'use strict';

class ErrorHandler {
  constructor({ logger, state, formatter } = {}) {
    this.logger = logger;
    this.state = state;
    this.formatter = formatter;
  }

  record(error, context = {}) {
    this.state?.incrementStat('errorsEncountered');
    const scope = context.scope ? `[${context.scope}] ` : '';
    this.logger?.error(`${scope}${error?.message || error}`, error);
  }

  response(message = 'Something went wrong while processing that request.') {
    return this.formatter?.error(message) || message;
  }
}

module.exports = ErrorHandler;
