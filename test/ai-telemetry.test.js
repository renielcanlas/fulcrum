import assert from "node:assert/strict";
import test from "node:test";
import {FakeProvider, InstrumentedProvider} from "../src/ai/provider.js";
import {AiTelemetryStore} from "../src/observability/ai-telemetry.js";

test("instrumented provider records safe model usage and timing metadata", async () => {
  const telemetry = new AiTelemetryStore();
  const provider = new InstrumentedProvider(
    new FakeProvider([{output_text:"Synthetic answer", usage:{input_tokens:12, output_tokens:5, total_tokens:17}}]),
    telemetry,
  );
  const response = await provider.generateResponse({
    instructions: "private instruction text",
    input: [{role:"user", content:"private question"}],
    tools: [{name:"getRiskScores"}],
    telemetryContext: {interactionId:"interaction-1", task:"fulcrum-assistant.v1", assessmentId:"FA-2026-00124"},
  });

  assert.equal(response.output_text, "Synthetic answer");
  const [record] = telemetry.all();
  assert.equal(record.status, "SUCCEEDED");
  assert.equal(record.provider, "fake");
  assert.equal(record.inputTokens, 12);
  assert.equal(record.outputTokens, 5);
  assert.equal(record.totalTokens, 17);
  assert.equal(record.task, "fulcrum-assistant.v1");
  assert.deepEqual(record.toolNames, ["getRiskScores"]);
  assert.match(record.inputHash, /^[a-f0-9]{64}$/);
  assert.equal("prompt" in record, false);
  assert.equal("output" in record, false);
});

test("instrumented provider records failures without exposing request content", async () => {
  const telemetry = new AiTelemetryStore();
  const provider = new InstrumentedProvider({
    providerName: "azure",
    model: "fast-deployment",
    async generateResponse() {
      throw new Error("AZURE_AI_FOUNDRY_HTTP_429");
    },
  }, telemetry);

  await assert.rejects(() => provider.generateResponse({
    input: [{role:"user", content:"secret prompt"}],
    telemetryContext: {interactionId:"interaction-2"},
  }), /AZURE_AI_FOUNDRY_HTTP_429/);

  const [record] = telemetry.all();
  assert.equal(record.status, "FAILED");
  assert.equal(record.provider, "azure");
  assert.equal(record.errorMessage, "AZURE_AI_FOUNDRY_HTTP_429");
  assert.equal("secret prompt" in record, false);
});
