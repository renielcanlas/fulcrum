import {runtime} from "../../../src/server/runtime.js";

export const dynamic = "force-dynamic";

export async function GET() {
  const application = (await runtime.configuration.get("application")).config;
  return Response.json({allowSyntheticSandbox: application.allowSyntheticSandbox}, {headers:{"cache-control":"no-store"}});
}
