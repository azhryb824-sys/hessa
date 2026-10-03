import { prisma } from "@/lib/db/prisma";
import { requireUser, manageCourse } from "@/lib/access";
import { learningData } from "@/lib/learning-data";
import { hashPassword } from "@/lib/auth";
import { fail, readBody, cleanText, HttpError } from "@/lib/http";
export async function GET() {
  try {
    const u = await requireUser();
    if (u.role === "STUDENT")
      throw new HttpError(403, "بوابة الإدارة للأدوار المخولة");
    if (u.role === "PARENT") {
      const links = await prisma.parentLink.findMany({
        where: { parentId: u.id },
      });
      const children = await Promise.all(
        links.map(async (link) => {
          const d = await learningData(link.studentId);
          return {
            student: d.student,
            statistics: d.statistics,
            analysis: d.learningState.analysis,
          };
        }),
      );
      return Response.json({
        success: true,
        user: { name: u.name, role: u.role },
        children,
        courses: [],
        users: [],
        classes: [],
        assignments: [],
      });
    }
    const courses = await prisma.course.findMany({
      where: u.role === "ADMIN" ? {} : { teacherId: u.id },
      include: {
        lessons: true,
        assessments: {
          include: {
            questions: { select: { id: true, question: true, points: true } },
          },
        },
        _count: { select: { enrollments: true } },
      },
    });
    const ids = courses.map((c) => c.id);
    const classes = await prisma.classSession.findMany({
      where: { courseId: { in: ids } },
      include: { bookings: true },
      orderBy: { startsAt: "desc" },
    });
    const assignments = await prisma.assignment.findMany({
      where: { courseId: { in: ids } },
      include: { submissions: true },
    });
    const interactions = await prisma.classEvent.groupBy({
      by: ["classId", "senderId"],
      where: {
        classId: { in: classes.map((c) => c.id) },
        type: { in: ["chat", "hand", "vote", "stroke"] },
      },
      _count: { _all: true },
    });
    const users = await prisma.user.findMany({
      where:
        u.role === "ADMIN"
          ? {}
          : { enrollments: { some: { courseId: { in: ids } } } },
      select: { id: true, name: true, email: true, role: true, gender: true },
      orderBy: { name: "asc" },
    });
    return Response.json({
      success: true,
      user: { name: u.name, role: u.role },
      courses,
      classes: classes.map((c) => ({
        ...c,
        bookings: c.bookings.map((b) => ({
          ...b,
          interactions:
            interactions.find(
              (i) => i.classId === c.id && i.senderId === b.studentId,
            )?._count._all || 0,
        })),
      })),
      assignments,
      users,
      aiConfigured: !!process.env.OPENAI_API_KEY,
      children: [],
    });
  } catch (e) {
    return fail(e);
  }
}
export async function POST(request: Request) {
  try {
    const u = await requireUser();
    const b = await readBody(request);
    const action = cleanText(b.action, 40);
    if (action === "reset-password") {
      if (u.role !== "ADMIN")
        throw new HttpError(403, "إعادة تعيين كلمة المرور للمشرف");
      const userId = cleanText(b.userId, 200),
        password = cleanText(b.password, 128);
      if (password.length < 10) throw new HttpError(400, "كلمة المرور قصيرة");
      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { password: hashPassword(password) },
        }),
        prisma.session.deleteMany({ where: { userId } }),
      ]);
    } else if (action === "user") {
      if (u.role !== "ADMIN") throw new HttpError(403, "إدارة الحسابات للمشرف");
      const name = cleanText(b.name, 100),
        email = cleanText(b.email, 180).toLowerCase(),
        password = cleanText(b.password, 128),
        role = cleanText(b.role, 30);
      if (
        !name ||
        !email.includes("@") ||
        password.length < 10 ||
        !["STUDENT", "TEACHER", "PARENT", "ADMIN"].includes(role)
      )
        throw new HttpError(400, "بيانات الحساب غير صحيحة");
      const birthDate = b.birthDate ? new Date(String(b.birthDate)) : null;
      const gender = ["MALE", "FEMALE"].includes(String(b.gender))
        ? String(b.gender)
        : null;
      if ((birthDate && !Number.isFinite(birthDate.getTime())) || !gender)
        throw new HttpError(400, "أكمل بيانات الجنس والعمر");
      await prisma.user.create({
        data: {
          name,
          email,
          password: hashPassword(password),
          role: role as "STUDENT" | "TEACHER" | "PARENT" | "ADMIN",
          gender,
          birthDate,
          ...(role === "STUDENT" ? { studentProfile: { create: {} } } : {}),
        },
      });
    } else if (action === "parent-link" || action === "enroll") {
      if (u.role !== "ADMIN") throw new HttpError(403, "هذا الإجراء للمشرف");
      const studentId = cleanText(b.studentId, 200);
      const student = await prisma.user.findUnique({
        where: { id: studentId },
      });
      if (student?.role !== "STUDENT") throw new HttpError(400, "اختر طالبًا");
      if (action === "parent-link") {
        const parentId = cleanText(b.parentId, 200);
        const parent = await prisma.user.findUnique({
          where: { id: parentId },
        });
        if (parent?.role !== "PARENT") throw new HttpError(400, "اختر ولي أمر");
        await prisma.parentLink.upsert({
          where: { parentId_studentId: { parentId, studentId } },
          create: { parentId, studentId },
          update: {},
        });
      } else {
        const courseId = cleanText(b.courseId, 200);
        if (!(await prisma.course.findUnique({ where: { id: courseId } })))
          throw new HttpError(404, "المادة غير موجودة");
        await prisma.enrollment.upsert({
          where: { userId_courseId: { userId: studentId, courseId } },
          create: { userId: studentId, courseId },
          update: {},
        });
      }
    } else if (action === "course") {
      if (!["ADMIN", "TEACHER"].includes(u.role))
        throw new HttpError(403, "غير مصرح");
      const teacherId = u.role === "ADMIN" ? cleanText(b.teacherId, 200) : u.id;
      const teacher = await prisma.user.findUnique({
        where: { id: teacherId },
      });
      if (teacher?.role !== "TEACHER") throw new HttpError(400, "اختر مدرسًا");
      const title = cleanText(b.title, 180),
        subject = cleanText(b.subject, 100);
      if (!title || !subject)
        throw new HttpError(400, "اسم المادة والتخصص مطلوبان");
      await prisma.course.create({
        data: {
          title,
          subject,
          description: cleanText(b.description),
          teacherId,
          status: "PUBLISHED",
        },
      });
    } else if (action === "lesson") {
      const course = await manageCourse(u, cleanText(b.courseId, 200));
      const title = cleanText(b.title, 180),
        content = cleanText(b.content, 12000);
      const order = Number(b.order),
        duration = Number(b.duration);
      if (
        !title ||
        !content ||
        !Number.isInteger(order) ||
        order < 1 ||
        !Number.isInteger(duration) ||
        duration < 1 ||
        duration > 240
      )
        throw new HttpError(400, "بيانات الدرس غير صحيحة");
      await prisma.lesson.upsert({
        where: { courseId_order: { courseId: course.id, order } },
        create: {
          courseId: course.id,
          title,
          content,
          order,
          duration,
          type: "READING",
        },
        update: { title, content, duration },
      });
    } else if (action === "exam") {
      const c = await manageCourse(u, cleanText(b.courseId, 200));
      const title = cleanText(b.title, 180);
      const question = cleanText(b.question, 1500);
      const options = [b.option1, b.option2, b.option3, b.option4].map((o) =>
        cleanText(o, 200),
      );
      const correct = Number(b.correct);
      if (
        !title ||
        !question ||
        options.some((o) => !o) ||
        new Set(options).size !== 4 ||
        ![1, 2, 3, 4].includes(correct)
      )
        throw new HttpError(
          400,
          "أكمل السؤال وأربع خيارات مختلفة والإجابة الصحيحة",
        );
      await prisma.assessment.create({
        data: {
          title,
          type: "QUIZ",
          courseId: c.id,
          questions: {
            create: {
              question,
              options: JSON.stringify(options),
              correctAnswer: options[correct - 1],
              points: 1,
            },
          },
        },
      });
    } else throw new HttpError(400, "الإجراء غير صحيح");
    await prisma.auditLog.create({
      data: {
        actorId: u.id,
        action,
        entityId: cleanText(b.courseId, 200) || null,
      },
    });
    return Response.json({ success: true });
  } catch (e) {
    return fail(e);
  }
}
