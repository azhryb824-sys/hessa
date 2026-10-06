import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth/session";

export async function GET() {
  try {
    const student = await requireStudent();

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message: "Student not found",
        },
        { status: 404 }
      );
    }

    const courses = student.enrollments.map((enrollment) => ({
      id: enrollment.course.id,
      title: enrollment.course.title,
      description: enrollment.course.description,
      subject: enrollment.course.subject,
      progress: enrollment.progress,
      teacher: enrollment.course.teacher.name,
      lessonsCount: enrollment.course.lessons.length,
      lessons: enrollment.course.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        type: lesson.type,
        duration: lesson.duration,
        order: lesson.order,
      })),
    }));

    return NextResponse.json({
      success: true,
      courses,
    });
  } catch (error) {
    console.error("Courses API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load courses",
      },
      { status: 500 }
    );
  }
}