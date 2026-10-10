
import assert from "node:assert/strict";
import {solveDeterministicMath} from "../lib/ai/math-engine";
import {HessaAICore} from "../lib/ai/core";

async function main(){
  for(const [question,result] of [
    ["شي سعره 200 ريال، زاد 10% وبعدين نقص 10%، يرجع 200 صح؟","198"],
    ["سعره 300 ريال زاد 20% ثم نقص 25%","270"],
    ["سعره 100 ريال زاد 0% ثم نقص 10%","90"],
    ["سعره ٢٠٠ ريال زاد ١٠% وبعدين نقص ١٠%","198"]
  ]){
    assert.equal(
      solveDeterministicMath(question)?.expectedAnswer,result,question
    );
  }
  assert.equal(solveDeterministicMath(
    "سعره 200 ريال زاد 10% ثم نقص 10% ثم زاد 5%"
  ),null);
  console.log("PASS: النسب المتتابعة وحدود المسألة");

  const core=new HessaAICore({
    name:"test-no-generation",
    async generate(){throw new Error("لم نتوقع توليدًا");}
  });

  const first=await core.tutor({
    message:"ليش 3 ÷ 1/2 تطلع أكبر من 3؟",
    subject:"MATH"
  });
  assert.equal(first.verification.expectedAnswer,"6");
  assert.equal(first.metadata.provider,"deterministic-math");
  assert.equal(first.metadata.visual,null);

  const second=await core.tutor({
    message:"ما وضحت لي، جرب مثال ثاني غير الكيك والبيتزا.",
    subject:"MATH",
    history:[
      {role:"user",content:"ليش 3 ÷ 1/2 تطلع أكبر من 3؟"},
      {role:"assistant",content:first.answer}
    ]
  });
  assert.equal(second.verification.verified,true);
  assert.equal(second.verification.expectedAnswer,"6");
  assert.match(second.answer,/لتر|عبوة|عبوات/);
  assert.notEqual(second.answer,first.answer);
  console.log("PASS: مثال مختلف ومصدر الرد والرسم");
}
main().catch(error=>{console.error(error);process.exitCode=1;});
