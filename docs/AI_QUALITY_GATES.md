# AI quality gates

Production promotion requires:
1. deterministic math suite: 100% for supported skills;
2. no answer marked verified when the verifier cannot prove it;
3. curriculum retrieval uses reviewed, versioned chunks only;
4. model benchmark records correctness, grounding, Arabic clarity, age fit, latency and VRAM;
5. a candidate model may not replace the current model if any hard-gate metric regresses.

The open-weight LLM is a generator, not the source of truth. Subject tools and verifiers remain authoritative for claims they can prove.
