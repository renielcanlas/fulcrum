import {loadDotEnv} from "../config.js";
import {createDemoRepository, createToolRegistry} from "../tools/assessment-tools.js";
import {FakeProvider, OpenAIProvider} from "../ai/provider.js";
import {CopilotOrchestrator} from "../ai/orchestrator.js";
import {AuditLog} from "../audit/audit.js";
import {DEMO_USERS, findDemoUser} from "../auth/demo-users.js";
import {SessionStore} from "../auth/session.js";

loadDotEnv();

const repository = createDemoRepository();
const tools = createToolRegistry(repository);
const audit = new AuditLog();
const provider = process.env.OPENAI_API_KEY ? new OpenAIProvider({apiKey:process.env.OPENAI_API_KEY, model:process.env.OPENAI_MODEL ?? "gpt-5"}) : new FakeProvider([{output_text:"Demo mode: configure OPENAI_API_KEY to enable the OpenAI provider.", output:[]}]);
export const runtime = {repository, tools, audit, provider, copilot:new CopilotOrchestrator({provider, tools, audit}), sessions:new SessionStore()};
export {DEMO_USERS, findDemoUser};
