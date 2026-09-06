function enabled() {
  return String(process.env.CIEL_DEBUG ?? "").toLowerCase() === "true";
}

function redact(value) {
  if (typeof value !== "string") return value;
  return value
    .replace(/\b[0-9]+:[0-9a-f-]{20,}\b/gi, "[hidden Jira account ID]")
    .replace(/(api[-_]?key|authorization|client[-_]?secret|access[-_]?token)\s*[:=]\s*[^,\s}]+/gi, "$1=[redacted]");
}

export function cielDebug(event, value) {
  if (!enabled()) return;
  const output = value === undefined ? "" : typeof value === "string" ? redact(value) : redact(JSON.stringify(value));
  console.log(`[CIEL] ${event}${output ? `: ${output}` : ""}`);
}

export function cielDebugError(value) {
  if (!enabled()) return;
  cielDebug("response given back to user", {error: value?.message ?? String(value)});
}
