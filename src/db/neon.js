import {neon} from "@neondatabase/serverless";

const connectionString = () => process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? null;

export function databaseConfigured(env = process.env) {
  return Boolean(env.DATABASE_URL ?? env.POSTGRES_URL);
}

export function getDatabase() {
  const url = connectionString();
  if (!url) throw new Error("database_not_configured");
  return neon(url);
}

export async function checkDatabase() {
  if (!databaseConfigured()) return {configured: false, reachable: false};
  try {
    const sql = getDatabase();
    const rows = await sql`select 1 as ok`;
    return {configured: true, reachable: rows[0]?.ok === 1};
  } catch {
    return {configured: true, reachable: false};
  }
}
