
import assert from "node:assert/strict";
import {HessaAICore} from "../lib/ai/core";
import {critiqueTutorAnswer} from "../lib/ai/response-critic";
import {evaluateGenerativeQuality} from "../lib/ai/generative-quality-guard";
import type {ConversationTurn} from "../lib/ai/types";

async function main(){
  const core=new HessaAICore({
    name:"test-no-generation",
    async generate(){throw new Error("المثال المعروف يجب ألا يحتاج توليدًا");}
  });

  const history:ConversationTurn[]=[
    {role:"user",content:"أنا أقول -2 أصغر من -7، صح علي؟"},
    {role:"assistant",content:"المقارنة: -2 > -7. الأقرب للصفر أكبر."},
    {role:"user",content:"لسه ما استوعبت، اشرحها بشي من حياتنا."},
    {role:"assistant",content:"تخيل ميزان حرارة: -2 درجات أدفأ من -7 درجات."}
  ];

  for(const message of [
    "طيب جرب مثال غير الحرارة.",
    "عطني مثال جديد.",
    "وريني طريقة ثانية."
  ]){
    const result=await core.tutor({
      message,subject:"MATH",history
    });
    assert.equal(result.metadata.semanticRoute?.intent,"reteach");
    assert.equal(result.metadata.provider,"concept-teaching");
    assert.equal(result.verification.verified,true);
    assert.match(result.answer,/خط الأعداد/);
    assert.match(result.answer,/شوف/);
    assert.doesNotMatch(result.answer,/وشف/);
    assert.match(result.answer,/-2 > -7/);
  }

  const critique=critiqueTutorAnswer({
    message:"يرجع 200 صح؟",
    answer:"لا، ما يرجع للسعر الأصلي. السعر النهائي 198 ريال.",
    stage:"INTERMEDIATE",
    mode:"VERIFY_STUDENT_WORK",
    verified:true,
    studentWorkAvailable:true
  });
  assert.ok(!critique.issues.includes("no-explicit-judgment"));

  assert.equal(evaluateGenerativeQuality(
    "الإجابة: ما صح، لأن 2 أصغر من"
  ).ok,false);
  assert.equal(evaluateGenerativeQuality(
    "بين العددين السالبين، الأقرب للصفر أكبر."
  ).ok,true);
  console.log("PASS: طلب مثال مختلف والحكم الصريح والنهاية المبتورة");
}
main().catch(error=>{console.error(error);process.exitCode=1;});
