import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const examId = request.nextUrl.searchParams.get("id");

    if (!examId) {
      return NextResponse.json(
        {
          success: false,
          message: "Exam ID is required",
        },
        { status: 400 }
      );
    }

    const assessment = await prisma.assessment.findUnique({
      where: {
        id: examId,
      },
      include: {
        questions: {
          select: {
            id: true,
            question: true,
            options: true,
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

    const course = assessment.courseId
      ? await prisma.course.findUnique({
          where: {
            id: assessment.courseId,
          },
          select: {
            subject: true,
          },
        })
      : null;

    const questions = assessment.questions.map((question) => {
      let options: string[] = [];

      if (question.options) {
        try {
          const parsed = JSON.parse(question.options);

          if (Array.isArray(parsed)) {
            options = parsed.map(String);
          }
        } catch {
          options = question.options
            .split("|")
            .map((option) => option.trim())
            .filter(Boolean);
        }
      }

      return {
        id: question.id,
        question: question.question,
        options,
        points: question.points,
      };
    });

    return NextResponse.json({
      success: true,
      exam: {
        id: assessment.id,
        title: assessment.title,
        description: assessment.description,
        type: assessment.type,
        subject: course?.subject ?? "عام",
        questions,
      },
    });
  } catch (error) {
    console.error("Exam take API error:", error);

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