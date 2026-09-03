# Azure AI Foundry and Document Intelligence architecture

FULCRUM uses Microsoft Azure AI Foundry as the primary AI platform and Azure AI Document Intelligence as the primary document ingestion and structure-extraction layer. The application calls an internal AI Gateway through domain-level capabilities; domain services do not call model endpoints directly.

```text
FULCRUM Web App
      │
      ├── Initiative / Workflow Services ── FULCRUM authority
      ├── FCRM Services ── scoring, controls, decisions
      ├── Jira Gateway ── linked work-management context
      │
      ├── AI Gateway
      │     ├── Azure AI Foundry model deployments
      │     │     ├── fast model: extraction, classification, summary, routine chat
      │     │     ├── reasoning model: risk analysis, policy synthesis, decision package
      │     │     └── embedding model: semantic retrieval
      │     └── scoped retrieval / RAG context
      │
      └── Document Processing
            └── Azure AI Document Intelligence
                  └── normalized document and evidence records
```

## Responsibility boundaries

Document Intelligence extracts text, layout, tables, key/value pairs, pages, sections, and structured metadata from uploaded documents. It does not determine financial-crime risk, interpret policy, score an assessment, or make a decision.

The AI Gateway routes bounded capabilities such as `extractInitiativeFacts`, `detectMissingInformation`, `identifyRiskFactors`, `retrievePolicyEvidence`, `draftRiskAssessment`, `draftCommitteeSummary`, and `answerInitiativeQuestion`. It assembles only the authorized context needed for the task, validates structured outputs, records model/prompt/configuration provenance, and emits reviewable AI artifacts.

Azure AI Foundry supplies inference, routing, embeddings, evaluations, prompt execution, and model/deployment governance. The gateway contract remains provider-neutral so a future approved provider can implement the same capability interface. The existing `AIProvider` abstraction and fake provider remain useful for local tests and portability; the first production adapter should target Azure AI Foundry.

## Document-to-evidence flow

`User Upload → malware/type validation → Document Intelligence → normalized document representation → evidence records/object storage → chunking and embeddings → initiative-scoped retrieval → AI Gateway → risk analysis`

An extracted evidence record should retain `sourceDocumentId`, filename, document version, `initiativeId`, page number, section/header, extracted text or table reference, extraction timestamp, extraction method, service/model version, confidence, and processing status. Source spans should be stable enough for a reviewer to locate the original page. Low-confidence or failed extraction is an explicit gap, not silently converted into a fact.

## Knowledge layers

| Layer | Contents | Retrieval rule |
|---|---|---|
| Initiative data | Metadata, business context, workflow, comments, findings, decisions | Permission-checked direct records |
| Uploaded documents | Document Intelligence output and evidence provenance | Initiative/assessment scope plus source citations |
| Internal FCRM knowledge | Synthetic policies, procedures, controls, taxonomy, historical synthetic assessments | Versioned collection and effective-date filters |
| External regulatory knowledge | Authoritative sources such as OFAC, FinCEN, FFIEC BSA/AML, FATF, OCC, Federal Reserve, and FDIC | Curated, cited, jurisdiction/relevance filtered; no unsupported regulatory claims |

The retrieval layer returns a context manifest containing source IDs, versions, access decisions, freshness, citations, and truncation decisions. The model receives relevant excerpts, not an entire corpus or unrestricted Jira/document content.

## Model routing and efficiency

Routing is configuration-driven. Fast models handle high-volume, low-complexity operations; reasoning models are reserved for materially consequential analysis and synthesis; embedding deployments serve retrieval. Selection is based on task complexity, required structured-output reliability, latency, token budget, confidence, and evaluation results. Model deployment names, API versions, endpoints, and thresholds are environment configuration, not source-code constants.

Every run records the selected route, provider, deployment/model version, prompt version, input/output token counts, latency, cost where available, retrieval set, validation result, and human disposition. This supports cost/quality comparison and prevents a stronger model from being used by default when a faster model is sufficient.

## Security and governance

Use Azure managed identity where supported, Azure Key Vault for secrets, private/network controls where required, least-privilege role assignments, and separate Azure resources/configuration for development, demo, and production. Never expose Azure endpoints, keys, tokens, uploaded content, or deployment names through client bundles. Logs contain IDs, hashes, status, latency, and redacted metadata—not raw document text or prompts containing sensitive content.

Synthetic data is required for the hackathon fixture. Production onboarding requires data classification, retention, residency, encryption, access review, prompt-injection defenses, document malware controls, and an approved external-knowledge source list.

## Migration from the prior OpenAI assumption

The prior implementation described OpenAI as the default external provider. No domain contract, workflow, scoring logic, or human-decision rule should change. Migration consists of configuring the AI Gateway to select an Azure AI Foundry adapter, mapping capability routes to Azure model deployments, moving secrets to Azure/Vercel configuration, and adding Azure contract/evaluation tests. The existing OpenAI-compatible adapter may remain as a local fallback or portability option, but it is no longer the primary platform direction.

