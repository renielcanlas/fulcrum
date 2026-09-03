import {randomUUID} from "node:crypto";

export class AuditLog {
  #events = [];

  record(event) {
    const safe = {...event};
    delete safe.prompt;
    delete safe.chainOfThought;
    delete safe.accessToken;
    delete safe.refreshToken;
    delete safe.apiKey;
    delete safe.eventId;
    delete safe.timestamp;
    this.#events.push(Object.freeze({
      eventId: randomUUID(),
      interactionId: event.interactionId,
      timestamp: new Date().toISOString(),
      ...safe
    }));
  }

  all() { return [...this.#events]; }
}
