import {randomUUID} from "node:crypto";

export class AuditLog {
  #events = [];
  #persist;

  constructor({persist = null} = {}) { this.#persist = persist; }

  record(event) {
    const safe = {...event};
    delete safe.prompt;
    delete safe.chainOfThought;
    delete safe.accessToken;
    delete safe.refreshToken;
    delete safe.apiKey;
    delete safe.eventId;
    delete safe.timestamp;
    const stored = Object.freeze({
      eventId: randomUUID(),
      interactionId: event.interactionId,
      timestamp: new Date().toISOString(),
      ...safe
    });
    this.#events.push(stored);
    if (this.#persist) void Promise.resolve(this.#persist(stored)).catch(() => {});
    return stored;
  }

  all() { return [...this.#events]; }
}
