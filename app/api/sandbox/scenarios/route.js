import {readdir, readFile} from "node:fs/promises";
import {join} from "node:path";

const scenarioDirectory = join(process.cwd(), "data", "sandbox");

export async function GET() {
  const names = (await readdir(scenarioDirectory)).filter(name => name.endsWith(".json")).sort();
  const scenarios = await Promise.all(names.map(async fileName => {
    const data = JSON.parse(await readFile(join(scenarioDirectory, fileName), "utf8"));
    return {id: fileName.replace(/\.json$/, ""), fileName, ...data};
  }));
  return Response.json({scenarios});
}
