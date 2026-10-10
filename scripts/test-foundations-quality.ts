
import assert from "node:assert/strict";
import {teachFoundationalConcept} from "../lib/ai/foundational-concepts";
import {critiqueTutorAnswer} from "../lib/ai/response-critic";
import {evaluateGenerativeQuality} from "../lib/ai/generative-quality-guard";
import {evaluateSaudiLinguisticQuality} from "../lib/ai/saudi-linguistic-quality";
import {HessaAICore} from "../lib/ai/core";

async function main(){
  assert.match(teachFoundationalConcept(
    "أنا أقول -2 أصغر من -7 لأن 2 أصغر من 7، صح علي؟"
  )!.answer,/-2 > -7/);
  assert.match(teachFoundationalConcept("قارن -9 و -3")!.answer,/-9 < -3/);
  assert.match(teachFoundationalConcept("قارن -٢ و -٧")!.answer,/-2 > -7/);
  assert.equal(teachFoundationalConcept("قارن -1/8 و -1/3"),null);
  assert.equal(teachFoundationalConcept("احسب -2 + -7"),null);
  assert.equal(teachFoundationalConcept("احسب ثلث 12"),null);
  assert.equal(teachFoundationalConcept("اشرح ثلثي الكمية"),null);

  const core=new HessaAICore({
    name:"test-no-generation",
    async generate(){throw new Error("هذه الحالات لا تحتاج توليدًا");}
  });

  const first=await core.tutor({
    message:"أنا أقول -2 أصغر من -7 لأن 2 أصغر من 7، صح علي؟",
    subject:"MATH"
  });
  assert.match(first.answer,/-2 > -7/);

  const second=await core.tutor({
    message:"لسه ما استوعبت، اشرحها بشي من حياتنا.",
    subject:"MATH",
    history:[
      {role:"user",content:"أنا أقول -2 أصغر من -7، صح علي؟"},
      {role:"assistant",content:first.answer}
    ]
  });
  assert.match(second.answer,/حرارة/);
  assert.notEqual(first.answer,second.answer);

  const child=await core.tutor({
    message:"أنا عمري 8 سنين، ما فهمت وش يعني الثلث، اشرح لي شوي شوي.",
    subject:"MATH",
    student:{age:8}
  });
  assert.match(child.answer,/قد بعض|متساوي/);
  assert.ok(child.answer.split(/\s+/).length<60);

  const unequal=await core.tutor({
    message:"يعني لو قسمتها ثلاث قطع وحدة كبيرة واثنتين صغار، الكبيرة ثلث؟",
    subject:"MATH",
    student:{age:8}
  });
  assert.match(unequal.answer,/لا،/);
  assert.match(unequal.answer,/متساوي|قد بعض/);
  assert.match(unequal.answer,/نفس المقدار|أجزاء متساوية/);

  const critique=critiqueTutorAnswer({
    message:"ليش القسمة على كسر تصير أكبر؟",
    answer:"القسمة تعني عد الأجزاء. الجزء أصغر من الواحد، فعشان كذا عدد الأجزاء أكبر.",
    stage:"INTERMEDIATE",mode:"CONCEPT_EXPLANATION",verified:true
  });
  assert.ok(!critique.issues.includes("rule-without-why"));

  assert.equal(evaluateSaudiLinguisticQuality("خاطئ، بس.").ok,false);
  assert.equal(evaluateSaudiLinguisticQuality("النص الكيكة أكبر.").ok,false);
  assert.equal(evaluateGenerativeQuality(
    "خلّنا نمشي خطوة خطوة، ونتأكد من كل خطوة قبل الانتقال للي بعدها."
  ).ok,false);
  console.log("PASS: السوالب والثلث وأمثلة الشرح وفحوص الجودة");
}
main().catch(error=>{console.error(error);process.exitCode=1;});
