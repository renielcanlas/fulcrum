# Assistant and provider portability

FULCRUM Assistant answers from governed case retrieval, with citations and labels for known fact, retrieved evidence, inference, recommendation, and unknown. It refuses or escalates when context is absent or authority is insufficient; conversation history is not authoritative. Query tools are read-only by default.

`AIProvider` is an internal interface with adapters for OpenAI, Anthropic, Google, and future providers. Domain entities, scoring, workflow, authorization, audit, schemas, and evaluations remain provider-independent. Material output records provider/model/version, prompt or instruction version, token counts, latency, and cost where available.
