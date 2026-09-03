import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {createDemoRepository, createToolRegistry} from "../tools/assessment-tools.js";
import {FakeProvider, OpenAIProvider} from "../ai/provider.js";
import {CopilotOrchestrator} from "../ai/orchestrator.js";
import {AuditLog} from "../audit/audit.js";

const repository = createDemoRepository();
const tools = createToolRegistry(repository);
const audit = new AuditLog();
const provider = process.env.OPENAI_API_KEY ? new OpenAIProvider({apiKey:process.env.OPENAI_API_KEY, model:process.env.OPENAI_MODEL ?? "gpt-5"}) : new FakeProvider([{output_text:"Demo mode: configure OPENAI_API_KEY to enable the OpenAI provider.", output:[]}]);
const copilot = new CopilotOrchestrator({provider, tools, audit});

const json = (res, status, body) => { res.writeHead(status, {"content-type":"application/json"}); res.end(JSON.stringify(body)); };
const demoUser = {id:"analyst-7", role:"FCRM_ANALYST"};

export const server = createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/") { res.writeHead(200, {"content-type":"text/html"}); res.end(await readFile(new URL("../../web/index.html", import.meta.url))); return; }
    if (req.method === "POST" && req.url === "/api/copilot/respond") {
      const body = await new Promise((resolve, reject) => { let raw=""; req.on("data", c => raw += c); req.on("end", () => { try { resolve(JSON.parse(raw)); } catch { reject(new Error("INVALID_JSON")); } }); });
      if (!body.assessmentId || !body.message) return json(res, 400, {error:"assessmentId and message are required"});
      const result = await copilot.respond({interactionId:crypto.randomUUID(), conversationId:body.conversationId ?? crypto.randomUUID(), user:demoUser, assessmentId:body.assessmentId, message:body.message});
      return json(res, 200, {answer:result.output_text ?? "", raw:result});
    }
    if (req.method === "GET" && req.url === "/api/health") return json(res, 200, {ok:true, provider:provider.constructor.name});
    json(res, 404, {error:"not_found"});
  } catch (error) { json(res, error.message === "FORBIDDEN" ? 403 : 500, {error:error.message}); }
});

if (process.env.NODE_ENV !== "test") { const port = Number(process.env.PORT ?? 3000); server.listen(port, () => console.log(`FULCRUM listening on http://localhost:${port}`)); }
