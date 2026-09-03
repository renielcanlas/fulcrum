import {readFileSync, existsSync} from "node:fs";

export function parseDotEnv(contents) {
  const values = {};
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    values[match[1]] = value;
  }
  return values;
}

export function loadDotEnv(path = ".env") {
  if (!existsSync(path)) return {};
  const values = parseDotEnv(readFileSync(path, "utf8"));
  for (const [key, value] of Object.entries(values)) if (process.env[key] === undefined) process.env[key] = value;
  return values;
}
