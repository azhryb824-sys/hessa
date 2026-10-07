import "dotenv/config";
import {
  PrismaClient,
  UserRole,
  LearningLevel,
  CourseStatus,
  LessonType,
  AssessmentType,
} from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { makePasswordHash } from "../lib/auth/password";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("🌱 Starting Hessa seed...");
  const demoPasswordHash = makePasswordHash("demo-password");

  const teacher = await prisma.user.upsert({
    where: {
      email: "teacher@hessa.local",
    },
    update: { password: demoPasswordHash },
    create: {
      name: "أستاذ حصة",
      email: "teacher@hessa.local",
      password: demoPasswordHash,
      role: UserRole.TEACHER,
    },
  });

  const student = await prisma.user.upsert({
    where: {
      email: "student@hessa.local",
    },
    update: { password: demoPasswordHash },
    create: {
      name: "طالب حصة",
      email: "student@hessa.local",
      password: demoPasswordHash,
      role: UserRole.STUDENT,
      studentProfile: {
        create: {
          learningLevel: LearningLevel.INTERMEDIATE,
          learningGoal: "تحسين المستوى الدراسي وبناء خطة تعلم شخصية",
          dailyMinutes: 45,
          learningStreak: 7,
          totalHours: 18.5,
        },
      },
    },
    include: {
      studentProfile: true,
    },
  });

  const courses = [
    {
      title: "الرياضيات",
      subject: "الرياضيات",
      description: "مسار تفاعلي لتطوير مهارات الرياضيات وحل المسائل.",
    },
    {
      title: "اللغة الإنجليزية",
      subject: "اللغة الإنجليزية",
      description: "تطوير القراءة والاستماع والمفردات والمحادثة.",
    },
    {
      title: "العلوم",
      subject: "العلوم",
      description: "تعلم العلوم بطريقة تفاعلية مع تطبيقات وأمثلة عملية.",
    },
    {
      title: "اللغة العربية",
      subject: "اللغة العربية",
      description: "تطوير مهارات القراءة والكتابة والقواعد والتعبير.",
    },
  ];

  for (const courseData of courses) {
    const course = await prisma.course.upsert({
      where: {
        id: `${teacher.id}-${courseData.subject === "الرياضيات"
  ? "math"
  : courseData.subject === "اللغة الإنجليزية"
    ? "english"
    : courseData.subject === "العلوم"
      ? "science"
      : "arabic"}`,
      },
      update: {
        title: courseData.title,
        description: courseData.description,
        subject: courseData.subject,
        status: CourseStatus.PUBLISHED,
      },
      create: {
        id: `${teacher.id}-${courseData.subject === "الرياضيات"
  ? "math"
  : courseData.subject === "اللغة الإنجليزية"
    ? "english"
    : courseData.subject === "العلوم"
      ? "science"
      : "arabic"}`,
        title: courseData.title,
        description: courseData.description,
        subject: courseData.subject,
        status: CourseStatus.PUBLISHED,
        teacherId: teacher.id,
      },
    });

    const lessons = [
      {
        title: `مقدمة في ${courseData.subject}`,
        type: LessonType.VIDEO,
        duration: 20,
        order: 1,
      },
      {
        title: `التطبيق العملي في ${courseData.subject}`,
        type: LessonType.INTERACTIVE,
        duration: 30,
        order: 2,
      },
      {
        title: `تدريب ومراجعة ${courseData.subject}`,
        type: LessonType.PRACTICE,
        duration: 25,
        order: 3,
      },
    ];

    for (const lesson of lessons) {
      await prisma.lesson.upsert({
        where: {
          id: `${course.id}-lesson-${lesson.order}`,
        },
        update: {
          title: lesson.title,
          type: lesson.type,
          duration: lesson.duration,
          order: lesson.order,
        },
        create: {
          id: `${course.id}-lesson-${lesson.order}`,
          title: lesson.title,
          type: lesson.type,
          duration: lesson.duration,
          order: lesson.order,
          courseId: course.id,
        },
      });
    }

    await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: student.id,
          courseId: course.id,
        },
      },
      update: {},
      create: {
        userId: student.id,
        courseId: course.id,
        progress:
          courseData.subject === "الرياضيات"
            ? 72
            : courseData.subject === "اللغة الإنجليزية"
              ? 58
              : courseData.subject === "العلوم"
                ? 41
                : 64,
      },
    });
  }

  const mathCourse = await prisma.course.findFirst({
    where: {
      subject: "الرياضيات",
      teacherId: teacher.id,
    },
  });

  if (mathCourse) {
    const assessment = await prisma.assessment.upsert({
      where: {
        id: `${mathCourse.id}-quiz-1`,
      },
      update: {},
      create: {
        id: `${mathCourse.id}-quiz-1`,
        title: "اختبار الرياضيات الأساسي",
        description: "اختبار قصير لقياس مستوى الطالب في أساسيات الرياضيات.",
        type: AssessmentType.QUIZ,
        courseId: mathCourse.id,
      },
    });

    const questions = [
      {
        id: `${assessment.id}-q1`,
        question: "كم يساوي 5 + 7؟",
        options: JSON.stringify(["10", "11", "12", "13"]),
        correctAnswer: "12",
        points: 1,
      },
      {
        id: `${assessment.id}-q2`,
        question: "كم يساوي 8 × 3؟",
        options: JSON.stringify(["21", "24", "27", "30"]),
        correctAnswer: "24",
        points: 1,
      },
      {
        id: `${assessment.id}-q3`,
        question: "ما ناتج 20 ÷ 4؟",
        options: JSON.stringify(["4", "5", "6", "8"]),
        correctAnswer: "5",
        points: 1,
      },
    ];

    for (const question of questions) {
      await prisma.assessmentQuestion.upsert({
        where: {
          id: question.id,
        },
        update: question,
        create: {
          ...question,
          assessmentId: assessment.id,
        },
      });
    }
  }

  console.log("✅ Hessa seed completed successfully.");
  console.log(`👨‍🏫 Teacher: ${teacher.email}`);
  console.log(`🎓 Student: ${student.email}`);
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });