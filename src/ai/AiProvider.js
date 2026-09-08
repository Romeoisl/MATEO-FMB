'use strict';

class AiProvider {
  constructor({ axios, config, performance = null }) {
    this.axios = axios;
    this.config = config;
    this.performance = performance;
  }

  async generate({ prompt, context = '' }) {
    const endpoint = this.config.get('ai.endpoint') || process.env.MATEO_AI_ENDPOINT;
    if (!endpoint) throw new Error('AI provider is not configured. Set MATEO_AI_ENDPOINT.');

    const request = () => this.axios.get(endpoint, {
      params: { q: prompt, context },
      timeout: 30000,
    });

    const response = this.performance?.network
      ? await this.performance.network(request, { direction: 'both', estimatedBytes: Buffer.byteLength(`${prompt}\n${context}`, 'utf8') })
      : await request();

    const reply = response.data?.reply ?? response.data?.response ?? response.data?.text;
    if (!reply) throw new Error('AI provider returned no response.');
    return String(reply);
  }
}

module.exports = AiProvider;
