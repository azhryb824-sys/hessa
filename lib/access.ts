import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { HttpError } from "@/lib/http";
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "سجّل الدخول أولًا");
  return user;
}
export async function requireStudent() {
  const user = await requireUser();
  if (user.role !== "STUDENT") throw new HttpError(403, "هذه الخدمة للطلاب");
  if (
    process.env.BILLING_ENFORCED === "true" &&
    user.createdAt.getTime() + 7 * 86400000 < Date.now() &&
    !(await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        startsAt: { lte: new Date() },
        expiresAt: { gt: new Date() },
      },
    }))
  )
    throw new HttpError(
      402,
      "انتهت الفترة التجريبية؛ فعّل اشتراكك من صفحة الاشتراك",
    );
  return user;
}
export async function requireEnrollment(
  userId: string,
  courseId: string | null,
) {
  if (
    !courseId ||
    !(await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    }))
  )
    throw new HttpError(403, "المادة غير مسجلة في حسابك");
}
export async function manageCourse(
  user: { id: string; role: string },
  courseId: string,
) {
  const c = await prisma.course.findUnique({ where: { id: courseId } });
  if (
    !c ||
    (user.role !== "ADMIN" &&
      (user.role !== "TEACHER" || c.teacherId !== user.id))
  )
    throw new HttpError(403, "غير مصرح بإدارة المادة");
  return c;
}
