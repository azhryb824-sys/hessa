import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const assessmentId = body.assessmentId;
    const answers = body.answers;

    if (!assessmentId) {
      return NextResponse.json(
        {
          success: false,
          message: "Assessment ID is required",
        },
        { status: 400 }
      );
    }

    if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
      return NextResponse.json(
        {
          success: false,
          message: "Answers are required",
        },
        { status: 400 }
      );
    }

    const student = await prisma.user.findUnique({
      where: {
        email: "student@hessa.local",
      },
    });

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message: "Student not found",
        },
        { status: 404 }
      );
    }

    const assessment = await prisma.assessment.findUnique({
      where: {
        id: assessmentId,
      },
      include: {
        questions: {
          select: {
            id: true,
            question: true,
            correctAnswer: true,
            points: true,
          },
        },
      },
    });

    if (!assessment) {
      return NextResponse.json(
        {
          success: false,
          message: "Exam not found",
        },
        { status: 404 }
      );
    }

    let earnedPoints = 0;
    let totalPoints = 0;

    for (const question of assessment.questions) {
      totalPoints += question.points;
    }

    const answerRecords: Array<{
      questionId: string;
      studentAnswer: string;
      correctAnswer: string | null;
      isCorrect: boolean;
      pointsAwarded: number;
    }> = [];

    for (const question of assessment.questions) {
      const rawStudentAnswer = answers[question.id];

      const hasAnswer =
        rawStudentAnswer !== undefined &&
        rawStudentAnswer !== null &&
        String(rawStudentAnswer).trim() !== "";

      if (!hasAnswer) {
        continue;
      }

      const studentAnswer = String(rawStudentAnswer).trim();

      const correctAnswer =
        question.correctAnswer !== null
          ? String(question.correctAnswer).trim()
          : null;

      const isCorrect =
        correctAnswer !== null &&
        studentAnswer === correctAnswer;

      const pointsAwarded = isCorrect ? question.points : 0;

      if (isCorrect) {
        earnedPoints += question.points;
      }

      answerRecords.push({
        questionId: question.id,
        studentAnswer,
        correctAnswer,
        isCorrect,
        pointsAwarded,
      });
    }

    const score =
      totalPoints > 0
        ? Math.round((earnedPoints / totalPoints) * 100)
        : 0;

    const answeredQuestions = answerRecords.length;

    const result = await prisma.$transaction(async (tx) => {
      const attempt = await tx.assessmentAttempt.create({
        data: {
          userId: student.id,
          assessmentId: assessment.id,
          score,
          completedAt: new Date(),
        },
      });

      for (const answer of answerRecords) {
        await tx.assessmentAnswer.create({
          data: {
            attemptId: attempt.id,
            questionId: answer.questionId,
            studentAnswer: answer.studentAnswer,
            correctAnswer: answer.correctAnswer,
            isCorrect: answer.isCorrect,
            pointsAwarded: answer.pointsAwarded,
          },
        });
      }

      return attempt;
    });

    return NextResponse.json(
      {
        success: true,
        attemptId: result.id,

        result: {
          score,
          earnedPoints,
          totalPoints,
          answeredQuestions,
          totalQuestions: assessment.questions.length,
        },

        answers: answerRecords,
      },
      {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Exam submit API error:", error);

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