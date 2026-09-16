const DEFAULTS = Object.freeze({
  risk: {id: "FULCRUM-SYNTH-CONFIG-1.2", mitigationScale: 18, thresholds: {mediumMax: 49, highMin: 70}},
  assessments: {proceedThreshold: 80, automaticPercent: 25, aiPercent: 75},
  application: {demoSessionMinutes: 15, allowSyntheticSandbox: true},
  integrations: {jiraProjectKey: "FCRM", jiraSiteUrl: "https://geniushacks.atlassian.net", jiraBoardId: 2, jiraOAuthEnabled: true, documentIntelligenceEnabled: true},
});

const integer = (value, fallback, min, max) => {
  const number = Number(value);
  return Number.isInteger(number) && number >= min && number <= max ? number : fallback;
};

export function defaultConfiguration() {
  return structuredClone(DEFAULTS);
}

export function normalizeConfiguration(section, input) {
  if (!Object.hasOwn(DEFAULTS, section) || !input || typeof input !== "object" || Array.isArray(input)) throw new Error("unknown_configuration_section");
  if (section === "risk") {
    const highMin = integer(input.thresholds?.highMin, DEFAULTS.risk.thresholds.highMin, 5, 95);
    const mediumMax = integer(input.thresholds?.mediumMax, DEFAULTS.risk.thresholds.mediumMax, 5, 90);
    if (highMin < mediumMax + 5) throw new Error("risk_thresholds_must_leave_five_point_medium_band");
    return {id: String(input.id || DEFAULTS.risk.id).slice(0, 80), mitigationScale: integer(input.mitigationScale, DEFAULTS.risk.mitigationScale, 0, 50), thresholds: {mediumMax, highMin}};
  }
  if (section === "assessments") {
    const automaticPercent = integer(input.automaticPercent, DEFAULTS.assessments.automaticPercent, 0, 100);
    return {proceedThreshold: integer(input.proceedThreshold ?? input.intakeProceedThreshold, DEFAULTS.assessments.proceedThreshold, 0, 100), automaticPercent, aiPercent: 100 - automaticPercent};
  }
  if (section === "application") return {demoSessionMinutes: integer(input.demoSessionMinutes ?? (input.demoSessionHours ? Number(input.demoSessionHours) * 60 : undefined), DEFAULTS.application.demoSessionMinutes, 1, 24 * 60), allowSyntheticSandbox: Boolean(input.allowSyntheticSandbox)};
  const projectKey = String(input.jiraProjectKey || DEFAULTS.integrations.jiraProjectKey).toUpperCase();
  if (!/^[A-Z][A-Z0-9_]{1,9}$/.test(projectKey)) throw new Error("invalid_jira_project_key");
  return {jiraProjectKey: projectKey, jiraSiteUrl: String(input.jiraSiteUrl || DEFAULTS.integrations.jiraSiteUrl).slice(0, 200), jiraBoardId: integer(input.jiraBoardId, DEFAULTS.integrations.jiraBoardId, 1, 100000), jiraOAuthEnabled: Boolean(input.jiraOAuthEnabled), documentIntelligenceEnabled: Boolean(input.documentIntelligenceEnabled)};
}

export class ConfigurationStore {
  #cache = new Map();
  constructor({persistence = null} = {}) { this.persistence = persistence; }
  async getAll() {
    const result = defaultConfiguration();
    for (const section of Object.keys(result)) {
      const stored = await this.get(section);
      if (stored) result[section] = stored.config;
    }
    return result;
  }
  async get(section) {
    if (this.#cache.has(section)) return this.#cache.get(section);
    const stored = this.persistence?.getConfiguration ? await this.persistence.getConfiguration(section) : null;
    const config = normalizeConfiguration(section, stored?.config ?? defaultConfiguration()[section]);
    const result = {config, version: stored?.version ?? 1, updatedBy: stored?.updatedBy ?? null, updatedAt: stored?.updatedAt ?? null};
    this.#cache.set(section, result);
    return result;
  }
  async set(section, input, updatedBy) {
    const config = normalizeConfiguration(section, input);
    const saved = this.persistence?.saveConfiguration ? await this.persistence.saveConfiguration(section, config, updatedBy) : {version: (this.#cache.get(section)?.version ?? 0) + 1, updatedAt: new Date().toISOString()};
    const result = {config, ...saved, updatedBy: updatedBy ?? null};
    this.#cache.set(section, result);
    return result;
  }
}
