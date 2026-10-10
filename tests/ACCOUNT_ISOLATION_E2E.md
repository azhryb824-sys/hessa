# Account isolation E2E acceptance

Create Student A and Student B through /register.

1. A completes a lesson and assessment.
2. Record A attempt ID.
3. Log out A; log in B.
4. B requests A attempt through /api/exams/result?id=<A attempt>.
Expected: 404/401, never A data.
5. B dashboard/courses/exams must contain only B progress and attempts.
6. B sends AI tutor request containing A studentId in JSON.
Expected: server ignores supplied studentId and binds request to B session.
7. Repeat inverse direction.

Release fails if any cross-account progress, attempt, mastery or AI context is visible.
