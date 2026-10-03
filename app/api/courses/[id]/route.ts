import { requireStudent, requireEnrollment } from "@/lib/access";
import { fail } from "@/lib/http";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const currentUser = await requireStudent();
    const { id } = await context.params;

    const course = await prisma.course.findUnique({
      where: {
        id,
      },
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
    });

    if (!course) {
      return NextResponse.json(
        {
          success: false,
          message: "Course not found",
        },
        { status: 404 },
      );
    }

    await requireEnrollment(currentUser.id, course.id);
    return NextResponse.json({
      success: true,
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        subject: course.subject,
        status: course.status,
        teacher: course.teacher.name,
        lessons: course.lessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          type: lesson.type,
          duration: lesson.duration,
          order: lesson.order,
        })),
      },
    });
  } catch (error) {
    return fail(error);
  }
}
