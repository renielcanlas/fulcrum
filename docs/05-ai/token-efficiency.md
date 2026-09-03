# Token-efficiency strategy

Route simple extraction/classification to smaller models; reserve stronger reasoning for synthesis/challenge. Retrieve only relevant, access-approved chunks; use structured intermediate artifacts, bounded prompts, caching keyed by source/version, and compact summaries with provenance. Record input/output tokens, model, latency, cost, cache hits, and quality so savings cannot hide degraded grounding. Prefer deterministic code whenever no language uncertainty exists.
