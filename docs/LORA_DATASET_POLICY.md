# Hessa LoRA dataset policy

LoRA teaches tutor behavior, not textbook storage.

Include:
- age-appropriate explanations;
- alternative explanations;
- misconception diagnosis;
- remediation style;
- concise feedback and mastery dialogue.

Keep factual curriculum knowledge in versioned RAG where practical. Do not train on unreviewed curriculum chunks. Generated training rows require automated validation and human sampling before a production fine-tune. Maintain train/validation/test separation by skill/template family to reduce leakage.
