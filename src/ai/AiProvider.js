'use strict';

class AiProvider {
  constructor({ axios, config }) { this.axios = axios; this.config = config; }
  async generate({ prompt, context = '' }) {
    const endpoint = this.config.get('ai.endpoint') || process.env.MATEO_AI_ENDPOINT;
    if (!endpoint) throw new Error('AI provider is not configured. Set MATEO_AI_ENDPOINT.');
    const response = await this.axios.get(endpoint, { params: { q: prompt, context } });
    const reply = response.data?.reply ?? response.data?.response ?? response.data?.text;
    if (!reply) throw new Error('AI provider returned no response.');
    return String(reply);
  }
}
module.exports = AiProvider;
