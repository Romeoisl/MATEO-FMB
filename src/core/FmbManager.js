'use strict';

const RANKS = Object.freeze([
  { id: 'founder', label: 'FMB Founder', minXp: 5000 },
  { id: 'leader', label: 'FMB Leader', minXp: 2500 },
  { id: 'captain', label: 'FMB Captain', minXp: 1200 },
  { id: 'elite', label: 'FMB Elite', minXp: 500 },
  { id: 'member', label: 'FMB Member', minXp: 100 },
  { id: 'recruit', label: 'FMB Recruit', minXp: 0 },
]);
const BADGES = Object.freeze({ founder: 'FMB Founder', verified: 'FMB Verified', veteran: 'FMB Veteran', topContributor: 'FMB Top Contributor' });

class FmbManager {
  constructor({ db, config, permissions, logger } = {}) { Object.assign(this, { db, config, permissions, logger }); this.xpCooldowns = new Map(); }
  get identity() { return this.config.get('fmb', { name: 'FMB', tagline: 'Built for FMB. Powered by its members.', signature: 'MATEO-FMB • FMB', footer: 'Official FMB Bot' }); }
  async ensureMember(userID, name = '') {
    const user = await this.db.ensureUser(userID, name); if (!user) return null;
    if (!user.fmb || typeof user.fmb !== 'object') user.fmb = {};
    Object.assign(user.fmb, { status: 'recruit', verified: false, rank: 'recruit', badges: [], ...user.fmb });
    if (this.permissions?.isOwner(userID)) { user.fmb.status = 'member'; user.fmb.verified = true; user.fmb.rank = 'founder'; if (!user.fmb.badges.includes('founder')) user.fmb.badges.push('founder'); }
    return user;
  }
  rankFor(xp, explicit) { if (explicit && RANKS.some(rank => rank.id === explicit)) return RANKS.find(rank => rank.id === explicit); return RANKS.find(rank => Number(xp || 0) >= rank.minXp) || RANKS[RANKS.length - 1]; }
  async profile(userID) { const user = await this.ensureMember(userID); if (!user) return null; const rank = this.rankFor(user.fmb.xp || 0, user.fmb.rank); user.fmb.rank = rank.id; return { user, rank }; }
  async addXp(userID, amount = 1, reason = 'activity') {
    const user = await this.ensureMember(userID); if (!user) return null;
    const now = Date.now(), key = String(userID), last = this.xpCooldowns.get(key) || 0; if (now - last < 60000) return user;
    this.xpCooldowns.set(key, now); user.fmb.xp = Number(user.fmb.xp || 0) + Math.max(0, Number(amount) || 0);
    if (!['founder','leader','captain'].includes(user.fmb.rank)) user.fmb.rank = this.rankFor(user.fmb.xp).id;
    user.fmb.lastXpReason = reason; user.fmb.lastXpAt = new Date().toISOString(); await this.db.write(); return user;
  }
  async verify(userID) { const user = await this.ensureMember(userID); user.fmb.verified = true; user.fmb.status = 'member'; user.fmb.joinedAt ||= new Date().toISOString(); if (!user.fmb.badges.includes('verified')) user.fmb.badges.push('verified'); await this.db.write(); return user; }
  members() { return (this.db.data?.users || []).filter(user => user.fmb?.status === 'member'); }
  leaderboard(limit = 10) { return [...this.members()].sort((a,b) => Number(b.fmb?.xp||0)-Number(a.fmb?.xp||0)).slice(0, limit); }
  stats() { const members=this.members(); return { members:members.length, verified:members.filter(u=>u.fmb?.verified).length, xp:members.reduce((sum,u)=>sum+Number(u.fmb?.xp||0),0) }; }
  badges() { return BADGES; }
  ranks() { return RANKS; }
}
FmbManager.RANKS = RANKS; FmbManager.BADGES = BADGES; module.exports = FmbManager;
