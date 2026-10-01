import {loadDotEnv} from "../config.js";
import {createDemoRepository, createToolRegistry} from "../tools/assessment-tools.js";
import {AzureOpenAIProvider, FailoverProvider, FakeProvider, FoundryHostedAgentProvider, InstrumentedProvider, OpenAIProvider} from "../ai/provider.js";
import {CopilotOrchestrator} from "../ai/orchestrator.js";
import {AuditLog} from "../audit/audit.js";
import {DEMO_USERS, findDemoUser} from "../auth/demo-users.js";
import {SessionStore} from "../auth/session.js";
import {JiraConnectionStore} from "../integrations/jira-oauth.js";
import {AiTelemetryStore} from "../observability/ai-telemetry.js";
import {createDatabasePersistence} from "../db/persistence.js";
import {ConfigurationStore} from "../configuration/configuration.js";

loadDotEnv();

const repository = createDemoRepository();
const tools = createToolRegistry(repository);
const persistence = createDatabasePersistence();
const audit = new AuditLog({persist: persistence?.saveAuditEvent});
const hostedAgentConfigured = process.env.AZURE_AI_FOUNDRY_AGENT_ENABLED === "true" && process.env.AZURE_AI_FOUNDRY_PROJECT_ENDPOINT && process.env.AZURE_AI_FOUNDRY_AGENT_NAME;
const azureConfigured = process.env.AZURE_AI_FOUNDRY_ENDPOINT && process.env.AZURE_AI_FOUNDRY_API_KEY && process.env.AZURE_AI_FOUNDRY_FAST_DEPLOYMENT;
const openAiFallback = process.env.OPENAI_API_KEY ? new OpenAIProvider({apiKey:process.env.OPENAI_API_KEY, model:process.env.OPENAI_MODEL ?? "gpt-5"}) : null;
const legacyProvider = azureConfigured
    ? new AzureOpenAIProvider({endpoint:process.env.AZURE_AI_FOUNDRY_ENDPOINT, apiKey:process.env.AZURE_AI_FOUNDRY_API_KEY, deployment:process.env.AZURE_AI_FOUNDRY_FAST_DEPLOYMENT, apiVersion:process.env.AZURE_AI_FOUNDRY_API_VERSION ?? "v1"})
    : openAiFallback ?? new FakeProvider([{output_text:"Demo mode: configure Azure AI Foundry or OPENAI_API_KEY to enable AI.", output:[]}]);
const aiTelemetry = new AiTelemetryStore({persist: persistence?.saveAiExecution});
const hostedAgentProvider = hostedAgentConfigured
  ? new FoundryHostedAgentProvider({projectEndpoint:process.env.AZURE_AI_FOUNDRY_PROJECT_ENDPOINT, agentName:process.env.AZURE_AI_FOUNDRY_AGENT_NAME, apiVersion:process.env.AZURE_AI_FOUNDRY_AGENT_API_VERSION ?? "v1", bearerToken:process.env.AZURE_AI_FOUNDRY_AGENT_BEARER_TOKEN, scope:process.env.AZURE_AI_FOUNDRY_AGENT_SCOPE ?? "https://ai.azure.com/.default"})
  : null;
const rawProvider = hostedAgentProvider ? new FailoverProvider({primary:hostedAgentProvider, fallback:openAiFallback ?? legacyProvider}) : legacyProvider;
const provider = new InstrumentedProvider(rawProvider, aiTelemetry);
const cielProvider = provider;
export const runtime = {repository, tools, audit, provider, cielProvider, aiTelemetry, persistence, configuration:new ConfigurationStore({persistence}), copilot:new CopilotOrchestrator({provider, tools, audit}), sessions:new SessionStore({persistence}), jiraConnections:new JiraConnectionStore({persistence})};
export {DEMO_USERS, findDemoUser};
