import {randomBytes, scryptSync, timingSafeEqual} from "node:crypto";

const prefix = "scrypt";

export function hashPassword(password, {salt = randomBytes(16)} = {}) {
  const derived = scryptSync(String(password), salt, 64);
  return `${prefix}$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

export function verifyPassword(password, encoded) {
  try {
    const [kind, saltText, hashText] = String(encoded).split("$");
    if (kind !== prefix || !saltText || !hashText) return false;
    const expected = Buffer.from(hashText, "base64url");
    const actual = scryptSync(String(password), Buffer.from(saltText, "base64url"), expected.length);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function demoPasswordHash(env = process.env) {
  return env.FULCRUM_DEMO_PASSWORD_HASH || hashPassword(env.FULCRUM_DEMO_PASSWORD || "genius123!");
}
