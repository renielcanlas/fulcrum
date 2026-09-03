export class AuditLog {
  #events = [];

  record(event) {
    const safe = {...event};
    delete safe.prompt;
    delete safe.chainOfThought;
    this.#events.push(Object.freeze({
      interactionId: event.interactionId,
      timestamp: new Date().toISOString(),
      ...safe
    }));
  }

  all() { return [...this.#events]; }
}
