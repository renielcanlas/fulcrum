import test from "node:test";
import assert from "node:assert/strict";
import {extractJiraPdfAttachment} from "../src/integrations/document-intelligence.js";

test("Jira PDF attachment is extracted through Document Intelligence with page provenance", async () => {
  const requests = [];
  const result = await extractJiraPdfAttachment({
    attachment: {id: "1002", issueKey: "FCRM-80", filename: "risk-brief.pdf", mimeType: "application/pdf", size: 4},
    cloudId: "cloud-1",
    accessToken: "jira-token",
    env: {AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT: "https://raphael.cognitiveservices.azure.com", AZURE_DOCUMENT_INTELLIGENCE_API_KEY: "doc-key", AZURE_DOCUMENT_INTELLIGENCE_API_VERSION: "2024-11-30", AZURE_DOCUMENT_INTELLIGENCE_MODEL: "prebuilt-layout"},
    fetchImpl: async (url, options = {}) => {
      requests.push({url: url.toString(), options});
      if (requests.length === 1) return new Response(new Uint8Array([1, 2, 3, 4]), {status: 200});
      if (requests.length === 2) return new Response(null, {status: 202, headers: {"operation-location": "https://raphael.cognitiveservices.azure.com/result/1"}});
      return new Response(JSON.stringify({status: "succeeded", analyzeResult: {content: "Page one text", pages: [{pageNumber: 1, spans: [{offset: 0, length: 14}]}]}}), {status: 200});
    },
  });
  assert.equal(result.status, "completed");
  assert.equal(result.pages[0].page, 1);
  assert.equal(result.pages[0].text, "Page one text");
  assert.match(requests[0].url, /attachment\/content\/1002/);
  assert.match(requests[1].url, /prebuilt-layout:analyze/);
  assert.equal(requests[1].options.headers["Ocp-Apim-Subscription-Key"], "doc-key");
  assert.match(requests[1].options.body, /base64Source/);
});

test("non-PDF attachments are skipped without calling Azure", async () => {
  const result = await extractJiraPdfAttachment({attachment: {id: "1003", filename: "image.png", mimeType: "image/png"}, env: {}});
  assert.deepEqual(result, {attachmentId: "1003", filename: "image.png", status: "skipped", reason: "pdf_only"});
});
