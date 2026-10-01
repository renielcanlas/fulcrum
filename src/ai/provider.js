import {createExecutionRecord} from "./execution-record.js";
import {DefaultAzureCredential} from "@azure/identity";

export class AIProvider {
  async generateResponse() { throw new Error("NOT_IMPLEMENTED"); }
}

export function normalizePreviousResponseId(value) {
  const candidate = typeof value === "string" ? value.trim() : "";
  return /^[A-Za-z0-9_-]+$/.test(candidate) ? candidate : undefined;
}

export class OpenAIProvider extends AIProvider {
  constructor({apiKey, model = "gpt-5"} = {}) { super(); this.apiKey = apiKey; this.model = model; this.providerName = "openai-compatible"; }

  async generateResponse({instructions, input, tools, text, stream = false, previousResponseId, maxOutputTokens}) {
    if (!this.apiKey) throw new Error("OPENAI_API_KEY is required for OpenAIProvider");
    const normalizedPreviousResponseId = normalizePreviousResponseId(previousResponseId);
    const response = await fetch("https://api.openai.com/v1/responses", {method:"POST", headers:{"content-type":"application/json", authorization:`Bearer ${this.apiKey}`}, body:JSON.stringify({model:this.model, instructions, input, tools, text, stream, ...(Number.isInteger(maxOutputTokens) ? {max_output_tokens: maxOutputTokens} : {}), ...(normalizedPreviousResponseId ? {previous_response_id: normalizedPreviousResponseId} : {})})});
    if (!response.ok) throw new Error(`OPENAI_HTTP_${response.status}`);
    return stream ? response.body : response.json();
  }
}

export class AzureOpenAIProvider extends AIProvider {
  constructor({endpoint, apiKey, deployment, apiVersion = "v1"} = {}) { super(); this.endpoint = endpoint?.replace(/\/$/, ""); this.apiKey = apiKey; this.deployment = deployment; this.model = deployment; this.apiVersion = apiVersion; this.providerName = "azure"; }

  async generateResponse({instructions, input, tools, text, stream = false, previousResponseId, maxOutputTokens}) {
    if (!this.endpoint || !this.apiKey || !this.deployment) throw new Error("AZURE_AI_FOUNDRY configuration is incomplete");
    if (this.apiVersion !== "v1") throw new Error("AZURE_AI_FOUNDRY_API_VERSION must be v1");
    const normalizedPreviousResponseId = normalizePreviousResponseId(previousResponseId);
    const response = await fetch(`${this.endpoint}/openai/v1/responses`, {method: "POST", headers: {accept: "application/json", "content-type": "application/json", "api-key": this.apiKey}, body: JSON.stringify({model: this.deployment, instructions, input, tools, text, stream, ...(Number.isInteger(maxOutputTokens) ? {max_output_tokens: maxOutputTokens} : {}), ...(normalizedPreviousResponseId ? {previous_response_id: normalizedPreviousResponseId} : {})})});
    if (!response.ok) {
      const detail = await response.text();
      let message = "";
      try { message = JSON.parse(detail).error?.message ?? ""; } catch {}
      throw new Error(`AZURE_AI_FOUNDRY_HTTP_${response.status}${message ? `: ${message}` : ""}`);
    }
    return stream ? response.body : response.json();
  }
}

/**
 * Calls a published Microsoft Foundry prompt agent. The agent owns its
 * persisted instructions and indexed knowledge; FULCRUM still owns the
 * request scope, authorization, audit, and any consequential commands.
 */
export class FoundryHostedAgentProvider extends AIProvider {
  constructor({projectEndpoint, agentName, apiVersion = "v1", bearerToken, scope = "https://ai.azure.com/.default", credential, fetchImpl = fetch} = {}) {
    super();
    this.projectEndpoint = projectEndpoint?.replace(/\/$/, "");
    this.agentName = agentName;
    this.apiVersion = apiVersion;
    this.bearerToken = bearerToken;
    this.scope = scope;
    this.credential = credential ?? new DefaultAzureCredential();
    this.fetchImpl = fetchImpl;
    this.providerName = "azure-foundry-agent";
    this.model = agentName;
    this.supportsPreviousResponseId = false;
    this.supportsTools = false;
  }

  async authorizationHeader() {
    if (this.bearerToken) return `Bearer ${this.bearerToken}`;
    const token = await this.credential.getToken(this.scope);
    if (!token?.token) throw new Error("AZURE_AI_FOUNDRY_AGENT_TOKEN_UNAVAILABLE");
    return `Bearer ${token.token}`;
  }

  async generateResponse({input, stream = false, maxOutputTokens} = {}) {
    if (!this.projectEndpoint || !this.agentName) throw new Error("AZURE_AI_FOUNDRY_AGENT configuration is incomplete");
    if (this.apiVersion !== "v1") throw new Error("AZURE_AI_FOUNDRY_AGENT_API_VERSION must be v1");
    const url = `${this.projectEndpoint}/agents/${encodeURIComponent(this.agentName)}/endpoint/protocols/openai/responses?api-version=${encodeURIComponent(this.apiVersion)}`;
    const response = await this.fetchImpl(url, {
      method: "POST",
      headers: {accept: "application/json", "content-type": "application/json", authorization: await this.authorizationHeader()},
      body: JSON.stringify({input, stream, ...(Number.isInteger(maxOutputTokens) ? {max_output_tokens: maxOutputTokens} : {})})
    });
    if (!response.ok) {
      const detail = await response.text();
      let message = "";
      try { message = JSON.parse(detail).error?.message ?? ""; } catch {}
      throw new Error(`AZURE_AI_FOUNDRY_AGENT_HTTP_${response.status}${message ? `: ${message}` : ""}`);
    }
    return stream ? response.body : response.json();
  }
}

function responseTextForFallback(response) {
  if (typeof response?.output_text === "string" && response.output_text.trim()) return response.output_text.trim();
  return (response?.output ?? []).filter((item) => item.type === "message").flatMap((item) => item.content ?? []).map((item) => item.text ?? item.value ?? "").filter(Boolean).join("\n").trim();
}

function structuredResponseIsUsable(response, mode) {
  const candidate = responseTextForFallback(response).replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  let parsed;
  try { parsed = JSON.parse(candidate); } catch { return false; }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return false;
  if (mode === "EVALUATION_JSON") return typeof parsed.summary === "string" && parsed.summary.trim() && typeof parsed.proposedComment === "string" && parsed.proposedComment.trim() && Array.isArray(parsed.checkReviews);
  if (mode === "ACTION_PLAN_JSON") return typeof parsed.intent === "string" && parsed.responsePlan && typeof parsed.responsePlan === "object";
  if (mode === "JIRA_DRAFT_JSON") return typeof parsed.description === "string" && parsed.description.trim();
  return true;
}

export class FailoverProvider extends AIProvider {
  constructor({primary, fallback} = {}) {
    super();
    this.primary = primary;
    this.fallback = fallback;
    this.providerName = `${primary?.providerName ?? "primary"}-with-${fallback?.providerName ?? "no-fallback"}`;
    this.model = primary?.model ?? fallback?.model ?? "unknown";
    this.supportsPreviousResponseId = primary?.supportsPreviousResponseId !== false;
    this.supportsTools = primary?.supportsTools !== false || fallback?.supportsTools === true;
  }

  async generateResponse(request = {}) {
    const requiresLocalTools = Array.isArray(request.tools) && request.tools.length > 0 && this.primary?.supportsTools === false;
    if (requiresLocalTools && this.fallback) return this.fallback.generateResponse(request);
    try {
      const response = await this.primary.generateResponse(request);
      if (request.text?.format?.type === "json_object") {
        const mode = String(request.input ?? "").match(/FULCRUM_MODE=([A-Z_]+)/)?.[1] ?? "";
        if (!structuredResponseIsUsable(response, mode) && this.fallback) return this.fallback.generateResponse(request);
      }
      return response;
    } catch (error) {
      if (!this.fallback) throw error;
      return this.fallback.generateResponse(request);
    }
  }
}

export class FakeProvider extends AIProvider {
  constructor(responses = []) { super(); this.responses = [...responses]; this.calls = []; this.providerName = "fake"; this.model = "fake"; }
  async generateResponse(request) { this.calls.push(request); return this.responses.shift() ?? {output_text:"I need more information.", output:[]}; }
}

export class InstrumentedProvider extends AIProvider {
  constructor(provider, telemetry) {
    super();
    this.provider = provider;
    this.telemetry = telemetry;
    this.model = provider.model;
    this.providerName = provider.providerName ?? provider.constructor.name;
  }

  async generateResponse(request = {}) {
    const {telemetryContext, ...providerRequest} = request;
    const started = Date.now();
    const startedAt = new Date().toISOString();
    try {
      const response = await this.provider.generateResponse(providerRequest);
      this.telemetry?.record(createExecutionRecord({
        context: telemetryContext,
        provider: this.providerName,
        deployment: this.model,
        request: providerRequest,
        response,
        startedAt,
        latencyMs: Date.now() - started,
        status: "SUCCEEDED",
      }));
      return response;
    } catch (error) {
      this.telemetry?.record(createExecutionRecord({
        context: telemetryContext,
        provider: this.providerName,
        deployment: this.model,
        request: providerRequest,
        startedAt,
        latencyMs: Date.now() - started,
        status: "FAILED",
        error,
      }));
      throw error;
    }
  }
}
