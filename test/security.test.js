import test from "node:test";
import assert from "node:assert/strict";
import {DEMO_USERS} from "../src/auth/demo-users.js";
import {SessionStore, parseCookie} from "../src/auth/session.js";
import {can, assertCapability} from "../src/auth/authorization.js";
import {AuditLog} from "../src/audit/audit.js";

test("demo identity catalog contains the six synthetic personas", () => {
  assert.equal(DEMO_USERS.length, 6);
  assert.deepEqual([...new Set(DEMO_USERS.map(u => u.role))].sort(), ["FCRM_ANALYST", "PRODUCT_OWNER", "RISK_COMMITTEE"]);
  assert.ok(DEMO_USERS.every(u => u.active && u.email.endsWith("@fulcrum.demo") && u.jiraIdentity?.jiraAccountId));
});

test("sessions are server-side opaque and expire", () => {
  let now = 1000;
  const store = new SessionStore({ttlMs:100, now:() => now});
  const id = store.create({id:"po-1", role:"PRODUCT_OWNER"});
  assert.notEqual(id, "po-1"); assert.equal(store.get(id).role, "PRODUCT_OWNER");
  now += 200; assert.equal(store.get(id), null);
});

test("capabilities are server-side and role-specific", () => {
  const analyst = {id:"a", role:"FCRM_ANALYST"};
  assert.equal(can(analyst, "assessment:decision-ready"), true);
  assert.equal(can(analyst, "committee:decide"), false);
  assert.throws(() => assertCapability(analyst, "committee:decide"), /FORBIDDEN/);
  assert.equal(parseCookie("a=1; fulcrum_session=opaque; b=2", "fulcrum_session"), "opaque");
});

test("audit records redact credentials and assign immutable event identity", () => {
  const audit = new AuditLog();
  audit.record({eventType:"JiraConnected", accessToken:"secret", refreshToken:"secret2", apiKey:"secret3", eventId:"spoofed", timestamp:"spoofed"});
  const event = audit.all()[0];
  assert.ok(event.eventId && event.eventId !== "spoofed");
  assert.equal(event.accessToken, undefined); assert.equal(event.refreshToken, undefined); assert.equal(event.apiKey, undefined);
  assert.notEqual(event.timestamp, "spoofed");
});
