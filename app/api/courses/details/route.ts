import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth/session";

export async function GET(request: Request) {
try {
const { searchParams } = new URL(request.url);
const subject = searchParams.get("subject");

if (!subject) {
  return NextResponse.json(
    {
      success: false,
      message: "Subject is required",
    },
    { status: 400 }
  );
}

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

const course = await prisma.course.findFirst({
  where: {
    subject,
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
      include: {
        progress: {
          where: {
            userId: student.id,
          },
          select: {
            completed: true,
            completedAt: true,
          },
        },
      },
    },
    enrollments: {
      where: {
        userId: student.id,
      },
      select: {
        progress: true,
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
    { status: 404 }
  );
}

const totalLessons = course.lessons.length;

const completedLessons = course.lessons.filter(
  (lesson) => lesson.progress[0]?.completed === true
).length;

const calculatedProgress =
  totalLessons > 0
    ? Math.round((completedLessons / totalLessons) * 100)
    : 0;

const enrollmentProgress =
  course.enrollments[0]?.progress ?? calculatedProgress;

return NextResponse.json({
  success: true,
  course: {
    id: course.id,
    title: course.title,
    description: course.description,
    subject: course.subject,
    status: course.status,
    teacher: course.teacher.name,

    progress: enrollmentProgress,

    completedLessons,
    totalLessons,

    lessons: course.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      type: lesson.type,
      duration: lesson.duration,
      order: lesson.order,
      completed: lesson.progress[0]?.completed ?? false,
      completedAt: lesson.progress[0]?.completedAt ?? null,
    })),
  },
});

} catch (error) {
console.error("Course details API error:", error);

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