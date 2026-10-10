
import { strict as assert } from "node:assert";
import { buildLearningVisual } from "../lib/ai/learning-visuals";

for (const [question, expected] of [
  ["9 × 7", 63],
  ["٩ × ٧", 63],
  ["4 × 6", 24],
  ["10 × 10", 100]
] as const) {
  const visual=buildLearningVisual(question);
  assert.ok(visual);
  assert.equal((visual.text.match(/●/g)??[]).length,expected);
  console.log("PASS",question,expected);
}
assert.equal(buildLearningVisual("20 × 20"),null);
console.log("PASS: لا يظهر رسم مختصر يوحي بنتيجة خاطئة");
