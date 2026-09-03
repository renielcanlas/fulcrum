import test from "node:test";
import assert from "node:assert/strict";
import {parseDotEnv} from "../src/config.js";

test("dotenv parser supports comments, export, and quoted values", () => {
  assert.deepEqual(parseDotEnv('# comment\nOPENAI_API_KEY="secret"\nexport PORT=3210\nEMPTY='), {OPENAI_API_KEY:"secret", PORT:"3210", EMPTY:""});
});
