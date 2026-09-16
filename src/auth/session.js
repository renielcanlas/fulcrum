import {randomBytes} from "node:crypto";

export class SessionStore {
  #sessions = new Map();
  constructor({ttlMs = 8 * 60 * 60 * 1000, now = () => Date.now(), persistence = null} = {}) { this.ttlMs = ttlMs; this.now = now; this.persistence = persistence; }
  create(user) { const id = randomBytes(32).toString("base64url"); this.#sessions.set(id, {user, expiresAt:this.now() + this.ttlMs}); return id; }
  async createAsync(user) {
    const id = this.create(user);
    if (this.persistence?.saveSession) await this.persistence.saveSession(id, user, this.now() + this.ttlMs);
    return id;
  }
  get(id) { const session = id && this.#sessions.get(id); if (!session || session.expiresAt <= this.now()) { if (id) this.#sessions.delete(id); return null; } return session.user; }
  async getAsync(id) {
    const cached = this.get(id);
    if (cached || !id || !this.persistence?.getSession) return cached;
    const session = await this.persistence.getSession(id, this.now());
    if (!session) return null;
    this.#sessions.set(id, {user:session.user, expiresAt:session.expiresAt});
    return session.user;
  }
  destroy(id) { this.#sessions.delete(id); }
  async destroyAsync(id) { this.destroy(id); if (id && this.persistence?.deleteSession) await this.persistence.deleteSession(id); }
}

export function parseCookie(header = "", name) { const item = header.split(";").map(x => x.trim()).find(x => x.startsWith(`${name}=`)); return item?.slice(name.length + 1) ?? null; }
