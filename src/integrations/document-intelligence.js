import { getJiraAttachment } from "./jira.js";

const DEFAULT_API_VERSION = "2024-11-30";
const DEFAULT_MODEL = "prebuilt-layout";
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const MAX_EXTRACTED_CHARS = 24000;

export function documentIntelligenceConfig(env = process.env) {
  return {
    endpoint: env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT?.replace(/\/$/, "") ?? "",
    apiKey: env.AZURE_DOCUMENT_INTELLIGENCE_API_KEY ?? "",
    apiVersion: env.AZURE_DOCUMENT_INTELLIGENCE_API_VERSION ?? DEFAULT_API_VERSION,
    model: env.AZURE_DOCUMENT_INTELLIGENCE_MODEL ?? DEFAULT_MODEL,
  };
}

export function documentIntelligenceConfigured(env = process.env) {
  const config = documentIntelligenceConfig(env);
  return Boolean(config.endpoint && config.apiKey && config.apiVersion && config.model);
}

function pageText(page, content) {
  const spans = Array.isArray(page.spans) ? page.spans : [];
  return spans.map((span) => content.slice(span.offset ?? 0, (span.offset ?? 0) + (span.length ?? 0))).join("\n").trim();
}

function normalizeAnalysis(result, attachment, config) {
  const analysis = result.analyzeResult ?? result;
  const content = typeof analysis.content === "string" ? analysis.content : "";
  const pages = (analysis.pages ?? []).map((page, index) => ({
    page: page.pageNumber ?? index + 1,
    text: pageText(page, content),
  })).filter((page) => page.text);
  return {
    attachmentId: String(attachment.id),
    filename: attachment.filename,
    mimeType: attachment.mimeType,
    status: "completed",
    model: config.model,
    source: `jira-attachment:${attachment.id}`,
    content: content.slice(0, MAX_EXTRACTED_CHARS),
    pages,
  };
}

async function documentResponseDetail(response) {
  const body = await response.text();
  try { return JSON.parse(body).error?.message ?? body.slice(0, 300); } catch { return body.slice(0, 300); }
}

async function analyzePdf({bytes, config, fetchImpl}) {
  const url = new URL(`${config.endpoint}/documentintelligence/documentModels/${encodeURIComponent(config.model)}:analyze`);
  url.searchParams.set("_overload", "analyzeDocument");
  url.searchParams.set("api-version", config.apiVersion);
  url.searchParams.set("locale", "en-US");
  url.searchParams.set("outputContentFormat", "markdown");
  const initial = await fetchImpl(url, {
    method: "POST",
    headers: {accept: "application/json", "content-type": "application/json", "Ocp-Apim-Subscription-Key": config.apiKey},
    body: JSON.stringify({base64Source: Buffer.from(bytes).toString("base64")}),
  });
  if (initial.status !== 202) throw new Error(`document_intelligence_analyze_failed_${initial.status}: ${await documentResponseDetail(initial)}`);
  const operationUrl = initial.headers.get("operation-location");
  if (!operationUrl) throw new Error("document_intelligence_operation_location_missing");
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const result = await fetchImpl(operationUrl, {headers: {accept: "application/json", "Ocp-Apim-Subscription-Key": config.apiKey}});
    if (!result.ok) throw new Error(`document_intelligence_result_failed_${result.status}: ${await documentResponseDetail(result)}`);
    const payload = await result.json();
    if (payload.status === "succeeded") return payload;
    if (payload.status === "failed") throw new Error("document_intelligence_analysis_failed");
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("document_intelligence_analysis_timeout");
}

export async function extractJiraPdfAttachment({attachment, cloudId, accessToken, fetchImpl = fetch, env = process.env}) {
  if (!attachment?.id || !/\.pdf$/i.test(attachment.filename ?? "") && attachment.mimeType !== "application/pdf") return {attachmentId: String(attachment?.id ?? ""), filename: attachment?.filename ?? "Unnamed attachment", status: "skipped", reason: "pdf_only"};
  if (attachment.size && attachment.size > MAX_ATTACHMENT_BYTES) return {attachmentId: String(attachment.id), filename: attachment.filename, status: "skipped", reason: "attachment_too_large"};
  const config = documentIntelligenceConfig(env);
  if (!config.endpoint || !config.apiKey) return {attachmentId: String(attachment.id), filename: attachment.filename, status: "unavailable", reason: "document_intelligence_not_configured"};
  const response = await getJiraAttachment({issueKey: attachment.issueKey, attachmentId: attachment.id, cloudId, accessToken, fetchImpl});
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > MAX_ATTACHMENT_BYTES) return {attachmentId: String(attachment.id), filename: attachment.filename, status: "skipped", reason: "attachment_too_large"};
  const analysis = await analyzePdf({bytes, config, fetchImpl});
  return normalizeAnalysis(analysis, attachment, config);
}

export async function extractJiraPdfAttachments({attachments = [], issueKey, cloudId, accessToken, fetchImpl = fetch, env = process.env}) {
  const results = [];
  for (const attachment of attachments) {
    try {
      results.push(await extractJiraPdfAttachment({attachment: {...attachment, issueKey}, cloudId, accessToken, fetchImpl, env}));
    } catch (error) {
      results.push({attachmentId: String(attachment.id), filename: attachment.filename, status: "failed", reason: error.message ?? "document_intelligence_attachment_failed"});
    }
  }
  return results;
}
