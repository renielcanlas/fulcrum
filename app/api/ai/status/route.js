export const dynamic = "force-dynamic";

export async function GET() {
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
