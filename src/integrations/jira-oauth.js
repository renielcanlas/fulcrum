import {randomBytes} from "node:crypto";

const AUTH_URL = "https://auth.atlassian.com/authorize";
const TOKEN_URL = "https://auth.atlassian.com/oauth/token";
const RESOURCES_URL = "https://api.atlassian.com/oauth/token/accessible-resources";
const SCOPES = "read:jira-work read:jira-user offline_access";
const STATE_TTL_MS = 10 * 60 * 1000;

export class JiraConnectionStore {
  #attempts = new Map();
  #connections = new Map();
  #now;

  constructor({now = () => Date.now()} = {}) { this.#now = now; }
  createState(userId) {
    const state = randomBytes(32).toString("base64url");
    this.#attempts.set(state, {userId, expiresAt: this.#now() + STATE_TTL_MS});
    return state;
  }
  consumeState(state, userId) {
    const attempt = state && this.#attempts.get(state);
    this.#attempts.delete(state);
    if (!attempt || attempt.expiresAt <= this.#now() || attempt.userId !== userId) throw new Error("invalid_oauth_state");
    return attempt;
  }
  set(userId, connection) { this.#connections.set(userId, Object.freeze({...connection})); }
  get(userId) { return this.#connections.get(userId) ?? null; }
  delete(userId) { this.#connections.delete(userId); }
}

export function jiraOAuthConfigured(env = process.env) {
  return Boolean(env.ATLASSIAN_CLIENT_ID && env.ATLASSIAN_CLIENT_SECRET && (env.ATLASSIAN_REDIRECT_URI || env.NEXT_PUBLIC_APP_URL));
}

export function buildAuthorizationUrl({clientId, redirectUri, state}) {
  const url = new URL(AUTH_URL);
  url.searchParams.set("audience", "api.atlassian.com");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("prompt", "consent");
  return url;
}

export async function exchangeCode({code, clientId, clientSecret, redirectUri, fetchImpl = fetch}) {
  const response = await fetchImpl(TOKEN_URL, {
    method: "POST",
    headers: {accept: "application/json", "content-type": "application/json"},
    body: JSON.stringify({grant_type: "authorization_code", client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri})
  });
  if (!response.ok) throw new Error(`jira_token_exchange_failed_${response.status}`);
  return response.json();
}

export async function getAccessibleResources(accessToken, fetchImpl = fetch) {
  const response = await fetchImpl(RESOURCES_URL, {headers: {accept: "application/json", authorization: `Bearer ${accessToken}`} });
  if (!response.ok) throw new Error(`jira_resources_request_failed_${response.status}`);
  return response.json();
}
