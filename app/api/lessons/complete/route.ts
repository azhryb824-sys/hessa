import { requireStudent, requireEnrollment } from "@/lib/access";
import { prisma } from "@/lib/db/prisma";
import { fail, HttpError, readBody, rateLimit } from "@/lib/http";
export async function POST(request: Request) {
  try {
    const user = await requireStudent();
    const b = await readBody(request);
    await rateLimit(`lesson:${user.id}`);
    const id = typeof b.lessonId === "string" ? b.lessonId : null;
    const order = Number(b.order);
    const subject = typeof b.subject === "string" ? b.subject : null;
    if (!id && (!subject || !Number.isInteger(order) || order < 1))
      throw new HttpError(400, "بيانات الدرس غير صحيحة");
    const lesson = await prisma.lesson.findFirst({
      where: id
        ? { id }
        : {
            order,
            course: {
              subject: subject!,
              enrollments: { some: { userId: user.id } },
            },
          },
    });
    if (!lesson) throw new HttpError(404, "الدرس غير موجود");
    await requireEnrollment(user.id, lesson.courseId);
    const data = await prisma.$transaction(async (tx) => {
      const progress = await tx.lessonProgress.upsert({
        where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
        update: {},
        create: {
          userId: user.id,
          lessonId: lesson.id,
          completed: true,
          completedAt: new Date(),
        },
      });
      const totalLessons = await tx.lesson.count({
        where: { courseId: lesson.courseId },
      });
      const completedLessons = await tx.lessonProgress.count({
        where: {
          userId: user.id,
          completed: true,
          lesson: { courseId: lesson.courseId },
        },
      });
      const courseProgress = totalLessons
        ? Math.round((100 * completedLessons) / totalLessons)
        : 0;
      await tx.enrollment.update({
        where: {
          userId_courseId: { userId: user.id, courseId: lesson.courseId },
        },
        data: { progress: courseProgress },
      });
      return {
        lessonProgress: progress,
        totalLessons,
        completedLessons,
        courseProgress,
      };
    });
    return Response.json({ success: true, ...data });
  } catch (e) {
    return fail(e);
  }
}
