import {createHash, randomUUID} from "node:crypto";

function hashValue(value) {
  return createHash("sha256").update(JSON.stringify(value ?? null)).digest("hex");
}

function usageValue(usage, ...keys) {
  for (const key of keys) {
    if (Number.isFinite(usage?.[key])) return usage[key];
  }
  return null;
}

export function normalizeUsage(usage) {
  return usage
    ? {
        inputTokens: usageValue(usage, "input_tokens", "prompt_tokens"),
        outputTokens: usageValue(usage, "output_tokens", "completion_tokens"),
        totalTokens: usageValue(usage, "total_tokens"),
      }
    : {inputTokens: null, outputTokens: null, totalTokens: null};
}

export function createExecutionRecord({
  context = {},
  provider,
  deployment,
  request,
  response,
  startedAt,
  latencyMs,
  status,
  error,
}) {
  const usage = normalizeUsage(response?.usage);
  return Object.freeze({
    runId: randomUUID(),
    correlationId: context.correlationId ?? context.interactionId ?? null,
    parentRunId: context.parentRunId ?? null,
    task: context.task ?? "unknown",
    provider: provider ?? "unknown",
    deployment: deployment ?? null,
    instructionVersion: context.instructionVersion ?? null,
    assessmentId: context.assessmentId ?? null,
    userId: context.userId ?? null,
    callType: context.callType ?? "model",
    inputHash: hashValue(request?.input),
    toolNames: Array.isArray(request?.tools)
      ? request.tools.map((tool) => tool.name).filter(Boolean)
      : [],
    startedAt: startedAt ?? new Date().toISOString(),
    latencyMs: Math.max(0, Math.round(latencyMs ?? 0)),
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    totalTokens: usage.totalTokens,
    status: status ?? "UNKNOWN",
    errorClass: error?.name ?? null,
    errorMessage: error ? String(error.message ?? "").slice(0, 240) : null,
  });
}
