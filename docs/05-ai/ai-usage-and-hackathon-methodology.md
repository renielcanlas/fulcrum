# AI usage and hackathon methodology

This project uses AI across both the project-development lifecycle and the FULCRUM product itself. The following is the transparent summary for judges.

## How AI was used to build FULCRUM

- **Requirements and design:** I fed the initial requirements into a [ChatGPT Project for general research, requirements discussion, and idea exploration](https://chatgpt.com/g/g-p-6a986f8905ec8191af3c67f1f4f241c7-geniushacks/project). Through the design phase, ChatGPT and the Codex plugin for VS Code helped develop the user journeys, architecture, data model, workflow, governance decisions, and UX direction. The resulting design and architecture decisions were captured as Markdown documents in this repository.
- **Development:** I used the Codex plugin for VS Code for most of the development journey: repository changes, implementation, refactoring, documentation, and verification. I also used available AI resources from the Myridius Azure portal as part of the platform exploration.
- **Testing:** AI-assisted test generation helped create unit and regression tests for AI workflows, deterministic decision/scoring behavior, security boundaries, human governance, lineage, and workflow correctness. The tests remain executable repository artifacts rather than claims based only on model output.
- **Deployment:** Vercel is connected to the repository so the app is automatically deployed whenever changes are committed. This keeps the judge-facing demo aligned with the latest reviewed code.
- **Runtime AI capability:** We use the OpenAI API through a provider adapter for **Ciel**, the FULCRUM AI Assistant. The API supports model responses, structured backend tool calls, governed context retrieval, assessment explanation, drafting, and chatbot interaction.

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
