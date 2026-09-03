import {DEMO_USERS} from "../../../src/server/runtime.js";

export function GET() { return Response.json(DEMO_USERS.map(({id,displayName,email,role,jiraIdentity})=>({id,displayName,email,role,jiraIdentity}))); }
