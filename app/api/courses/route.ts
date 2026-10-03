import { requireStudent } from "@/lib/access";
import { fail } from "@/lib/http";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const currentUser = await requireStudent();
    const student = await prisma.user.findUnique({
      where: { id: currentUser.id },
      include: {
        enrollments: {
          include: {
            course: {
              include: {
                teacher: {
                  select: {
                    name: true,
                  },
                },
                lessons: {
                  orderBy: {
                    order: "asc",
                  },
                },
              },
            },
          },
        },
      },
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
    return fail(error);
  }
}
