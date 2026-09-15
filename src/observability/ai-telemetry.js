import {SpanStatusCode, trace} from "@opentelemetry/api";

export class AiTelemetryStore {
  #records = [];

  constructor({tracer = trace.getTracer("fulcrum.ai", "1.0.0")} = {}) {
    this.tracer = tracer;
  }

  record(record) {
    if (!record?.runId) throw new Error("AI_EXECUTION_RUN_ID_REQUIRED");
    this.#records.push(record);
    const span = this.tracer.startSpan(`fulcrum.ai.${record.task}`);
    span.setAttributes({
      "fulcrum.ai.run_id": record.runId,
      "fulcrum.ai.correlation_id": record.correlationId ?? "",
      "fulcrum.ai.task": record.task,
      "fulcrum.ai.provider": record.provider,
      "fulcrum.ai.deployment": record.deployment ?? "",
      "fulcrum.ai.call_type": record.callType,
      "fulcrum.ai.status": record.status,
      "fulcrum.ai.validation_status": record.validationStatus ?? "UNKNOWN",
      "fulcrum.ai.input_tokens": record.inputTokens ?? 0,
      "fulcrum.ai.output_tokens": record.outputTokens ?? 0,
      "fulcrum.ai.total_tokens": record.totalTokens ?? 0,
      "fulcrum.ai.latency_ms": record.latencyMs,
      "fulcrum.ai.input_hash": record.inputHash,
    });
    if (record.status === "FAILED") {
      span.setStatus({code: SpanStatusCode.ERROR, message: record.errorClass ?? "AI_EXECUTION_FAILED"});
    } else {
      span.setStatus({code: SpanStatusCode.OK});
    }
    span.end();
    return record;
  }

  all() {
    return [...this.#records];
  }

  recent(limit = 100) {
    return this.#records.slice(-Math.max(0, limit));
  }
}
