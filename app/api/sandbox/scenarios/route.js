import {readdir, readFile} from "node:fs/promises";
import {join} from "node:path";
import {runtime} from "../../../../src/server/runtime.js";
import {requireSandbox} from "../../../../src/configuration/feature-access.js";

const scenarioDirectory = join(process.cwd(), "data", "sandbox");

export async function GET() {
  try { await requireSandbox(runtime); } catch (error) { return Response.json({error:error.message}, {status:403}); }
  const names = (await readdir(scenarioDirectory)).filter(name => name.endsWith(".json")).sort();
  const scenarios = await Promise.all(names.map(async fileName => {
    const data = JSON.parse(await readFile(join(scenarioDirectory, fileName), "utf8"));
    return {id: fileName.replace(/\.json$/, ""), fileName, ...data};
  }));
  return Response.json({scenarios});
}
