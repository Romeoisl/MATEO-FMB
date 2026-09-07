'use strict';

const URL_RE = /(?:https?:\/\/|www\.)\S+|(?:^|\s)(?:[a-z0-9-]+\.)+(?:com|net|org|io|co|xyz|me|ng)(?:\S*)/i;

class ModerationManager {
  constructor({ db, groups, state } = {}) { this.db = db; this.groups = groups; this.state = state; this.windows = new Map(); }
  _group(threadID) { return this.groups?.get(threadID) || this.db?.getGroup(threadID); }
  _isExempt(userID, threadID) { return (this._group(threadID)?.adminIDs || []).map(String).includes(String(userID)); }

  async inspect(event) {
    if (!event?.threadID || !event?.senderID || !event?.body) return { action: 'allow' };
    const group = this._group(event.threadID);
    if (!group || group.enabled === false || this._isExempt(event.senderID, event.threadID)) return { action: 'allow' };
    if (group.antiLink && URL_RE.test(String(event.body))) return this._recordViolation(event, 'link', 'Links are not allowed in this group.');
    if (group.antiSpam) {
      const limit = Math.max(3, Number(group.antiSpamLimit || 6));
      const windowMs = Math.max(3000, Number(group.antiSpamWindowMs || 10000));
      const key = `${event.threadID}:${event.senderID}`;
      const now = Date.now();
      const recent = (this.windows.get(key) || []).filter(ts => now - ts < windowMs);
      recent.push(now); this.windows.set(key, recent);
      if (recent.length >= limit) { this.windows.set(key, []); return this._recordViolation(event, 'spam', `Slow down. Anti-spam detected ${limit} messages in ${Math.round(windowMs / 1000)}s.`); }
    }
    return { action: 'allow' };
  }

  async _recordViolation(event, type, reason) {
    const user = await this.db.ensureUser(event.senderID, event.senderName || '');
    user.warnings = Number(user.warnings || 0) + 1;
    this.db.data.history.push({ type: `moderation:${type}`, userID: String(event.senderID), threadID: String(event.threadID), timestamp: new Date().toISOString(), reason });
    if (this.db.data.history.length > 5000) this.db.data.history.splice(0, this.db.data.history.length - 5000);
    await this.db.write(); this.state?.incrementStat('moderationActions');
    return { action: 'warn', type, reason, warnings: user.warnings };
  }

  async warn(userID, threadID, actorID, reason = 'Manual warning') {
    const user = await this.db.ensureUser(userID); user.warnings = Number(user.warnings || 0) + 1;
    this.db.data.history.push({ type: 'moderation:warn', userID: String(userID), threadID: String(threadID), actorID: String(actorID || ''), reason, timestamp: new Date().toISOString() });
    await this.db.write(); this.state?.incrementStat('moderationActions'); return user.warnings;
  }
  warnings(userID) { return Number(this.db.getUser(userID)?.warnings || 0); }
  async clearWarnings(userID, threadID, actorID) {
    const user = await this.db.ensureUser(userID); const previous = Number(user.warnings || 0); user.warnings = 0;
    this.db.data.history.push({ type: 'moderation:clearwarnings', userID: String(userID), threadID: String(threadID), actorID: String(actorID || ''), previous, timestamp: new Date().toISOString() });
    await this.db.write(); this.state?.incrementStat('moderationActions'); return previous;
  }
}
module.exports = ModerationManager;
