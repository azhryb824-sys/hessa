
import { strict as assert } from "node:assert";
import { resolveFractionTeaching as teach } from "../lib/ai/fraction-teaching";

const cases = [
 ["أنا حسبت 2/3 + 1/3 = 3/6، وين الغلط؟", "1"],
 ["أنا حسبت 3/5 + 1/5 = 4/10، صح؟", "4/5"],
 ["أنا حسبت 1/2 + 1/3 = 2/5، صح؟", "5/6"],
 ["أنا حسبت 5/6 - 1/6 = 4/6، صح؟", "2/3"],
 ["أنا حسبت ٢/٣ + ١/٣ = ٣/٦، صح؟", "1"],
 ["أنا أعتقد 1/8 أكبر من 1/3 لأن 8 أكبر، صح؟", "1/8 < 1/3"],
 ["قارن 3/4 و 2/3", "3/4 > 2/3"],
 ["قارن 1/2 و 2/4", "1/2 = 2/4"],
 ["قارن -1/2 و 1/3", "-1/2 < 1/3"]
] as const;

for (const [question, expected] of cases) {
 const result=teach(question,true,true);
 assert.ok(result);
 assert.equal(result.verification.expectedAnswer,expected);
 assert.equal(result.verification.verified,true);
 console.log("PASS",question,"=>",expected);
}

assert.equal(teach("2/3 + 1/3",false,true),null);
assert.equal(teach("قارن 1/0 و 1/3",true,true),null);
assert.equal(teach("قارن 1/2 و 1/3 و 1/4",true,true),null);

// لا نحكم بأن النتيجة المكافئة خطأ.
assert.ok(teach("أنا حسبت 5/6 - 1/6 = 4/6، صح؟",true,true)!
 .answer.startsWith("نعم"));

console.log("PASS: التلميح، المقام صفر، والتكافؤ");
