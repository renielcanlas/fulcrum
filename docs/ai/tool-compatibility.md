# AI-tool compatibility matrix

| Tool | Instruction mechanism | Shared context/artifacts | Limitations / workflow |
|---|---|---|---|
| OpenAI Codex | `AGENTS.md` plus scoped docs | `.ai/`, `docs/`, git | Must write handoff artifacts for continuity |
| Claude Code | `CLAUDE.md` adapter → `AGENTS.md` | Same repository and schemas | Adapter is not a second source of truth |
| Claude | User/project instructions plus repository files | Same artifacts when file access exists | Explicitly load scoped context |
| GitHub Copilot | `.github/copilot-instructions.md` | Same repository artifacts | Review generated code and provenance |
| Gemini | Project instructions/files | Same repository artifacts | Use schema validation and human review |

Recommended workflow: read canonical guidance, identify requirement IDs, load only relevant context, produce/consume validated artifacts, run tests, and record unresolved questions. Tool capabilities vary; no tool may bypass application authorization.
