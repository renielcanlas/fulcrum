import {randomBytes} from "node:crypto";

export class SessionStore {
  #sessions = new Map();
  constructor({ttlMs = 8 * 60 * 60 * 1000, now = () => Date.now()} = {}) { this.ttlMs = ttlMs; this.now = now; }
  create(user) { const id = randomBytes(32).toString("base64url"); this.#sessions.set(id, {user, expiresAt:this.now() + this.ttlMs}); return id; }
  get(id) { const session = id && this.#sessions.get(id); if (!session || session.expiresAt <= this.now()) { if (id) this.#sessions.delete(id); return null; } return session.user; }
  destroy(id) { this.#sessions.delete(id); }
}

export function parseCookie(header = "", name) { const item = header.split(";").map(x => x.trim()).find(x => x.startsWith(`${name}=`)); return item?.slice(name.length + 1) ?? null; }
