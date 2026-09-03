# AI usage and hackathon methodology

This project uses AI across both the project-development lifecycle and the FULCRUM product itself. The following is the transparent summary for judges.

## How AI was used to build FULCRUM

- **General research and discovery:** We used a ChatGPT Project as a shared workspace for early research, problem framing, requirement expansion, domain questions, and design exploration. [ChatGPT Project — research workspace](https://chatgpt.com/g/g-p-6a986f8905ec8191af3c67f1f4f241c7-geniushacks/project)
- **Repository creation and technical decision-making:** We used Codex to inspect the repository, establish the persistent documentation architecture, create requirements and ADRs, develop the initial architecture, implement the Copilot foundation, and run tests. Codex operated against repository artifacts rather than relying on private conversation memory.
- **Runtime AI capability:** We use the OpenAI API through a provider adapter for **Ciel**, the FULCRUM Copilot. The API supports model responses, structured backend tool calls, governed context retrieval, assessment explanation, drafting, and chatbot interaction.

## What “model training” means in this project

For hackathon accuracy, the current implementation should be described as **provider-neutral AI Gateway design with Azure AI Foundry as the target platform**, not as training a foundation model. FULCRUM’s decision-making logic is encoded in deterministic scoring and workflow services; the model is instructed and evaluated to retrieve, explain, compare, challenge, and draft around those services. Azure AI Document Intelligence is an extraction/provenance service, not the risk reasoning engine. No claim of fine-tuning is made unless a separately documented fine-tuning job and dataset are added.

This distinction matters: the model does not learn or invent the authoritative risk rules. It receives scoped context and calls typed tools; deterministic services calculate governed outputs; humans make material decisions.

## How this is governed

All material AI behavior is designed to be attributable, evidence-backed, reviewable, overridable, and auditable. The system records provider/model metadata, prompt or instruction version, tools invoked, knowledge sources, assessment version, latency, token usage, and response classification. Hidden chain-of-thought is not persisted; observable decision provenance is.

The AI can assist with assessment preparation, but cannot approve, reject, vote, change scoring rules, bypass authorization, or directly mutate authoritative risk state. Product Owners, FCRM Analysts, and Risk Committee members receive role-appropriate context, enforced by backend authorization rather than prompting alone.

## Planned next steps

1. Add the governed synthetic FCRM knowledge corpus and metadata-filtered retrieval.
2. Add citation, groundedness, authorization, freshness, hallucination, and decision-governance evaluations.
3. Add persistent conversations and assessment context manifests.
4. Connect linked Jira initiatives through server-side OAuth 2.0 3LO and reconciliation.
5. Evaluate provider/model alternatives behind the same `AIProvider` contract.

See the [FCRM Copilot design](fcrm-copilot-and-jira-assistant.md), [AI-native SDLC ADR](../11-decisions/ADR-001-ai-native-sdlc.md), and [AI evaluation strategy](../08-testing/testing-and-evaluation.md).
