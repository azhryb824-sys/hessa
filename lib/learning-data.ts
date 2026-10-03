import { adaptiveEvidence } from "@/lib/ai/adaptive";
import { prisma } from "@/lib/db/prisma";
import { analyzeLearningState } from "@/lib/ai/learning-engine";
export async function learningData(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      studentProfile: true,
      enrollments: {
        include: {
          course: {
            include: {
              lessons: {
                orderBy: { order: "asc" },
                include: { progress: { where: { userId, completed: true } } },
              },
            },
          },
        },
      },
      attempts: {
        where: { completedAt: { not: null } },
        orderBy: { completedAt: "desc" },
        include: { assessment: true, answers: true },
      },
      lessonProgress: {
        where: { completed: true },
        include: { lesson: { include: { course: true } } },
        orderBy: { completedAt: "desc" },
      },
    },
  });
  const courses = user.enrollments.map((e) => {
    const completedLessons = e.course.lessons.filter(
      (l) => l.progress.length > 0,
    ).length;
    return {
      id: e.course.id,
      title: e.course.title,
      subject: e.course.subject,
      progress: e.course.lessons.length
        ? Math.round((100 * completedLessons) / e.course.lessons.length)
        : 0,
      completedLessons,
      totalLessons: e.course.lessons.length,
      lessonsCount: e.course.lessons.length,
      lessons: e.course.lessons.length,
    };
  });
  const assessmentHistory = user.attempts.map((a) => ({
    attemptId: a.id,
    assessmentId: a.assessmentId,
    title: a.assessment.title,
    subject:
      courses.find((c) => c.id === a.assessment.courseId)?.subject || "عام",
    score: a.score,
    completedAt: a.completedAt?.toISOString() || null,
    totalQuestions: a.totalQuestions,
    answeredQuestions: a.answers.length,
    correctAnswers: a.answers.filter((x) => x.isCorrect).length,
    wrongAnswers: a.answers.filter((x) => !x.isCorrect).length,
    answers: a.answers.map((x) => ({
      questionId: x.questionId,
      question: x.questionText,
      studentAnswer: x.studentAnswer,
      correctAnswer: x.correctAnswer,
      isCorrect: x.isCorrect,
      pointsAwarded: x.pointsAwarded,
      points: x.maxPoints,
    })),
  }));
  const exams = assessmentHistory.map((a) => ({
    id: a.attemptId,
    assessmentId: a.assessmentId,
    title: a.title,
    subject: a.subject,
    score: a.score,
    completed: true,
    completedAt: a.completedAt,
  }));
  const latest = [
    ...new Map(
      exams
        .slice()
        .reverse()
        .map((e) => [e.assessmentId, e]),
    ).values(),
  ];
  const days = new Set(
    user.lessonProgress
      .map((p) =>
        p.completedAt?.toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" }),
      )
      .filter(Boolean),
  );
  let streak = 0;
  const day = new Date();
  if (!days.has(day.toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" })))
    day.setUTCDate(day.getUTCDate() - 1);
  while (
    days.has(day.toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" }))
  ) {
    streak++;
    day.setUTCDate(day.getUTCDate() - 1);
  }
  const totalLearningMinutes = user.lessonProgress.reduce(
    (sum, p) => sum + p.lesson.duration,
    0,
  );
  const learningState = analyzeLearningState({
    name: user.name,
    learningLevel: user.studentProfile?.learningLevel || "BEGINNER",
    learningGoal: user.studentProfile?.learningGoal || null,
    dailyMinutes: user.studentProfile?.dailyMinutes || 30,
    courses,
    exams,
    assessmentHistory,
  });
  return {
    success: true,
    student: {
      id: user.id,
      name: user.name,
      learningLevel: user.studentProfile?.learningLevel || "BEGINNER",
      learningGoal: user.studentProfile?.learningGoal || null,
      dailyMinutes: user.studentProfile?.dailyMinutes || 30,
      learningStreak: streak,
      totalHours: Number((totalLearningMinutes / 60).toFixed(1)),
    },
    statistics: {
      totalCourses: courses.length,
      averageProgress: courses.length
        ? Math.round(
            courses.reduce((s, c) => s + c.progress, 0) / courses.length,
          )
        : 0,
      averageScore: latest.length
        ? Math.round(latest.reduce((s, e) => s + e.score, 0) / latest.length)
        : 0,
      completedAssessments: latest.length,
      completedLessons: user.lessonProgress.length,
      totalLessons: courses.reduce((s, c) => s + c.totalLessons, 0),
      totalLearningMinutes,
      calculatedTotalHours: Number((totalLearningMinutes / 60).toFixed(1)),
      hoursBasis: "completed-lesson-duration",
    },
    lastCompletedLesson: user.lessonProgress[0]
      ? {
          lessonId: user.lessonProgress[0].lessonId,
          title: user.lessonProgress[0].lesson.title,
          order: user.lessonProgress[0].lesson.order,
          course: {
            id: user.lessonProgress[0].lesson.courseId,
            title: user.lessonProgress[0].lesson.course.title,
            subject: user.lessonProgress[0].lesson.course.subject,
          },
        }
      : null,
    nextCourse: courses.find((c) => c.progress < 100) || null,
    courses,
    exams,
    assessmentHistory,
    learningState,
    adaptive: adaptiveEvidence(assessmentHistory),
    completedLessons: user.lessonProgress.map((p) => ({
      lessonId: p.lessonId,
      title: p.lesson.title,
      subject: p.lesson.course.subject,
      courseId: p.lesson.courseId,
      order: p.lesson.order,
      duration: p.lesson.duration,
    })),
    engine: {
      name: "Hessa Evidence Engine",
      version: "0.4.0",
      mode: "rules-and-evidence",
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      totalCourses: courses.length,
      totalCompletedLessons: user.lessonProgress.length,
      totalAssessmentAttempts: exams.length,
      totalAnsweredQuestions: assessmentHistory.reduce(
        (s, a) => s + a.answeredQuestions,
        0,
      ),
    },
  };
}
