# Risk model proposal

Research status: taxonomy and factor definitions require authoritative-source and FCRM-owner review. Proposed dimensions are configurable placeholders, not regulatory findings: customer/segment, product/service, geography, delivery/channel, transaction/activity, third-party/vendor, and process/control change.

Represent separately: inherent risk observations; control inventory and design/operating assessment; residual risk; confidence; evidence quality; and completeness. AI proposes cited observations and uncertainty. Deterministic scoring consumes validated factor values and a published `ScoringParameter` version, calculates explainable results, applies thresholds, and emits a calculation trace. Controls mitigate risk; they do not reduce it to zero. Humans can override a recommendation or configured result only through an authorized workflow with reason/category, identity, time, and impact.

No weights, thresholds, ratings, or regulatory mappings are set here. Those are `RESEARCH REQUIRED` and require configuration governance plus ADR review.
