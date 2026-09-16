import {createCipheriv, createDecipheriv, randomBytes} from "node:crypto";
import {databaseConfigured, getDatabase} from "./neon.js";

function encryptionKey(env = process.env) {
  const raw = env.FULCRUM_DATA_ENCRYPTION_KEY;
  if (!raw) return null;
  const key = /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64");
  return key.length === 32 ? key : null;
}

function encrypt(value, key) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${ciphertext.toString("base64url")}`;
}

function decrypt(value, key) {
  const [ivText, tagText, ciphertextText] = String(value).split(".");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivText, "base64url"));
  decipher.setAuthTag(Buffer.from(tagText, "base64url"));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(ciphertextText, "base64url")), decipher.final()]).toString("utf8"));
}

export function createDatabasePersistence({env = process.env, sql = databaseConfigured(env) ? getDatabase() : null} = {}) {
  if (!sql) return null;
  const key = encryptionKey(env);
  return {
    async saveAuditEvent(event) {
      await sql`insert into fulcrum_audit_events (event_id, interaction_id, event_type, actor_id, actor_type, entity_id, occurred_at, payload)
        values (${event.eventId}, ${event.interactionId ?? null}, ${event.eventType ?? "UNKNOWN"}, ${event.actorId ?? null}, ${event.actorType ?? null}, ${event.entityId ?? null}, ${event.timestamp}, ${JSON.stringify(event)})
        on conflict (event_id) do nothing`;
    },
    async saveAiExecution(record) {
      await sql`insert into fulcrum_ai_execution_records (run_id, correlation_id, task, provider, status, occurred_at, record)
        values (${record.runId}, ${record.correlationId ?? null}, ${record.task}, ${record.provider}, ${record.status}, ${record.startedAt}, ${JSON.stringify(record)})
        on conflict (run_id) do update set record = excluded.record, status = excluded.status`;
    },
    async saveJiraConnection(userId, connection) {
      if (!key) throw new Error("FULCRUM_DATA_ENCRYPTION_KEY_REQUIRED");
      await sql`insert into fulcrum_jira_connections (user_id, connection, updated_at)
        values (${userId}, ${encrypt(connection, key)}, now())
        on conflict (user_id) do update set connection = excluded.connection, updated_at = now()`;
    },
    async getJiraConnection(userId) {
      if (!key) return null;
      const rows = await sql`select connection from fulcrum_jira_connections where user_id = ${userId}`;
      return rows[0] ? decrypt(rows[0].connection, key) : null;
    },
    async deleteJiraConnection(userId) {
      await sql`delete from fulcrum_jira_connections where user_id = ${userId}`;
    },
    async saveOAuthState(state, attempt) {
      await sql`insert into fulcrum_oauth_states (state, user_id, metadata, expires_at)
        values (${state}, ${attempt.userId}, ${JSON.stringify(attempt)}, ${new Date(attempt.expiresAt).toISOString()})
        on conflict (state) do update set metadata = excluded.metadata, expires_at = excluded.expires_at`;
    },
    async consumeOAuthState(state, userId, now = new Date()) {
      const rows = await sql`delete from fulcrum_oauth_states
        where state = ${state} and user_id = ${userId} and expires_at > ${now.toISOString()}
        returning metadata`;
      return rows[0]?.metadata ?? null;
    }
  };
}

export {encryptionKey};
