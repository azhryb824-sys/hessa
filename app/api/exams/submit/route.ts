import { requireStudent, requireEnrollment } from "@/lib/access";
import { prisma } from "@/lib/db/prisma";
import { fail, HttpError, readBody, cleanText, rateLimit } from "@/lib/http";
export async function POST(request: Request) {
  try {
    const user = await requireStudent();
    const b = await readBody(request);
    await rateLimit(`exam:${user.id}`, 15);
    const assessmentId = cleanText(b.assessmentId, 200);
    const submissionKey = cleanText(b.submissionKey, 100);
    const answers = b.answers;
    if (
      !assessmentId ||
      !submissionKey ||
      !answers ||
      typeof answers !== "object" ||
      Array.isArray(answers)
    )
      throw new HttpError(400, "بيانات التسليم غير مكتملة");
    const exam = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { questions: true },
    });
    if (!exam) throw new HttpError(404, "الاختبار غير موجود");
    await requireEnrollment(user.id, exam.courseId);
    if (!exam.questions.length)
      throw new HttpError(409, "الاختبار لم يجهز بعد");
    const values = answers as Record<string, unknown>;
    if (
      Object.keys(values).some((k) => !exam.questions.some((q) => q.id === k))
    )
      throw new HttpError(400, "إجابة لسؤال غير موجود");
    const records = exam.questions.flatMap((q) => {
      const value = values[q.id];
      if (value === undefined || value === null || value === "") return [];
      if (typeof value !== "string" || value.length > 2000)
        throw new HttpError(400, "صيغة الإجابة غير صحيحة");
      const studentAnswer = value.trim();
      const isCorrect =
        q.correctAnswer !== null && studentAnswer === q.correctAnswer.trim();
      return [
        {
          questionId: q.id,
          questionText: q.question,
          optionsSnapshot: q.options,
          maxPoints: q.points,
          studentAnswer,
          correctAnswer: q.correctAnswer,
          isCorrect,
          pointsAwarded: isCorrect ? q.points : 0,
        },
      ];
    });
    if (!records.length) throw new HttpError(400, "أجب عن سؤال واحد على الأقل");
    const totalPoints = exam.questions.reduce((s, q) => s + q.points, 0);
    const earnedPoints = records.reduce((s, a) => s + a.pointsAwarded, 0);
    const attempt = await prisma.$transaction(async (tx) => {
      const previous = await tx.assessmentAttempt.findUnique({
        where: { submissionKey },
        include: { answers: true },
      });
      if (previous) {
        if (
          previous.userId !== user.id ||
          previous.assessmentId !== assessmentId
        )
          throw new HttpError(409, "معرف التسليم مستخدم");
        return previous;
      }
      const count = await tx.assessmentAttempt.count({
        where: { userId: user.id, assessmentId },
      });
      if (count >= exam.maxAttempts)
        throw new HttpError(409, "وصلت إلى الحد الأقصى للمحاولات");
      return tx.assessmentAttempt.create({
        data: {
          userId: user.id,
          assessmentId,
          submissionKey,
          totalPoints,
          totalQuestions: exam.questions.length,
          questionsSnapshot: JSON.stringify(
            exam.questions.map((q) => ({
              id: q.id,
              question: q.question,
              options: q.options,
              correctAnswer: q.correctAnswer,
              points: q.points,
            })),
          ),
          score: totalPoints
            ? Math.round((100 * earnedPoints) / totalPoints)
            : 0,
          completedAt: new Date(),
          answers: { create: records },
        },
        include: { answers: true },
      });
    });
    return Response.json({
      success: true,
      attemptId: attempt.id,
      result: {
        score: attempt.score,
        earnedPoints: attempt.answers.reduce((s, a) => s + a.pointsAwarded, 0),
        totalPoints: attempt.totalPoints,
        answeredQuestions: attempt.answers.length,
        totalQuestions: attempt.totalQuestions,
      },
    });
  } catch (e) {
    return fail(e);
  }
}
