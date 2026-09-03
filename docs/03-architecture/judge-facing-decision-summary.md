# Judge-facing architecture decision summary

| Decision | Why | Rejected alternative | Risk controlled / tradeoff |
|---|---|---|---|
| Use AI for preparation, not disposition | Language work benefits from AI; accountability requires humans | Autonomous risk decision agent | Prevents unreviewed consequential decisions; retains review effort |
| Keep scoring deterministic | Numeric outputs must be reproducible and explainable | LLM-generated rating | Prevents score drift/hallucination; requires configuration governance |
| Use one governed Copilot first | Clear tool boundaries and lower complexity | Many autonomous agents | Easier security/evaluation; less parallel specialization initially |
| Use evidence-grounded retrieval | Policy and evidence claims need citations | Generic chatbot memory | Reduces hallucination; requires curated metadata and source snapshots |
| Keep Jira as integration, not authority | Jira is excellent for execution context | Build full work management or make Jira master | Preserves FCRM ownership; requires reconciliation |
| Use PostgreSQL | Relational integrity fits workflow, versions, votes, conditions, and audit metadata | Document-only or vector-only store | Strong consistency and queryability; migration/pooling work required |
| Use Next.js/Vercel for the hackathon | Solo-developer speed, previews, server-side routes | Kubernetes/VM/GitHub Pages | Low infrastructure overhead; externalize durable state |
| Require human gates and overrides | Material judgment is not deterministic | Fully automated progression | Strong governance; limits straight-through automation |
| Preserve versions and append-only history | Examiners need reconstruction over time | Destructive mutation | Better replayability; higher storage and model complexity |
| Use bounded capabilities | Security must be enforced outside prompts | Direct DB/secret/API access for the LLM | Limits blast radius; needs tool contracts and authorization |

The defensible product statement is: **FULCRUM’s AI assembles, retrieves, interprets, and explains the evidence required for financial-crime decisions. Deterministic services calculate governed outputs, and authorized humans retain control over every material conclusion.**
