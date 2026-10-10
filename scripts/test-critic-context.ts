
import { strict as assert } from "node:assert";
import { critiqueTutorAnswer as critique } from "../lib/ai/response-critic";

function review(answer:string){
 return critique({
  message:"اشرح المفهوم",
  answer,
  stage:"PRIMARY",
  mode:"CONCEPT_EXPLANATION",
  verified:true
 });
}
assert.ok(!review(
 "تخيل ملعبًا: طول السياج حوله يمثل المحيط، والعشب الذي يغطي أرضه يمثل المساحة."
).issues.includes("rule-without-why"));

assert.ok(!review(
 "مستطيلات لها نفس الطول ممكن تختلف مساحاتها إذا اختلف عرضها."
).issues.includes("rule-without-why"));

assert.ok(review(
 "مساحة المستطيل = الطول × العرض."
).issues.includes("rule-without-why"));

assert.ok(!critique({
 message:"تأكد من حلي",
 answer:"أرسل لي السؤال وخطوات حلك حتى أراجعها.",
 stage:"PRIMARY",
 mode:"VERIFY_STUDENT_WORK",
 verified:false,
 studentWorkAvailable:false
}).issues.includes("no-explicit-judgment"));

console.log("PASS: التفسير وطلب الحل غير المرفق");
