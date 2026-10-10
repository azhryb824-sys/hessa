
import assert from "node:assert/strict";
import {solveDeterministicMath,verifyMathAnswer} from "../lib/ai/math-engine";
import {resolveRectangleContext} from "../lib/ai/rectangle-context";
import {HessaAICore} from "../lib/ai/core";
import type {ConversationTurn} from "../lib/ai/types";

async function main(){
  for(const [question,expected] of [
    ["3 ÷ 1/2","6"],
    ["ماني فاهم ليه 3 ÷ 1/2 تطلع أكبر من 3","6"],
    ["٣ ÷ ١/٢","6"],
    ["4 ÷ (2/3)","6"],
    ["-3 ÷ 1/2","-6"],
  ]){
    assert.equal(
      solveDeterministicMath(question)?.expectedAnswer,
      expected,
      question
    );
  }

  assert.equal(
    solveDeterministicMath("2 + 3 * 4")?.expectedAnswer,"14"
  );
  assert.equal(solveDeterministicMath("احسب 2 + 3 * 4"),null);
  assert.equal(solveDeterministicMath("2 + 3 * 4 + 5"),null);
  assert.equal(verifyMathAnswer("96 ÷ 8","الناتج 120").verified,false);
  assert.equal(verifyMathAnswer("96 ÷ 8","الناتج 12.5").verified,false);
  assert.equal(verifyMathAnswer("96 ÷ 8","الناتج 12.").verified,true);
  console.log("PASS: قسمة الكسور وحدود التعبير وفحص الأرقام");

  const history:ConversationTurn[]=[
    {role:"user",content:"لوحة مستطيلة طولها 9 سم وعرضها 5 سم"},
    {role:"user",content:"كم مساحتها؟"},
  ];

  assert.equal(resolveRectangleContext(
    "لو ضاعفت الطول وخليت العرض زي ما هو، وش تصير المساحة؟",
    history,true
  )?.verification.expectedAnswer,"90");

  assert.equal(resolveRectangleContext(
    "لو ضاعفت الطول والعرض، كم المساحة؟",history,true
  )?.verification.expectedAnswer,"180");

  assert.equal(resolveRectangleContext(
    "لو ضاعفت العرض، كم المحيط؟",history,true
  )?.verification.expectedAnswer,"38");

  assert.equal(resolveRectangleContext(
    "لو نقصت الطول، كم المساحة؟",history,true
  )?.verification.verified,false);

  assert.equal(resolveRectangleContext(
    "لو ضاعفت الطول، كم المساحة؟",history,false
  ),null);

  const changed:ConversationTurn[]=[
    ...history,
    {role:"user",content:"لو ضاعفت الطول، كم المساحة؟"}
  ];

  assert.equal(resolveRectangleContext(
    "طيب لو ضاعفت الطول والعرض كلهم؟",changed,true
  )?.verification.verified,false);
  console.log("PASS: تغيير الأبعاد وطلب توضيح المرجع");

  const core=new HessaAICore({
    name:"test-no-generation",
    async generate(){
      throw new Error("هذه الحالات لا تحتاج توليدًا");
    }
  });

  const division=await core.tutor({
    message:"ماني فاهم ليه 3 ÷ 1/2 تطلع أكبر من 3",
    subject:"MATH",
    student:{age:13,preferredDialect:"saudi"}
  });

  assert.equal(division.verification.expectedAnswer,"6");
  assert.equal(division.verification.verified,true);

  const followup=await core.tutor({
    message:"خلاص، دحين ورّيني الحل وعلمني كيف أتأكد منه.",
    subject:"MATH",
    history:[
      {role:"user",content:"96 ÷ 8، لا تعطيني الناتج"},
      {role:"assistant",content:"جرّب العملية العكسية"}
    ]
  });

  console.log("تشخيص طلب كشف الحل:", JSON.stringify({
    answer:followup.answer,
    verification:followup.verification
  },null,2));
  assert.equal(followup.verification.expectedAnswer,"12");
  assert.equal(followup.verification.verified,true);
  assert.match(followup.answer,/12\s*×\s*8\s*=\s*96/);
  console.log("PASS: دمج شرح الكسور والتحقق من سياق الحوار");
}

main().catch(error=>{
  console.error(error);
  process.exitCode=1;
});
