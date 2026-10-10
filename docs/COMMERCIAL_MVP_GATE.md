# Commercial MVP release gate

## Hard blockers before taking money
- [ ] Replace demo/seed password handling with a password KDF and migrate demo accounts.
- [ ] Protect all student APIs with session authorization; remove every hard-coded demo student lookup.
- [ ] Run Prisma migrations and production build on the deployment target.
- [ ] Add rate limiting for auth and AI endpoints.
- [ ] Configure HESSA_SESSION_SECRET and production database backups.
- [ ] Connect a production inference endpoint or explicitly sell only deterministic/RAG-supported AI scope.
- [ ] Complete legal privacy/terms review, especially because students may be minors.
- [ ] Integrate a Saudi-compatible payment provider and verify webhook signatures before activating paid access.
- [ ] Add subscription entitlement checks server-side.
- [ ] Run end-to-end account-isolation tests with at least two students.

## MVP scope
Sell one focused product first: primary mathematics adaptive tutoring. Do not market unsupported subjects as production-ready.
