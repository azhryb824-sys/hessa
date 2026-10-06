# Saudi curriculum ingestion policy

Hessa's production RAG must ingest curriculum from an authorized/official source and preserve source metadata. Import does not equal approval: imported chunks default to unreviewed and retrieval excludes unreviewed content.

Required metadata: subject, stage, grade, semester when known, unit, lesson, source, curriculum version, review state.

Recommended workflow:
1. acquire the current official digital course;
2. segment by lesson/concept, not arbitrary token windows;
3. preserve headings, examples and learning objectives;
4. attach grade/semester/unit/lesson metadata;
5. run duplicate and stale-version checks;
6. human curriculum review;
7. set reviewed=true only after approval;
8. index for retrieval and run grounding evaluations.

Do not silently mix curriculum editions. A newer edition must be separately versioned and evaluated before promotion.
