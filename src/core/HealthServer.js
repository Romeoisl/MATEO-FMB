'use strict';

const http = require('http');

class HealthServer {
  constructor({ app, logger, port = process.env.PORT || process.env.MATEO_HEALTH_PORT || 0 } = {}) {
    this.app = app;
    this.logger = logger;
    this.port = Number(port) || 0;
    this.server = null;
  }

  _send(res, status, payload) {
    res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
    res.end(JSON.stringify(payload));
  }

  start() {
    if (this.server) return this;
    this.server = http.createServer((req, res) => {
      try {
        const url = new URL(req.url || '/', 'http://localhost');
        if (url.pathname === '/health') return this._send(res, 200, { ok: true, ...this.app.status() });
        if (url.pathname === '/ready') {
          const status = this.app.status();
          const ready = status.status === 'online' && status.connected && status.safety?.status !== 'suspected_suspension';
          return this._send(res, ready ? 200 : 503, { ok: ready, status: status.status, connected: status.connected, safety: status.safety?.status });
        }
        if (url.pathname === '/metrics') return this._send(res, 200, this.app.status().performance);
        if (url.pathname === '/status') return this._send(res, 200, this.app.status());
        return this._send(res, 404, { error: 'not_found' });
      } catch (error) {
        this.logger?.error('Health request failed:', error);
        return this._send(res, 500, { error: 'internal_error' });
      }
    });
    this.server.listen(this.port, () => this.logger.info(`Health server listening on ${this.server.address().port}`));
    return this;
  }

  async stop() {
    if (!this.server) return;
    await new Promise(resolve => this.server.close(resolve));
    this.server = null;
  }
}

module.exports = HealthServer;
