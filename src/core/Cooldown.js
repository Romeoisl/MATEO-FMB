class Cooldown {
  constructor() {
    this.cooldowns = new Map();
  }

  set(key, ms) {
    this.cooldowns.set(key, Date.now() + ms);
  }

  get(key) {
    const time = this.cooldowns.get(key);
    if (!time) return 0;

    const remaining = time - Date.now();
    if (remaining <= 0) {
      this.cooldowns.delete(key);
      return 0;
    }

    return remaining;
  }

  has(key) {
    return this.get(key) > 0;
  }

  clear(key) {
    this.cooldowns.delete(key);
  }

  clearAll() {
    this.cooldowns.clear();
  }
}

module.exports = Cooldown;
