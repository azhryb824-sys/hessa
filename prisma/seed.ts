import { hashPassword } from "../lib/password";
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

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./prisma/dev.db",
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const bootstrap = process.env.HESSA_BOOTSTRAP_PASSWORD;
  if (!bootstrap || bootstrap.length < 12)
    throw new Error(
      "Set HESSA_BOOTSTRAP_PASSWORD to 12+ characters before seeding",
    );
  const password = hashPassword(bootstrap);
  console.log("Starting Hessa educational content seed");

  const teacher = await prisma.user.upsert({
    where: {
      email: "teacher@hessa.local",
    },
    update: { password, gender: "MALE", birthDate: new Date("2005-01-01") },
    create: {
      name: "أستاذ حصة",
      email: "teacher@hessa.local",
      password,
      gender: "MALE",
      birthDate: new Date("2005-01-01"),
      role: UserRole.TEACHER,
    },
  });

  const student = await prisma.user.upsert({
    where: {
      email: "student@hessa.local",
    },
    update: { password, gender: "MALE", birthDate: new Date("2005-01-01") },
    create: {
      name: "طالب حصة",
      email: "student@hessa.local",
      password,
      gender: "MALE",
      birthDate: new Date("2005-01-01"),
      role: UserRole.STUDENT,
      studentProfile: {
        create: {
          learningLevel: LearningLevel.INTERMEDIATE,
          learningGoal: "تحسين المستوى الدراسي وبناء خطة تعلم شخصية",
          dailyMinutes: 45,
          learningStreak: 0,
          totalHours: 0,
        },
      },
    },
    include: {
      studentProfile: true,
    },
  });

  for (const role of ["ADMIN", "PARENT"] as const) {
    const email = role.toLowerCase() + "@hessa.local";
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name: role === "ADMIN" ? "مشرف حصة" : "ولي أمر حصة",
        email,
        password,
        role,
        gender: "MALE",
        birthDate: new Date("1990-01-01"),
      },
    });
  }
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
        id: `${teacher.id}-${
          courseData.subject === "الرياضيات"
            ? "math"
            : courseData.subject === "اللغة الإنجليزية"
              ? "english"
              : courseData.subject === "العلوم"
                ? "science"
                : "arabic"
        }`,
      },
      update: {
        title: courseData.title,
        description: courseData.description,
        subject: courseData.subject,
        status: CourseStatus.PUBLISHED,
      },
      create: {
        id: `${teacher.id}-${
          courseData.subject === "الرياضيات"
            ? "math"
            : courseData.subject === "اللغة الإنجليزية"
              ? "english"
              : courseData.subject === "العلوم"
                ? "science"
                : "arabic"
        }`,
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
        progress: 0,
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
