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
  subject: enrollment.course.subject,
  progress: enrollment.progress,
  lessonsCount: enrollment.course.lessons.length,
}));

const totalCourses = courses.length;

const averageProgress =
  totalCourses > 0
    ? Math.round(
        courses.reduce(
          (total, course) => total + course.progress,
          0
        ) / totalCourses
      )
    : 0;

const completedAssessments = student.attempts.filter(
  (attempt) => attempt.completedAt !== null
);

const averageScore =
  completedAssessments.length > 0
    ? Math.round(
        completedAssessments.reduce(
          (total, attempt) => total + attempt.score,
          0
        ) / completedAssessments.length
      )
    : 0;

const completedLessons = student.lessonProgress;

const completedLessonsCount = completedLessons.length;

const totalLessons = student.enrollments.reduce(
  (total, enrollment) =>
    total + enrollment.course.lessons.length,
  0
);

const totalLearningMinutes = completedLessons.reduce(
  (total, progress) =>
    total + progress.lesson.duration,
  0
);

const calculatedTotalHours = Number(
  (totalLearningMinutes / 60).toFixed(1)
);

const lastCompletedLesson = completedLessons[0]
  ? {
      lessonId: completedLessons[0].lesson.id,
      title: completedLessons[0].lesson.title,
      order: completedLessons[0].lesson.order,
      completedAt: completedLessons[0].completedAt,
      course: {
        id: completedLessons[0].lesson.course.id,
        title: completedLessons[0].lesson.course.title,
        subject:
          completedLessons[0].lesson.course.subject,
      },
    }
  : null;

const coursesWithProgress = courses.map((course) => {
  const completedInCourse = completedLessons.filter(
    (progress) =>
      progress.lesson.course.id === course.id
  ).length;

  return {
    ...course,
    completedLessons: completedInCourse,
    totalLessons: course.lessonsCount,
  };
});

const nextCourse =
  coursesWithProgress.find(
    (course) => course.progress < 100
  ) ?? null;

return NextResponse.json({
  success: true,

  student: {
    id: student.id,
    name: student.name,
    learningLevel:
      student.studentProfile?.learningLevel ?? null,
    learningGoal:
      student.studentProfile?.learningGoal ?? null,
    dailyMinutes:
      student.studentProfile?.dailyMinutes ?? 0,
    learningStreak:
      student.studentProfile?.learningStreak ?? 0,

    totalHours:
      calculatedTotalHours > 0
        ? calculatedTotalHours
        : student.studentProfile?.totalHours ?? 0,
  },

  statistics: {
    totalCourses,
    averageProgress,
    averageScore,
    completedAssessments:
      completedAssessments.length,

    completedLessons: completedLessonsCount,

    totalLessons,

    totalLearningMinutes,

    calculatedTotalHours,
  },

  lastCompletedLesson,

  nextCourse,

  courses: coursesWithProgress,
});

} catch (error) {
console.error("Dashboard API error:", error);

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