import { requireStudent } from "@/lib/access";
import { prisma } from "@/lib/db/prisma";
import { fail, HttpError } from "@/lib/http";
export async function GET(request: Request) {
  try {
    const user = await requireStudent();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) throw new HttpError(400, "معرف المحاولة مطلوب");
    const a = await prisma.assessmentAttempt.findFirst({
      where: { id, userId: user.id },
      include: { assessment: { include: { course: true } }, answers: true },
    });
    if (!a) throw new HttpError(404, "النتيجة غير موجودة");
    return Response.json(
      {
        success: true,
        attempt: {
          id: a.id,
          score: a.score,
          completedAt: a.completedAt,
          exam: {
            title: a.assessment.title,
            subject: a.assessment.course?.subject || "عام",
            type: a.assessment.type,
          },
        },
        result: {
          score: a.score,
          earnedPoints: a.answers.reduce((s, x) => s + x.pointsAwarded, 0),
          totalPoints: a.totalPoints,
          totalQuestions: a.totalQuestions,
          answeredQuestions: a.answers.length,
        },
        answers: (
          JSON.parse(a.questionsSnapshot) as {
            id: string;
            question: string;
            options: string | null;
            correctAnswer: string | null;
            points: number;
          }[]
        ).map((q) => {
          const x = a.answers.find((x) => x.questionId === q.id);
          return {
            id: x?.id || q.id,
            questionId: q.id,
            question: q.question,
            options: q.options,
            studentAnswer: x?.studentAnswer || null,
            correctAnswer: q.correctAnswer,
            isCorrect: x?.isCorrect || false,
            pointsAwarded: x?.pointsAwarded || 0,
            points: q.points,
          };
        }),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return fail(e);
  }
}
