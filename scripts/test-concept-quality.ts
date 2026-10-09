
import { strict as assert } from "node:assert";
import { teachKnownConcept } from "../lib/ai/concept-tutor";
import { evaluateGenerativeQuality as quality } from "../lib/ai/generative-quality-guard";

assert.equal(
 teachKnownConcept("ما الفرق بين المساحة والمحيط؟",{age:9})?.concept,
 "area-vs-perimeter"
);
assert.equal(
 teachKnownConcept("هل يمكن تحديد مساحة مستطيل إذا عرفنا طوله فقط؟")?.concept,
 "rectangle-missing-dimension"
);
assert.equal(
 teachKnownConcept("اشرح لي معنى النصف",{age:8})?.concept,
 "half-as-equal-parts"
);

// هذه الأسئلة لا يجوز اختزالها إلى نقص أحد البعدين.
assert.notEqual(
 teachKnownConcept("مستطيل طوله فقط 5 وعرضه يساوي طوله، هل يمكن حساب المساحة؟")?.concept,
 "rectangle-missing-dimension"
);
assert.notEqual(
 teachKnownConcept("هل يمكن حساب مساحة مستطيل من طوله فقط ونسبة الطول إلى العرض؟")?.concept,
 "rectangle-missing-dimension"
);

assert.equal(quality("الإجابة: **لا، لا يمكن إذا عرفنا").ok,false);
assert.equal(quality("المساحة مساحة مساحة شكل").ok,false);
assert.equal(quality("الخطأ فيك هو أنك تظن ذلك.").ok,false);
assert.equal(quality("المحيط طول حدود الشكل.").ok,true);

console.log("PASS: المفاهيم وحدود القواعد وفحوص الجودة");
