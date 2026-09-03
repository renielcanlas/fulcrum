# AI chatbot architecture

This is the requested path for the canonical design. The detailed design lives in [FCRM Copilot and Jira Assistant](../05-ai/fcrm-copilot-and-jira-assistant.md). The executable foundation is under `src/ai/`, `src/tools/`, `src/audit/`, `src/auth/`, `src/server/`, and `web/`.

The embedded UI calls FULCRUM’s backend. The backend owns authentication, authorization, context loading, tool execution, provider calls, and audit. The browser never receives privileged OpenAI or Jira credentials.
