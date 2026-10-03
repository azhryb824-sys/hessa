import { requireStudent } from "@/lib/access";
import { fail } from "@/lib/http";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const currentUser = await requireStudent();
    const student = await prisma.user.findUnique({
      where: { id: currentUser.id },
    });

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message: "Student not found",
        },
        { status: 404 },
      );
    }

    const assessments = await prisma.assessment.findMany({
      where: { course: { enrollments: { some: { userId: student.id } } } },
      include: {
        questions: {
          select: {
            id: true,
            points: true,
          },
        },

        attempts: {
          where: {
            userId: student.id,
          },
          orderBy: {
            completedAt: "desc",
          },
          select: {
            id: true,
            score: true,
            completedAt: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    const courseIds = assessments
      .map((assessment) => assessment.courseId)
      .filter((id): id is string => Boolean(id));

    const courses = await prisma.course.findMany({
      where: {
        id: {
          in: courseIds,
        },
      },
      select: {
        id: true,
        title: true,
        subject: true,
      },
    });

    const courseMap = new Map(courses.map((course) => [course.id, course]));

    const exams = assessments.map((assessment) => {
      const completedAttempts = assessment.attempts.filter(
        (attempt) => attempt.completedAt !== null,
      );

      const latestAttempt = completedAttempts[0] ?? null;

      const totalQuestions = assessment.questions.length;

      const totalPoints = assessment.questions.reduce(
        (total, question) => total + question.points,
        0,
      );

      const course = assessment.courseId
        ? (courseMap.get(assessment.courseId) ?? null)
        : null;

      return {
        id: assessment.id,
        title: assessment.title,
        description: assessment.description,
        type: assessment.type,

        subject: course?.subject ?? course?.title ?? "عام",

        course,

        questions: totalQuestions,

        totalPoints,

        completed: completedAttempts.length > 0,

        latestAttempt: latestAttempt
          ? {
              id: latestAttempt.id,
              score: latestAttempt.score,
              completedAt: latestAttempt.completedAt,
            }
          : null,

        attemptsCount: completedAttempts.length,
      };
    });

    const completedExams = exams.filter((exam) => exam.completed);

    const averageScore =
      completedExams.length > 0
        ? Math.round(
            completedExams.reduce(
              (total, exam) => total + (exam.latestAttempt?.score ?? 0),
              0,
            ) / completedExams.length,
          )
        : 0;

    return NextResponse.json({
      success: true,

      statistics: {
        totalExams: exams.length,
        completedExams: completedExams.length,
        pendingExams: exams.length - completedExams.length,
        averageScore,
      },

      exams,
    });
  } catch (error) {
    return fail(error);
  }
}
