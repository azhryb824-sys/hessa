# Hessa AI Core v1

Flow: request -> subject router -> learner pedagogy -> retrieval -> subject engine -> verification -> response.

The core is provider-agnostic. `HessaModelProvider` is the extension point for a local/open-weight LLM and subject LoRA adapters. The first Math Engine deterministically handles simple binary arithmetic and refuses to mark unsupported mathematics as verified. Retrieval accepts curriculum chunks through `retrievedContext`; production RAG should add a persistent curriculum index with source, grade, semester and version metadata.

API: `POST /api/ai/tutor`.

Example body:
`{"message":"3 + 5 كم؟","subject":"الرياضيات","student":{"age":8,"grade":"الثالث الابتدائي","preferredDialect":"saudi"}}`
