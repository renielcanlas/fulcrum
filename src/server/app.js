import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {loadDotEnv} from "../config.js";
import {createDemoRepository, createToolRegistry} from "../tools/assessment-tools.js";
import {FakeProvider, OpenAIProvider} from "../ai/provider.js";
import {CopilotOrchestrator} from "../ai/orchestrator.js";
import {AuditLog} from "../audit/audit.js";
import {DEMO_USERS, findDemoUser} from "../auth/demo-users.js";
import {SessionStore, parseCookie} from "../auth/session.js";

loadDotEnv();

const repository = createDemoRepository();
const tools = createToolRegistry(repository);
const audit = new AuditLog();
const provider = process.env.OPENAI_API_KEY ? new OpenAIProvider({apiKey:process.env.OPENAI_API_KEY, model:process.env.OPENAI_MODEL ?? "gpt-5"}) : new FakeProvider([{output_text:"Demo mode: configure OPENAI_API_KEY to enable the OpenAI provider.", output:[]}]);
const copilot = new CopilotOrchestrator({provider, tools, audit});
const sessions = new SessionStore();

const json = (res, status, body) => { res.writeHead(status, {"content-type":"application/json"}); res.end(JSON.stringify(body)); };
const sessionCookie = "fulcrum_session";
const currentUser = req => sessions.get(parseCookie(req.headers.cookie, sessionCookie));
const cookieFlags = `HttpOnly; SameSite=Lax; Path=/${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
const setSessionCookie = (res, value) => res.setHeader("Set-Cookie", `${sessionCookie}=${value}; ${cookieFlags}`);
const clearSessionCookie = res => res.setHeader("Set-Cookie", `${sessionCookie}=; ${cookieFlags}; Max-Age=0`);

export const server = createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/") { res.writeHead(200, {"content-type":"text/html"}); res.end(await readFile(new URL("../../web/index.html", import.meta.url))); return; }
    if (req.method === "GET" && req.url === "/api/demo-users") return json(res, 200, DEMO_USERS.map(({id,displayName,email,role,jiraIdentity}) => ({id,displayName,email,role,jiraIdentity})));
    if (req.method === "GET" && req.url === "/api/session") return json(res, 200, {user:currentUser(req)});
    if (req.method === "POST" && req.url === "/api/session") {
      const body = await new Promise((resolve, reject) => { let raw=""; req.on("data", c => raw += c); req.on("end", () => { try { resolve(JSON.parse(raw)); } catch { reject(new Error("INVALID_JSON")); } }); });
      const user = findDemoUser(body.userId); if (!user) return json(res, 400, {error:"unknown_or_inactive_demo_user"});
      const sid = sessions.create(user); setSessionCookie(res, sid); audit.record({eventType:"UserSessionStarted", actorId:user.id, actorType:"DEMO_PERSONA", userRole:user.role, entityId:user.id}); return json(res, 200, {user});
    }
    if (req.method === "DELETE" && req.url === "/api/session") { const user = currentUser(req); sessions.destroy(parseCookie(req.headers.cookie, sessionCookie)); clearSessionCookie(res); if (user) audit.record({eventType:"UserSessionEnded", actorId:user.id, actorType:"DEMO_PERSONA", entityId:user.id}); return json(res, 200, {ok:true}); }
    if (req.method === "POST" && req.url === "/api/copilot/respond") {
      // Ciel is available without login for the synthetic demo. Keep its identity
      // fixed to a read-only demo analyst when no persona session exists.
      const user = currentUser(req) ?? findDemoUser("analyst-7");
      const body = await new Promise((resolve, reject) => { let raw=""; req.on("data", c => raw += c); req.on("end", () => { try { resolve(JSON.parse(raw)); } catch { reject(new Error("INVALID_JSON")); } }); });
      if (!body.assessmentId || !body.message) return json(res, 400, {error:"assessmentId and message are required"});
      const result = await copilot.respond({interactionId:crypto.randomUUID(), conversationId:body.conversationId ?? crypto.randomUUID(), user, assessmentId:body.assessmentId, message:body.message});
      return json(res, 200, {answer:result.output_text ?? "", raw:result});
    }
    if (req.method === "GET" && req.url === "/api/health") return json(res, 200, {ok:true, provider:provider.constructor.name});
    json(res, 404, {error:"not_found"});
  } catch (error) { json(res, error.message === "FORBIDDEN" ? 403 : 500, {error:error.message}); }
});

if (process.env.NODE_ENV !== "test") { const port = Number(process.env.PORT ?? 3000); server.listen(port, () => console.log(`FULCRUM listening on http://localhost:${port}`)); }
