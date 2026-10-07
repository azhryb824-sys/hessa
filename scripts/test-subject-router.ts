import assert from"node:assert/strict";import{routeSubject}from"../lib/ai/router";
assert.equal(routeSubject("كيف أراجع صلاحية هذا الاستدلال؟","MATH"),"MATH");
assert.equal(routeSubject("اشرح لي هذه الفكرة","SCIENCE"),"SCIENCE");
assert.equal(routeSubject("ما ناتج 7 × 8؟"),"MATH");
assert.equal(routeSubject("ما معنى الفاعل؟"),"ARABIC");
assert.equal(routeSubject("سؤال عام غير مصنف"),"GENERAL");
console.log("Subject router regression tests: PASS");