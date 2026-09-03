# Actor/state permission matrix

| Actor | Draft | Intake validation | Assessment in progress | Analyst review | Decision ready | Committee review | Final decision / closed |
|---|---|---|---|---|---|---|---|
| Product Owner | Create/edit/upload/submit own | Respond to clarification | Provide evidence | View permitted status | View package permitted to owner | View permitted decision status | View outcome/conditions |
| FCRM Analyst | View | Validate/request clarification | Analyze/recalculate/request clarification | Review/edit/override | Mark ready/reopen | Prepare/support committee; no vote unless authorized member | Reassess/request version; verify conditions |
| Risk Committee | View when assigned | View package | View package | View package | View package | Comment/vote/finalize | View immutable decision/request reassessment |
| System | Validate and timestamp | Enforce preconditions/SLA | Run deterministic calculations | Persist drafts/events | Never auto-mark ready | Never decide | Record outcome/close conditions |
| AI Copilot | Read scoped context/propose | Suggest gaps | Extract/summarize/suggest | Draft/challenge | Explain package | Draft briefing only | Explain history only |

The matrix is enforced in the backend. Prompt instructions are not an authorization mechanism.
