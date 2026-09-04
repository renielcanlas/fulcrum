import {loadDotEnv} from "../config.js";
import {createDemoRepository, createToolRegistry} from "../tools/assessment-tools.js";
import {AzureOpenAIProvider, FakeProvider, OpenAIProvider} from "../ai/provider.js";
import {CopilotOrchestrator} from "../ai/orchestrator.js";
import {AuditLog} from "../audit/audit.js";
import {DEMO_USERS, findDemoUser} from "../auth/demo-users.js";
import {SessionStore} from "../auth/session.js";
import {JiraConnectionStore} from "../integrations/jira-oauth.js";

loadDotEnv();

const repository = createDemoRepository();
const tools = createToolRegistry(repository);
const audit = new AuditLog();
const azureConfigured = process.env.AZURE_AI_FOUNDRY_ENDPOINT && process.env.AZURE_AI_FOUNDRY_API_KEY && process.env.AZURE_AI_FOUNDRY_FAST_DEPLOYMENT;
const provider = azureConfigured ? new AzureOpenAIProvider({endpoint:process.env.AZURE_AI_FOUNDRY_ENDPOINT, apiKey:process.env.AZURE_AI_FOUNDRY_API_KEY, deployment:process.env.AZURE_AI_FOUNDRY_FAST_DEPLOYMENT, apiVersion:process.env.AZURE_AI_FOUNDRY_API_VERSION ?? "v1"}) : process.env.OPENAI_API_KEY ? new OpenAIProvider({apiKey:process.env.OPENAI_API_KEY, model:process.env.OPENAI_MODEL ?? "gpt-5"}) : new FakeProvider([{output_text:"Demo mode: configure Azure AI Foundry or OPENAI_API_KEY to enable AI.", output:[]}]);
export const runtime = {repository, tools, audit, provider, copilot:new CopilotOrchestrator({provider, tools, audit}), sessions:new SessionStore(), jiraConnections:new JiraConnectionStore()};
export {DEMO_USERS, findDemoUser};
