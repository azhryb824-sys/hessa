# Adaptive mastery loop

Hessa does not promote a learner based on chat sentiment.

Evidence loop:
TEACH -> PRACTICE -> DIAGNOSE (after an early error) -> REMEDIATE (persistent weakness) -> RETEST -> ADVANCE.

Mastery requires multiple attempts, threshold accuracy, recent-performance support and non-trivial confidence. Per-student/per-skill state is persisted in SkillMastery. Conversation alone cannot mark a skill mastered.

Dataset generation is deterministic and split into train/validation/test. Production fine-tuning must keep evaluation data isolated and must pass the math and tutor-behavior quality gates before promotion.
