export const dynamic = "force-dynamic";

export async function GET() {
  const hostedAgent = process.env.AZURE_AI_FOUNDRY_AGENT_ENABLED === "true";
  const projectEndpoint = process.env.AZURE_AI_FOUNDRY_PROJECT_ENDPOINT?.replace(/\/$/, "");
  const agentName = process.env.AZURE_AI_FOUNDRY_AGENT_NAME;
  if (hostedAgent) {
    if (!projectEndpoint || !agentName) return Response.json({connected: false, configured: false, provider: "azure_foundry_agent", error: "azure_foundry_agent_configuration_incomplete"});
    try {
      const response = await fetch(`${projectEndpoint}/agents/${encodeURIComponent(agentName)}?api-version=v1`, {
        headers: {accept: "application/json", authorization: await agentAuthorizationHeader()},
        cache: "no-store"
      });
      if (!response.ok) return Response.json({connected: false, configured: true, provider: "azure_foundry_agent", agent: agentName, error: `AZURE_AI_FOUNDRY_AGENT_HTTP_${response.status}`}, {status: 502});
      return Response.json({connected: true, configured: true, provider: "azure_foundry_agent", agent: agentName, projectEndpoint: projectEndpoint.replace(/\/api\/projects\/.*$/, "/api/projects/[configured]")});
    } catch (error) {
      return Response.json({connected: false, configured: true, provider: "azure_foundry_agent", agent: agentName, error: error.message ?? "azure_foundry_agent_health_check_failed"}, {status: 502});
    }
  }
  const endpoint = process.env.AZURE_AI_FOUNDRY_ENDPOINT?.replace(/\/$/, "");
  const deployment = process.env.AZURE_AI_FOUNDRY_FAST_DEPLOYMENT;
  const apiKey = process.env.AZURE_AI_FOUNDRY_API_KEY;
  if (!endpoint || !deployment || !apiKey) return Response.json({connected: false, configured: false, provider: "azure_openai", error: "azure_ai_configuration_incomplete"});
  try {
    const response = await fetch(`${endpoint}/openai/v1/models`, {headers: {accept: "application/json", "api-key": apiKey}, cache: "no-store"});
    if (!response.ok) return Response.json({connected: false, configured: true, provider: "azure_openai", deployment, error: `AZURE_AI_FOUNDRY_HTTP_${response.status}`}, {status: 502});
    return Response.json({connected: true, configured: true, provider: "azure_openai", deployment});
  } catch (error) {
    return Response.json({connected: false, configured: true, provider: "azure_openai", deployment, error: error.message ?? "azure_ai_health_check_failed"}, {status: 502});
  }
}

async function agentAuthorizationHeader() {
  if (process.env.AZURE_AI_FOUNDRY_AGENT_BEARER_TOKEN) return `Bearer ${process.env.AZURE_AI_FOUNDRY_AGENT_BEARER_TOKEN}`;
  const {DefaultAzureCredential} = await import("@azure/identity");
  const credential = new DefaultAzureCredential();
  const token = await credential.getToken(process.env.AZURE_AI_FOUNDRY_AGENT_SCOPE ?? "https://ai.azure.com/.default");
  if (!token?.token) throw new Error("AZURE_AI_FOUNDRY_AGENT_TOKEN_UNAVAILABLE");
  return `Bearer ${token.token}`;
}
