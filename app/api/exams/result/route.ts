import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const student = await requireStudent();
    const attemptId = request.nextUrl.searchParams.get("id");

    if (!attemptId) {
      return NextResponse.json(
        {
          success: false,
          message: "Attempt ID is required",
        },
        { status: 400 }
      );
    }

    const attempt = await prisma.assessmentAttempt.findUnique({
      where: {
        id: attemptId,
        userId: student.id,
      },
      include: {
        assessment: {
          select: {
            title: true,
            type: true,
            courseId: true,
            questions: {
              select: {
                id: true,
                question: true,
                options: true,
                correctAnswer: true,
                points: true,
              },
            },
          },
        },
        answers: {
          select: {
            id: true,
            questionId: true,
            studentAnswer: true,
            correctAnswer: true,
            isCorrect: true,
            pointsAwarded: true,
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json(
        {
          success: false,
          message: "Attempt not found",
        },
        { status: 404 }
      );
    }

    const course = attempt.assessment.courseId
      ? await prisma.course.findUnique({
          where: {
            id: attempt.assessment.courseId,
          },
          select: {
            subject: true,
          },
        })
      : null;

    const totalPoints = attempt.assessment.questions.reduce(
      (total, question) => total + question.points,
      0
    );

    const totalQuestions = attempt.assessment.questions.length;

    const earnedPoints = attempt.answers.reduce(
      (total, answer) => total + answer.pointsAwarded,
      0
    );

    const answeredQuestions = attempt.answers.filter(
      (answer) => answer.studentAnswer !== null
    ).length;

    const answerMap = new Map(
      attempt.answers.map((answer) => [
        answer.questionId,
        answer,
      ])
    );

    const answers = attempt.assessment.questions.map(
      (question) => {
        const answer = answerMap.get(question.id);

        return {
          id: answer?.id ?? `${attempt.id}-${question.id}`,
          questionId: question.id,
          question: question.question,
          options: question.options,
          studentAnswer: answer?.studentAnswer ?? null,
          correctAnswer:
            answer?.correctAnswer ??
            question.correctAnswer ??
            null,
          isCorrect: answer?.isCorrect ?? false,
          pointsAwarded: answer?.pointsAwarded ?? 0,
          points: question.points,
        };
      }
    );

    return NextResponse.json({
      success: true,

      attempt: {
        id: attempt.id,
        score: attempt.score,
        completedAt: attempt.completedAt,

        exam: {
          title: attempt.assessment.title,
          subject: course?.subject ?? "عام",
          type: attempt.assessment.type,
        },
      },

      result: {
        score: attempt.score,
        earnedPoints,
        totalPoints,
        answeredQuestions,
        totalQuestions,
      },

      answers,
    });
  } catch (error) {
    console.error("Exam result API error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}