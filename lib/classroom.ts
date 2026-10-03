import { requireUser, requireStudent } from "@/lib/access";
import { prisma } from "@/lib/db/prisma";
import { HttpError } from "@/lib/http";
export async function classroomAccess(classId: string) {
  const user = await requireUser();
  if (user.role === "STUDENT") await requireStudent();
  const session = await prisma.classSession.findUnique({
    where: { id: classId },
    include: { bookings: true },
  });
  if (!session) throw new HttpError(404, "الحصة غير موجودة");
  const teacher =
    user.role === "ADMIN" ||
    (user.role === "TEACHER" && session.teacherId === user.id);
  if (!teacher && !session.bookings.some((b) => b.studentId === user.id))
    throw new HttpError(403, "يجب حجز الحصة أولًا");
  if (session.status !== "SCHEDULED")
    throw new HttpError(409, "الحصة غير متاحة");
  if (session.capacity > 8)
    throw new HttpError(
      409,
      "الغرفة المباشرة تدعم حتى 8 طلاب؛ استخدم رابط الاجتماع للحصص الأكبر",
    );
  const now = Date.now();
  if (
    now < session.startsAt.getTime() - 15 * 60000 ||
    now > session.startsAt.getTime() + (session.duration + 30) * 60000
  )
    throw new HttpError(
      409,
      "الغرفة تفتح قبل الحصة بـ15 دقيقة وتغلق بعد نهايتها بـ30 دقيقة",
    );
  return { user, session, teacher };
}
