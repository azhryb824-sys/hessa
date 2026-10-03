import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "../lib/password";
import { adaptiveEvidence } from "../lib/ai/adaptive";
import { canTeach, overlaps } from "../lib/policies";
import { analyzeLearningState } from "../lib/ai/learning-engine";
test("passwords are salted and plaintext credentials are rejected", () => {
  const a = hashPassword("example-strong-password"),
    b = hashPassword("example-strong-password");
  assert.notEqual(a, b);
  assert.ok(verifyPassword("example-strong-password", a));
  assert.equal(verifyPassword("wrong", a), false);
  assert.equal(verifyPassword("demo-password", "demo-password"), false);
});
test("no answers means no mastery claim", () => {
  const a = adaptiveEvidence([]);
  assert.equal(a.mastery, null);
  assert.equal(a.evidenceLevel, "INSUFFICIENT");
});
test("repeating a question cannot inflate independent evidence", () => {
  const answer = { questionId: "q1", isCorrect: true };
  const a = adaptiveEvidence(
    Array.from({ length: 100 }, (_, i) => ({
      attemptId: String(i),
      completedAt: new Date().toISOString(),
      answers: [answer],
    })),
  );
  assert.equal(a.uniqueQuestions, 1);
  assert.equal(a.evidenceLevel, "INSUFFICIENT");
});
test("recent evidence outweighs old evidence", () => {
  const history = [
    {
      attemptId: "a",
      completedAt: new Date().toISOString(),
      answers: [{ questionId: "recent", isCorrect: true }],
    },
    {
      attemptId: "b",
      completedAt: "2020-01-01",
      answers: [{ questionId: "old", isCorrect: false }],
    },
  ];
  assert.ok(adaptiveEvidence(history).mastery! > 50);
});
test("teacher matching rejects cross-gender and incomplete profiles", () => {
  const dob = new Date("2018-01-01");
  assert.ok(canTeach("MALE", "MALE", dob));
  assert.ok(canTeach("FEMALE", "FEMALE", dob));
  assert.equal(canTeach("MALE", "FEMALE", dob), false);
  assert.equal(canTeach("FEMALE", "MALE", dob), false);
  assert.equal(canTeach(null, "MALE", dob), false);
  assert.equal(canTeach("MALE", "MALE", null), false);
});
test("adjacent classes are allowed but overlapping ones are rejected", () => {
  const a = new Date("2026-01-01T10:00Z");
  assert.equal(overlaps(a, 60, new Date("2026-01-01T11:00Z"), 45), false);
  assert.equal(overlaps(a, 60, new Date("2026-01-01T10:59Z"), 45), true);
});
test("analysis without assessments reports limited evidence", () => {
  const d = analyzeLearningState({
    name: "طالب",
    learningLevel: "BEGINNER",
    learningGoal: null,
    dailyMinutes: 30,
    courses: [],
    exams: [],
    assessmentHistory: [],
  });
  assert.equal(d.overall.examScore, null);
  assert.equal(d.analysis.evidenceQuality, "LOW");
});
