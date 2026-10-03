import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
try {
const body = await request.json();

const subject = body.subject;
const order = Number(body.order);

if (!subject || !Number.isInteger(order) || order < 1) {
  return NextResponse.json(
    {
      success: false,
      message: "Subject and valid order are required",
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

const lesson = await prisma.lesson.findFirst({
  where: {
    order,
    course: {
      subject,
    },
  },
  include: {
    course: true,
  },
});

if (!lesson) {
  return NextResponse.json(
    {
      success: false,
      message: "Lesson not found",
    },
    { status: 404 }
  );
}

const progress = await prisma.lessonProgress.upsert({
  where: {
    userId_lessonId: {
      userId: student.id,
      lessonId: lesson.id,
    },
  },
  update: {
    completed: true,
    completedAt: new Date(),
  },
  create: {
    userId: student.id,
    lessonId: lesson.id,
    completed: true,
    completedAt: new Date(),
  },
});

const totalLessons = await prisma.lesson.count({
  where: {
    courseId: lesson.courseId,
  },
});

const completedLessons = await prisma.lessonProgress.count({
  where: {
    userId: student.id,
    completed: true,
    lesson: {
      courseId: lesson.courseId,
    },
  },
});

const courseProgress =
  totalLessons > 0
    ? Math.round((completedLessons / totalLessons) * 100)
    : 0;

const enrollment = await prisma.enrollment.findUnique({
  where: {
    userId_courseId: {
      userId: student.id,
      courseId: lesson.courseId,
    },
  },
});

if (enrollment) {
  await prisma.enrollment.update({
    where: {
      id: enrollment.id,
    },
    data: {
      progress: courseProgress,
    },
  });
}

return NextResponse.json({
  success: true,
  message: "Lesson completed successfully",
  lessonProgress: progress,
  courseProgress,
  completedLessons,
  totalLessons,
});

} catch (error) {
console.error("Complete lesson API error:", error);

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