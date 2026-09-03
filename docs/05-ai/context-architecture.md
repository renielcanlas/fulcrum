# AI context architecture

Hierarchy: global principles (`AGENTS.md`) → domain context (`docs/04-domain`, `docs/06-risk`, approved research) → case context (request, evidence, extracted facts, history) → agent context (allowlisted fields/tools) → task context (objective, constraints, output schema). Models receive scoped context, not the repository or conversation wholesale.

Context is versioned, hashed where practical, source-referenced, access-controlled, and reproducible from case ID plus artifact versions. Retrieval returns authoritative records and citations; summaries are derived caches, never authority. Prompt-injection defenses treat documents and retrieved text as untrusted data, separate instructions from content, constrain tools, and validate outputs.
