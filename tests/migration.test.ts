import test from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
test("upgrade preserves populated legacy attempts, evidence and learning progress", () => {
  const db = new Database(":memory:");
  try {
    const migrations = readdirSync("prisma/migrations")
      .filter((n) => /^\d/.test(n))
      .sort();
    for (const name of migrations.slice(0, 3))
      db.exec(
        readFileSync(
          path.join("prisma/migrations", name, "migration.sql"),
          "utf8",
        ),
      );
    db.exec(`INSERT INTO User(id,name,email,password,role,updatedAt) VALUES('t','Teacher','teacher@test','legacy','TEACHER',CURRENT_TIMESTAMP),('s','Student','student@test','legacy','STUDENT',CURRENT_TIMESTAMP);
 INSERT INTO Course(id,title,subject,status,teacherId,updatedAt) VALUES('c','Math','Math','PUBLISHED','t',CURRENT_TIMESTAMP);
 INSERT INTO Lesson(id,title,type,duration,"order",courseId,updatedAt) VALUES('l','Lesson','READING',20,1,'c',CURRENT_TIMESTAMP);
 INSERT INTO Enrollment(id,userId,courseId,progress) VALUES('e','s','c',72);
 INSERT INTO LessonProgress(id,userId,lessonId,completed,completedAt) VALUES('p','s','l',1,CURRENT_TIMESTAMP);
 INSERT INTO Assessment(id,title,type,courseId,updatedAt) VALUES('a','Exam','QUIZ','c',CURRENT_TIMESTAMP);
 INSERT INTO AssessmentQuestion(id,question,correctAnswer,points,assessmentId) VALUES('q','5 + 7','12',1,'a');
 INSERT INTO AssessmentAttempt(id,score,completedAt,userId,assessmentId) VALUES('attempt',100,CURRENT_TIMESTAMP,'s','a');
 INSERT INTO AssessmentAnswer(id,attemptId,questionId,studentAnswer,correctAnswer,isCorrect,pointsAwarded) VALUES('answer','attempt','q','12','12',1,1);`);
    for (const name of migrations.slice(3))
      db.exec(
        readFileSync(
          path.join("prisma/migrations", name, "migration.sql"),
          "utf8",
        ),
      );
    const attempt = db
      .prepare("SELECT * FROM AssessmentAttempt WHERE id=?")
      .get("attempt") as {
      submissionKey: string;
      totalPoints: number;
      questionsSnapshot: string;
    };
    assert.equal(attempt.submissionKey, "legacy:attempt");
    assert.equal(attempt.totalPoints, 1);
    assert.equal(JSON.parse(attempt.questionsSnapshot)[0].correctAnswer, "12");
    const answer = db
      .prepare("SELECT * FROM AssessmentAnswer WHERE id=?")
      .get("answer") as { questionText: string; maxPoints: number };
    assert.equal(answer.questionText, "5 + 7");
    assert.equal(answer.maxPoints, 1);
    assert.equal(
      (
        db.prepare("SELECT progress FROM Enrollment WHERE id=?").get("e") as {
          progress: number;
        }
      ).progress,
      100,
    );
    assert.equal(
      (db.prepare("SELECT COUNT(*) AS n FROM User").get() as { n: number }).n,
      2,
    );
  } finally {
    db.close();
  }
});
