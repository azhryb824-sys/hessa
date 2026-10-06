# Hessa model benchmark

Run every candidate model against the same frozen dataset. Do not select by parameter count alone.

Candidates: Qwen3.5 large MoE, gpt-oss-120b, DeepSeek-R1 or distilled variants that meet deployment constraints.

Score dimensions:
- final-answer correctness (hard gate for deterministic math)
- curriculum grounding / unsupported-claim rate
- Arabic clarity and Saudi educational phrasing
- age appropriateness
- step quality without leaking unnecessary reasoning
- latency, tokens/sec, peak VRAM and cost per 1M generated tokens

A model fails the math gate when its answer disagrees with Hessa's deterministic verifier, regardless of fluency. Production curriculum chunks must be versioned, grade-scoped and human-reviewed before indexing.
