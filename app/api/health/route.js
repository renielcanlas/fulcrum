import {runtime} from "../../../src/server/runtime.js";
import {checkDatabase} from "../../../src/db/neon.js";

export async function GET() {
  const database = await checkDatabase();
  return Response.json({ok:true, provider:runtime.provider.constructor.name, database});
}
