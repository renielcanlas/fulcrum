# FULCRUM hackathon demo flow and script

Status: presentation guide for the synthetic judge-facing demo.

This script assumes an 8–10-minute live demo using `/demo`, the canonical Golden Initiative, the embedded Ciel assistant, and a short `/sandbox` segment. It is intentionally synthetic and does not claim that FULCRUM makes autonomous financial-crime decisions.

## The one-sentence story

FULCRUM turns a fragmented financial-crime risk assessment into a traceable decision package: AI prepares and explains the evidence, deterministic services calculate the governed risk, and authorized humans retain the decision.

## The names: a little extra sauce

### Why FULCRUM?

Use this as a short presenter story on the title slide:

> I called it FULCRUM because a fulcrum is the point that lets you move something much larger than yourself. That is the job of this product. It gives an analyst leverage over a messy assessment without pretending that the machine should own the judgment.
>
> It also captures the balancing act: business momentum on one side, financial-crime risk and control obligations on the other. FULCRUM sits in the middle and helps people make that trade-off visible.

This is a product metaphor, not a claim that the name is an acronym. Avoid inventing an expansion for FULCRUM unless the team formally chooses one.

### Why Ciel?

Use this when Ciel first appears:

> Ciel is a deliberate nod to the AI-like partner from *That Time I Got Reincarnated as a Slime*. The useful idea is not a magical all-knowing assistant. It is a trusted analytical partner that helps someone see the situation more clearly while leaving authority with the human.
>
> There is also a second layer to the name. In French, *ciel* means “sky.” That felt right for an assistant whose job is to give the analyst a wider view across evidence, risk, linked work, and decision history.
>
> In other words, Ciel can help us see the whole sky. She still does not get to sign the approval.

The final line is the intended joke. Keep it dry and move on.

## Challenge and judging strategy

### The challenge we are answering

Financial-crime assessments for new products and material changes are fragmented across email, Word, Excel, SharePoint, Jira, and analyst memory. The work can take 15–20 business days, similar cases can receive inconsistent treatment, and reconstructing the rationale later is difficult.

FULCRUM addresses that challenge as a **Financial Crime Decision Intelligence Workbench**. Its differentiator is the combination of evidence-grounded risk decomposition, deterministic inherent/control/residual views, governed AI assistance, analyst challenge, and examiner-ready reconstruction. Jira integration supports the workflow, but Jira is not the product and does not become the FULCRUM risk authority.

### The judging criteria documented in the repository

The repository’s internal judging map names eight areas. The presentation should make each one visible instead of relying on judges to infer it from the UI.

| Judging area | What to show | Proof point in the demo |
|---|---|---|---|
| AI harness and orchestration | AI Gateway, typed tools, structured contracts, validation, fallback | Ciel answers from scoped context; invalid or unauthorized output does not become authoritative state. |
| AI across the SDLC | AI-assisted requirements, ADRs, implementation, tests, and evaluation | Show the AI-native delivery story briefly, then point judges to the repository artifacts. |
| Human-in-the-loop governance | Analyst challenge, override, committee gate, refusal to decide | High system calculation remains visible while Daniel records Medium and Helen decides. |
| Evaluation framework | Golden fixture, deterministic checks, AI checklist, measured versus unmeasured results | Show that quality is evaluated for grounding, schema validity, access isolation, freshness, latency, cost, and acceptance. |
| Context engineering | Permission-checked, task-scoped context and provenance | Ciel receives the active assessment and linked Jira context, not an unrestricted database or corpus. |
| Production readiness | Server-side adapters, authority boundaries, security, deployment path, known gaps | Foundry, Document Intelligence, Jira, Vercel, audit, and explicit deferred production work. |
| Token efficiency | Model routing, accepted-fact compression, top-K retrieval, caching, selective invalidation | Explain why fast models handle routine work and reasoning models are reserved for material synthesis. |
| Engineering judgment | Clear boundaries and restrained architecture | One governed orchestrator, deterministic scoring, no Jira mirror, no autonomous decision agent. |

### Metrics to mention carefully

The repository defines the right metric families, but most business targets are still open questions and should not be presented as measured outcomes. Use these labels:

- **Measured in the current fixture:** deterministic score and executable Golden Initiative evaluation results.
- **Implemented and demonstrable:** workflow gates, authorization checks, provenance fields, audit events, scenario validation, stale-result protection, and non-mutation behavior.
- **Designed but not yet baselined:** decision-ready cycle time, analyst effort, completeness, consistency, groundedness, citation correctness, hallucination/refusal rate, latency, cost, token use, and human acceptance/override rates.
- **Deferred production work:** durable assessment persistence, full Jira reconciliation, background Document Intelligence jobs, production RAG and embeddings, enterprise identity, and production audit archival.

**Do not say:** “FULCRUM reduces cycle time from 15 days to 2 days.”

**Say instead:** “FULCRUM is designed to make an assessment decision-ready in approximately two days. The hackathon demonstrates the governed workflow and the measurement framework; production baselines remain to be established.”

## Demo setup

Before presenting:

- Start the app and open `/`.
- Use the synthetic persona selector to enter the FCRM Analyst experience as Daniel Reyes.
- Open `/demo` and confirm the Golden Initiative is available: **Launch U.S.–Philippines Instant Remittance**.
- Keep the Ciel prompt ready: **Why is residual AML risk High?**
- If Jira or live AI is unavailable, use the seeded demo state. Do not improvise production or regulatory claims.
- Open `/sandbox` in a second tab so it is ready for the dedicated integration segment.

## Slide guide at a glance

| Slide | Time | Purpose | Live surface |
|---|---|---|
| 1 | 0:00–0:45 | Problem and promise | Landing page |
| 2 | 0:45–1:25 | Product boundary and architecture | Architecture slide |
| 3 | 1:25–2:05 | AI architecture | AI Gateway, Foundry, Document Intelligence |
| 4 | 2:05–2:55 | Golden Initiative | `/demo` |
| 5 | 2:55–3:45 | Evidence and deterministic risk | `/demo` risk and trace views |
| 6 | 3:45–4:45 | Document Intelligence and evidence provenance | Attachment/evidence view |
| 7 | 4:45–5:35 | Ciel and the Foundry hosted agent | Ciel panel |
| 8 | 5:35–6:25 | Analyst review and override | `/demo` review view |
| 9 | 6:25–7:15 | Jira sandbox | `/sandbox` |
| 10 | 7:15–8:15 | Committee decision with conditions | Decision view |
| 11 | 8:15–9:00 | Audit and reconstruction | Trace/audit view |
| 12 | 9:00–9:30 | Close and call to action | Final state |

If the slot is only 5–6 minutes, skip slides 6 and 9 live, but keep them in the deck as capability slides or judge Q&A material.

## Suggested deck structure

Keep one clear idea per slide. Use large UI screenshots and short labels. The detailed script below is the presenter guide, not copy to place on the slides.

1. **FULCRUM: governed financial-crime risk assessment**
   - Subtitle: **AI prepares. Deterministic services calculate. Humans decide.**
2. **The assessment problem**
   - Fragmented inputs, slow review, inconsistent reasoning, difficult reconstruction.
3. **A governed AI architecture**
   - FULCRUM app, AI Gateway, Azure AI Foundry, Azure AI Document Intelligence, Jira, deterministic risk services.
4. **The Golden Initiative**
   - Launch U.S.–Philippines Instant Remittance, synthetic scope, partner, channels, open questions.
5. **Evidence to decision trace**
   - Fact → evidence → control → score → analyst review → committee decision.
6. **Documents become reviewable evidence**
   - Document Intelligence extracts text, layout, tables, pages, and source metadata.
7. **Ciel: the FULCRUM AI Assistant**
   - Grounded Q&A, gap detection, drafting, challenge, and explanation.
8. **Human review remains authoritative**
   - AI observation High, deterministic score High, analyst recommendation Medium, rationale preserved.
9. **Sandbox: bounded Jira experimentation**
   - Search, scenario generation, validation, explicit confirmation, execution, and recovery.
10. **Committee decision with conditions**
    - Approved with Conditions, accountable owners, due dates, and follow-up review.
11. **What can be reconstructed later**
    - Sources, model/instruction version, calculation, override, decision, conditions, and audit events.
12. **The promise**
    - Faster preparation with preserved accountability.

## Visual and animation guide

Use animation to control attention, not to decorate the deck. Each slide should answer one question, reveal one idea at a time, and leave the audience looking at the same thing you are describing.

### Global rules

- Use **Appear** or a short **Fade** for most elements. Keep entrances around 0.3–0.5 seconds.
- Use **Morph** only when the same object genuinely changes position or state, such as a workflow moving from intake to decision.
- Reveal diagrams from left to right: source context, AI assistance, deterministic services, human decision.
- Dim previous elements to 35–45% opacity when a new element becomes the focus.
- Use one accent color for the current focus: green for governed progress, amber for uncertainty or missing evidence, purple for AI, and blue for human action.
- Avoid spinning, bouncing, flying text, constant motion, and simultaneous card-grid reveals. They make a governance story feel like a software launch video.
- Do not animate a number before explaining what the number means.
- Keep the live application interaction separate from slide animation. Finish the slide, then switch to the product and perform one clear action.

### Slide-by-slide staging

#### Slide 1 — FULCRUM: governed financial-crime risk assessment

**Include:** Product name, one-line promise, minimal fulcrum visual, and a small footer: **Synthetic hackathon demo**.

**Reveal order:**

1. Product name fades in.
2. The fulcrum or balance visual appears.
3. The promise appears: **AI prepares. Deterministic services calculate. Humans decide.**
4. The synthetic-demo label appears last and quietly.

**Highlight:** The promise. Keep the naming story in your voice rather than putting the full explanation on the slide.

**Presenter cue:** Pause after “humans decide.” Do not advance until the audience has read it.

#### Slide 2 — The assessment problem

**Include:** A simple left-to-right chain of messy inputs: email, documents, spreadsheets, Jira, and analyst memory. End with one question: **Why was this decision made?**

**Reveal order:**

1. Show the scattered inputs one at a time.
2. Add thin lines converging into a question mark or empty decision record.
3. Highlight the question in amber.
4. Fade the inputs slightly as the question remains bright.

**Highlight:** The gap between having information and having a reconstructable decision.

**Avoid:** Showing a long list of pain points. The audience should feel the problem in one visual beat.

#### Slide 3 — A governed AI architecture

**Include:** FULCRUM app, AI Gateway, Azure AI Foundry, Azure AI Document Intelligence, Jira, deterministic risk services, and human decision gates.

**Reveal order:**

1. Reveal Jira on the left as the initiative and collaboration source.
2. Reveal the FULCRUM workbench in the center.
3. Reveal the AI Gateway above or beside it.
4. Reveal Foundry behind the Gateway as the model and hosted-agent platform.
5. Reveal Document Intelligence below the Gateway as the document extraction path.
6. Reveal deterministic scoring and workflow services next.
7. Reveal the human analyst and committee gates last.

**Highlight:** Use a purple outline around AI components, a teal outline around deterministic services, and a green outline around people. Keep the outlines visible while you explain the boundary.

**Animation line:**

> Notice where the intelligence sits and where the authority sits. They are connected, but they are not the same box.

#### Slide 4 — The Golden Initiative

**Include:** Initiative title, Maya Chen as Product Owner, synthetic scope, U.S. to Philippines flow, HarborBridge, initial limit, and open questions.

**Reveal order:**

1. Reveal the initiative title.
2. Animate the geographic or transaction flow.
3. Reveal the business facts: channels, partner, volume, and limit.
4. Reveal open questions in amber, one at a time.
5. Highlight the sentence: **Decision-ready does not mean pretending nothing is missing.**

**Highlight:** Open questions. They create the reason for the assessment and prevent the demo from feeling like a pre-approved story.

**Transition:** Use Morph from the initiative facts into the evidence and risk trace.

#### Slide 5 — Evidence to decision trace

**Include:** Six connected stages: Fact, Evidence, Control, Score, Human Review, Decision.

**Reveal order:**

1. Reveal Fact and Evidence.
2. Reveal the Control connection.
3. Reveal the deterministic Score.
4. Reveal Analyst Review.
5. Reveal Committee Decision.
6. Add a bright outline around the entire path.

**Highlight:** When explaining the score, dim the AI label and highlight **System Calculation**. When explaining the override, dim the score and highlight **Human Judgment**.

**Animation line:**

> This is the trail we want to preserve. A conclusion without a trail is just a very confident opinion.

#### Slide 6 — Documents become reviewable evidence

**Include:** A synthetic PDF thumbnail, a page or section marker, extracted text/table snippet, confidence indicator, and evidence record.

**Reveal order:**

1. Reveal the document thumbnail.
2. Draw a soft focus rectangle around the source page.
3. Reveal the extracted text or table.
4. Reveal the page, section, version, and confidence metadata.
5. Move the highlight to the normalized evidence record.
6. Show a red or amber stop marker beside **No automatic risk decision**.

**Highlight:** The source span and page reference, not the extracted prose. The point is that a reviewer can get back to the source.

**Animation line:**

> Document Intelligence helps us find and anchor the evidence. It does not get promoted to risk officer because it found a table.

#### Slide 7 — Ciel: the FULCRUM AI Assistant

**Include:** Ciel name, a compact chat screenshot, a question such as **Why is residual AML risk High?**, and four capability labels: explain, find gaps, draft, challenge.

**Reveal order:**

1. Reveal the question bubble.
2. Reveal Ciel’s answer in two or three short blocks.
3. Reveal source or context labels beside the answer.
4. Reveal the four capabilities.
5. Reveal a small “cannot decide” line underneath.

**Highlight:** The answer’s grounding and uncertainty. Use a purple glow for AI-generated interpretation, then a green check beside the source context.

**Name-story timing:** Tell the Ciel naming story after the answer appears, not before. The audience should first understand what Ciel does.

**Animation line:**

> Ciel gives us a wider view. She does not get the signature line.

#### Slide 8 — Human review remains authoritative

**Include:** Three clearly labeled values: **System calculation: High**, **AI observation: High**, **Analyst recommendation: Medium**. Add Daniel’s rationale and a visible audit marker.

**Reveal order:**

1. Reveal the system calculation.
2. Reveal the AI observation beside it.
3. Reveal the analyst recommendation last, in green.
4. Reveal the recorded rationale and evidence references.
5. Animate a bracket around all three values with the label **Preserved, not overwritten**.

**Highlight:** The difference between the values. Do not blur them into one “final AI score.”

**Animation line:**

> The disagreement is the feature. It tells us where human judgment entered the process and gives us a record of why.

#### Slide 9 — Sandbox: bounded Jira experimentation

**Include:** A cropped sandbox screenshot showing the FCRM project, scenario JSON, validation indicators, preflight confirmation, and execution result.

**Reveal order:**

1. Reveal the fixed synthetic FCRM project.
2. Reveal the AI-generated scenario JSON.
3. Reveal deterministic validation checks.
4. Reveal the explicit confirmation step.
5. Reveal the verified Jira result and audit event.
6. Add a lock icon beside **No silent writes**.

**Highlight:** The confirmation gate. The model’s proposed action should remain visually separate from the application’s executed result.

**Animation line:**

> JSON is a proposal, not a permission slip.

**Live-demo note:** Do not animate or show cleanup. Cleanup is destructive, even though it is limited to synthetic work.

#### Slide 10 — Committee decision with conditions

**Include:** Helen Morgan, **Approved with Conditions**, four conditions, owners, due dates, and a 30-day review marker.

**Reveal order:**

1. Reveal the decision state.
2. Reveal each condition one at a time.
3. Reveal owners and dates after each condition appears.
4. Reveal the 30-day review marker last.

**Highlight:** Conditions as obligations, not decorations. Use amber for open conditions even though the overall outcome is green.

**Animation line:**

> Approved with Conditions means the work can move forward with obligations attached. It does not mean the obligations have already disappeared.

#### Slide 11 — What can be reconstructed later

**Include:** A vertical audit timeline: source, extraction, AI run, score calculation, analyst override, committee decision, condition update.

**Reveal order:**

1. Reveal the source and evidence event.
2. Reveal the AI run with provider/instruction metadata.
3. Reveal the deterministic calculation.
4. Reveal the analyst override.
5. Reveal the committee decision.
6. Reveal the conditions and final audit marker.

**Highlight:** Use a moving focus ring on the event currently being narrated. Keep previous events visible but dimmed.

**Animation line:**

> Months later, we should not need archaeology, folklore, and one heroic analyst’s memory to explain the case.

#### Slide 12 — The promise

**Include:** Three short lines only: **Faster preparation**, **Better evidence visibility**, **Human accountability preserved**. End with **The system prepares. Humans decide.**

**Reveal order:**

1. Reveal the three outcomes one by one.
2. Reveal the final sentence last.
3. Hold the final sentence on screen while you deliver the closing line.

**Highlight:** The final sentence, not a logo or a feature list.

**Closing animation:** Fade everything except **The system prepares. Humans decide.** Then stop animating and take questions.

## Judge callouts by slide

Use one explicit sentence on the relevant slide so the scoring connection is unmistakable:

| Slide | Explicit judge callout |
|---|---|
| 2 | “This is the operational problem: fragmented evidence, slow preparation, inconsistent treatment, and weak reconstruction.” |
| 3 | “This is the AI harness: scoped context enters through the Gateway, structured output is validated, and provenance is recorded.” |
| 5 | “This is deterministic engineering judgment: the model does not calculate the risk score.” |
| 6 | “This is document intelligence with source provenance, not an AI-generated fact.” |
| 7 | “This is context engineering: Ciel answers from the authorized assessment and linked Jira context.” |
| 8 | “This is human governance: disagreement becomes a recorded override, not a hidden overwrite.” |
| 9 | “This is safe AI action planning: the model drafts, while validation, authorization, confirmation, execution, and verification stay in the application.” |
| 11 | “This is the evaluation and audit story: we can inspect what happened, what the model saw, what the system calculated, and what the human decided.” |

## Delivery tone

- Talk like an operator showing a useful system, not like a product brochure.
- Use one light joke per major section, then immediately land the concrete capability.
- Explain the AI boundary with confidence and a little self-awareness: “The model can draft the Jira action. It cannot quietly press the big red button.”
- Let the synthetic nature of the demo be part of the story: “The data is synthetic, but the governance problem is very real.”
- Keep the naming stories short. They add memorability, but the judge should still leave knowing the problem, the workflow, and the evidence of implementation.

## Slide and demo sequence

### 1. Opening: the problem

**On screen:** title slide or landing page.

**Say:**

> Financial-crime risk assessments are often spread across email, documents, spreadsheets, collaboration tools, and analyst memory. In other words, the evidence is everywhere, the context is nowhere, and the analyst is expected to be the search engine.
>
> That makes the work slow, inconsistent, and difficult to reconstruct when someone asks, “Why did we make this decision?”
>
> FULCRUM is a governed workbench for that journey. It brings the initiative context, evidence, controls, scoring, review, conditions, and audit trail into one decision path.

**Transition:**

> I’ll show one synthetic initiative from intake through a human committee decision.

**Optional naming line:**

> I called it FULCRUM because the product is meant to give people leverage over a complicated assessment. It helps move the work forward without moving accountability away from the people who own the decision.

### 2. The product boundary

**On screen:** landing page or architecture visual.

**Say:**

> The boundary is deliberate. Jira remains authoritative for the business initiative and collaboration. FULCRUM is authoritative for the FCRM assessment, methodology, human decisions, conditions, and decision lineage.
>
> That means we are not building a very confident chatbot with a large vocabulary and a tiny conscience. Ciel, the embedded AI assistant, can retrieve, summarize, explain, challenge, and draft. It cannot approve, reject, change a rating, change the rules, or bypass authorization.

**Key line if interrupted:**

> The system prepares. Humans decide.

### 3. The AI architecture: Foundry and the AI Gateway

**On screen:** architecture slide.

**Say:**

> The AI is organized behind an AI Gateway rather than embedded directly into the domain logic. That gives FULCRUM one controlled place to assemble authorized context, route work to the appropriate model capability, validate structured output, and record provenance.
>
> Azure AI Foundry is the primary platform direction. The design supports separate routes for fast extraction and routine chat, stronger reasoning for risk synthesis and challenge, and embeddings for scoped retrieval. The provider adapter can change without changing the workflow, scoring, authorization, or human-decision rules.
>
> In the Foundry deployment, Ciel runs as a published hosted agent with an explicit instruction contract. The application still owns the tools, permissions, confirmation steps, and final result. A mode marker can request chat, evaluation JSON, an action plan, a Jira draft, or a sandbox scenario, but the mode never grants authority.

**Say clearly:**

> Foundry supplies governed model execution and evaluation. FULCRUM remains the system that decides what the model is allowed to see and what the application is allowed to do with the model’s output.

### 4. Intake: the Golden Initiative

**On screen:** `/demo`, initiative board and Golden Initiative.

**Action:** Open or select **Launch U.S.–Philippines Instant Remittance**.

**Say:**

> Maya Chen has proposed a synthetic launch for instant remittances from the United States to recipients in the Philippines, using a synthetic local partner called HarborBridge Payments Philippines.
>
> The initiative includes the business purpose, channels, partner, transaction limits, expected volume, and the risk areas that need review. It also carries open questions: partner beneficial ownership, screening evidence, alert-handling ownership and SLA, and recipient-wallet limits.
>
> That is important because an assessment should expose what is missing before it presents a confident conclusion.

### 5. Evidence, controls, and deterministic risk

**On screen:** initiative detail, evidence, controls, risk summary, or trace view.

**Action:** Open the risk/evidence section and, if available, show the read-only decision trace.

**Say:**

> Each material finding has a visible path back to the underlying fact and evidence, then forward to the relevant control and decision impact.
>
> FULCRUM keeps separate concepts separate: inherent risk, control effectiveness, residual risk, evidence quality, confidence, and completeness.
>
> The score is calculated by deterministic, versioned configuration. In this synthetic fixture, the system calculation is High, with a score of 78. The calculation remains inspectable rather than being generated by a language model.

**Point out:**

> This is the distinction between an explainable governed output and an AI opinion.

### 6. Documents become evidence with Document Intelligence

**On screen:** a synthetic PDF attachment or attachment preview, then the evidence/provenance view.

**Action:** Show a document attachment or the seeded extracted evidence. If the live extraction path is enabled, point to the page or section reference returned by the service.

**Say:**

> The document path has a separate responsibility from the reasoning path. Azure AI Document Intelligence extracts structure from submitted documents: text, layout, tables, key-value pairs, pages, sections, and metadata.
>
> That extraction does not decide risk. FULCRUM normalizes the result into evidence records with the document ID, version, page or section, extraction method, confidence, and processing status. Low-confidence or failed extraction becomes an explicit gap for review.
>
> Those bounded evidence records can then be passed into the AI Gateway for initiative-scoped analysis and retrieval. The reviewer can still locate the original source instead of trusting an unexplained summary.

**Key line:**

> Document Intelligence makes documents searchable and traceable. It does not turn extracted text into an automatic decision.

### 7. Ciel: grounded assistance and the Foundry agent

**On screen:** Ciel panel.

**Action:** Ask: **Why is residual AML risk High?**

**Say while the answer loads:**

> Now I’ll ask the assistant to explain the result in the context of this assessment.

**After the response:**

> Ciel is using permission-checked assessment context and linked initiative context. It can point to the evidence behind the geography, partner, transaction, or monitoring concerns, and it can call out what remains incomplete.
>
> The answer is assistance with provenance. It is not a new authoritative score.

**Optional second prompt if time allows:**

> What is still missing before committee review?

**Say:**

> This is where the assistant saves analyst time: it makes the case easier to interrogate without giving the model control of the case.

**Add the name story if the room is receptive:**

> Ciel is a nod to an AI-like analytical partner from *That Time I Got Reincarnated as a Slime*. The French word *ciel* also means “sky,” which is a nice image for what we want: a wider view of the evidence and decision context. She can see more of the sky. She still cannot sign the approval.

### 8. Analyst review and override

**On screen:** analyst review, AI observation, override or recommendation area.

**Action:** Show the AI observation recommending High and the recorded analyst recommendation of Medium. Do not silently edit the fixture during the demo unless the environment requires it.

**Say:**

> The AI observation recommends High because important partner diligence and enhanced-monitoring evidence is incomplete.
>
> Daniel, the authorized analyst, reaches a different bounded recommendation: Medium for the initial launch because documented controls reduce part of the exposure.
>
> FULCRUM preserves both facts. The deterministic system calculation stays visible as High. The analyst recommendation is stored separately with the rationale and evidence used for the override.

**Emphasis:**

> Disagreement is not hidden or overwritten. It becomes part of the governed record.

### 9. Sandbox: bounded Jira experimentation

**On screen:** open `/sandbox` in a second tab. Show the fixed `FCRM` project, connection status, scenario selector, and preflight panel.

**Action:** Search the synthetic FCRM project or select a checked-in scenario. If time allows, show the AI scenario assistant generating a small scenario, then show validation before execution. Do not run cleanup during the presentation.

**Say:**

> The sandbox makes the Jira integration tangible without confusing integration experiments with the governed assessment workflow.
>
> It is restricted to synthetic work in the configured FCRM project. The assistant can draft a scenario using supported actions such as create, comment, assign, update, or transition. The first draft is immediately visible as JSON, then deterministic validation checks the project, fields, personas, workflow order, and supported operations.
>
> Nothing executes just because the model drafted it. JSON is a proposal, not a permission slip. The presenter reviews the preflight result and explicitly confirms the operation. The server then performs the permitted Jira action, verifies the result, and records an audit event.

**If showing the AI scenario assistant:**

> This is a useful example of bounded AI action planning. The model proposes a structured plan. The application validates, authorizes, executes, and verifies.

**If showing the stage evaluation:**

> The sandbox can also evaluate a Jira work item stage using deterministic checks plus an AI checklist review. The weighted result can be published back as a FULCRUM comment, but progression still requires the required assignment, freshness check, and explicit confirmation.

**Boundary line:**

> Jira provides work-management context here. It does not become authoritative for FULCRUM risk state or committee decisions.

### 10. Committee decision with conditions

**On screen:** decision-ready or committee review view.

**Action:** Show Helen Morgan’s decision: **Approved with Conditions**.

**Say:**

> The case now moves to the committee with its evidence, calculation, AI observations, analyst reasoning, override, and unresolved items intact.
>
> Helen Morgan makes the authorized committee decision: Approved with Conditions.
>
> The conditions are concrete obligations: enhanced transaction monitoring, lower initial transaction limits, additional HarborBridge due diligence, and a 30-day post-launch FCRM review. Each condition has ownership and a due date. An approval with conditions is not the same as saying every control is already complete.

### 11. Audit and reconstruction

**On screen:** read-only decision trace or audit view.

**Say:**

> The final test is whether someone can reconstruct the case later. FULCRUM preserves the source evidence, extracted provenance, AI observation, provider or deployment metadata, instruction version, deterministic calculation, analyst override, committee rationale, and condition history.
>
> That lets an examiner, reviewer, or future analyst distinguish a source fact from a system calculation, an AI observation, and a human judgment.

### 12. Close: the value proposition

**On screen:** decision trace, audit view, or final initiative state.

**Say:**

> FULCRUM’s value is accountable speed. It reduces the effort needed to assemble and understand a case while preserving the human gates that matter.
>
> The final record can answer: what changed, what evidence supported the finding, how the score was calculated, what the AI suggested, what the analyst challenged, who decided, and which conditions remain open.
>
> FULCRUM does not replace FCRM judgment. It gives that judgment a more complete, explainable, and auditable foundation.
>
> The short version is: we gave the analyst a lever, gave the assistant a sky-level view, and kept the signature line human.

## Backup and recovery lines

Use these lines without breaking the story:

- **AI response is slow:** “The seeded assessment remains authoritative; Ciel is an assistive explanation layer, so the decision path does not depend on a live model response.”
- **Jira is unavailable:** “The demo fixture preserves the linked initiative context. The production boundary keeps Jira integration server-side and prevents Jira from becoming authoritative for FULCRUM risk state.”
- **A judge asks whether AI approves:** “No. The application owns authorization, workflow, scoring, thresholds, and audit. Only authorized humans can make the material decision.”
- **A judge asks whether the data is real:** “No. This is synthetic hackathon data, including the people, partner, volumes, and conditions.”
- **A judge asks about the High versus Medium difference:** “High is the deterministic system calculation. Medium is the analyst’s documented recommendation for a bounded launch. Both remain visible, and the committee makes the final decision.”
- **A judge asks about regulatory advice:** “The demo shows governed assessment workflow and evidence lineage. It does not present uncited regulatory conclusions.”
- **A judge asks about the sandbox:** “The sandbox demonstrates bounded Jira experiments separately from the FULCRUM decision workspace. Integration context does not approve or reject an assessment.”
- **A judge asks what Document Intelligence does:** “It extracts document structure and preserves page-level provenance. It does not interpret policy, calculate risk, or make a decision.”
- **A judge asks whether Foundry is the decision engine:** “Foundry provides the governed model and agent runtime. FULCRUM owns context scope, tool authorization, deterministic scoring, workflow, confirmation, and audit.”
- **A judge asks whether the demo is model training:** “We are demonstrating a provider-neutral AI Gateway with Azure AI Foundry as the primary platform direction. The authoritative risk rules remain deterministic application logic.”

## Presenter guardrails

- Say **synthetic** when describing the initiative, people, partner, volumes, and conditions.
- Say **system calculation** for the deterministic High score.
- Say **AI observation** for model-generated findings or suggestions.
- Say **analyst recommendation** for Daniel’s Medium recommendation.
- Say **committee decision** for Helen’s Approved with Conditions outcome.
- Avoid saying that AI “decided,” “approved,” “cleared,” or “verified” the case.
- Avoid claiming production readiness for durable persistence, enterprise synchronization, or a live regulatory knowledge corpus. Those are staged follow-on capabilities.

## Traceability anchors

This demo directly illustrates:

- REQ-005: AI produces structured observations and drafts but never the final decision.
- REQ-006: ratings use configurable, versioned deterministic parameters.
- REQ-007: analyst review, challenge, overrides, rationale, and downstream impact are preserved.
- REQ-008: committee decisions are authorized and support conditional outcomes.
- REQ-009: the case can be reconstructed with AI provenance and context.
- REQ-010: Ciel provides grounded conversational Q&A over governed context.
- REQ-018: the FCRM Copilot drafts, explains, challenges, and identifies gaps while preserving human authority.
- REQ-021: workflow, AI, override, decision, and condition history remains immutable.
- REQ-030: the canonical synthetic Golden Initiative exercises the end-to-end journey.
- REQ-031: the AI Gateway, Azure AI Foundry route, and Azure AI Document Intelligence preserve provider and extraction boundaries.
- REQ-016 and REQ-017: the sandbox demonstrates a server-side Jira integration boundary without making Jira authoritative for FULCRUM risk state.
