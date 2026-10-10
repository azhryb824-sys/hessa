
import { strict as assert } from "node:assert";
import { teachKnownConcept as teach } from "../lib/ai/concept-tutor";
import { buildLearningVisual as visual } from "../lib/ai/learning-visuals";

assert.equal(
 teach("مثلث قاعدته 10 سم، كم مساحته؟")?.concept,
 "triangle-missing-height"
);
assert.equal(
 teach("مثلث قاعدته 14 سم، كم مساحته؟")?.concept,
 "triangle-missing-height"
);

// لا نحكم بنقص المعطيات عند وجود معلومات قد تحدد الارتفاع.
for(const question of [
 "مثلث قاعدته 10 سم وارتفاعه 6 سم، كم مساحته؟",
 "مثلث متساوي الأضلاع قاعدته 10 سم، كم مساحته؟",
 "مثلث قائم قاعدته 10 سم وضلع آخر 6 سم، كم مساحته؟"
]){
 assert.notEqual(teach(question)?.concept,"triangle-missing-height");
}

assert.equal(
 teach("ليش أي عدد نضربه في صفر يعطينا صفر؟",{age:8})?.concept,
 "zero-product-foundation"
);
assert.equal(
 teach("أحتاج شريطًا حول حواف لوحة، أقيس مساحتها ولا محيطها؟")?.concept,
 "perimeter-practical-choice"
);

assert.equal(visual("-1/8"),null);
assert.equal(visual("قارن 5/6 و7/9"),null);
assert.equal(visual("3/4 - 1/4 = 2/4"),null);
assert.equal(visual("5/3"),null);
assert.equal(visual("3/4")?.text,"■ ■ ■ □");

console.log("PASS: المفاهيم الجديدة وحدود القواعد والرسوم");
