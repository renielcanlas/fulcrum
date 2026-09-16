import {readFile} from "node:fs/promises";
import {loadDotEnv} from "../src/config.js";
import {getDatabase} from "../src/db/neon.js";

loadDotEnv();
const sql = getDatabase();
await sql.query("create table if not exists fulcrum_schema_migrations (version text primary key, applied_at timestamptz not null default now())");
for (const version of ["001_initial", "002_oauth_state"]) {
  const migration = await readFile(new URL(`../db/migrations/${version}.sql`, import.meta.url), "utf8");
  const existing = await sql`select version from fulcrum_schema_migrations where version = ${version}`;
  if (existing.length) {
    console.log(`Migration ${version} already applied.`);
    continue;
  }
  for (const statement of migration.split(";").map(item => item.trim()).filter(Boolean)) await sql.query(statement);
  await sql`insert into fulcrum_schema_migrations (version) values (${version})`;
  console.log(`Applied migration ${version}.`);
}
