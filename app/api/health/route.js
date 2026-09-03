import {runtime} from "../../../src/server/runtime.js";

export function GET() { return Response.json({ok:true, provider:runtime.provider.constructor.name}); }
