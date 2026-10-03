import { prisma } from "@/lib/db/prisma";
import {
  requireUser,
  requireStudent,
  requireEnrollment,
  manageCourse,
} from "@/lib/access";
import { fail, readBody, cleanText, HttpError } from "@/lib/http";
import { canTeach, overlaps } from "@/lib/policies";
export async function GET() {
  try {
    const u = await requireUser();
    if (u.role === "STUDENT") await requireStudent();
    const courses = await prisma.course.findMany({
      where:
        u.role === "ADMIN"
          ? {}
          : u.role === "TEACHER"
            ? { teacherId: u.id }
            : { enrollments: { some: { userId: u.id } } },
    });
    const classes = await prisma.classSession.findMany({
      where: {
        courseId: { in: courses.map((c) => c.id) },
        ...(u.role === "TEACHER" ? { teacherId: u.id } : {}),
      },
      include: { bookings: true },
      orderBy: { startsAt: "asc" },
    });
    const teachers = await prisma.user.findMany({
      where: { id: { in: classes.map((c) => c.teacherId) } },
      select: { id: true, name: true, gender: true },
    });
    return Response.json({
      success: true,
      courses: courses.map((c) => ({
        id: c.id,
        title: c.title,
        subject: c.subject,
      })),
      classes: classes.map((c) => {
        const teacher = teachers.find((t) => t.id === c.teacherId);
        const booked = c.bookings.some((b) => b.studentId === u.id);
        return {
          ...c,
          meetingUrl:
            booked || ["ADMIN", "TEACHER"].includes(u.role)
              ? c.meetingUrl
              : null,
          bookings: undefined,
          booked,
          seatsLeft: c.capacity - c.bookings.length,
          teacherName: teacher?.name,
          eligible: canTeach(teacher?.gender || null, u.gender, u.birthDate),
        };
      }),
    });
  } catch (e) {
    return fail(e);
  }
}
export async function POST(request: Request) {
  try {
    const u = await requireUser();
    if (u.role === "STUDENT") await requireStudent();
    const b = await readBody(request);
    const action = cleanText(b.action, 40);
    if (action === "create") {
      const course = await manageCourse(u, cleanText(b.courseId, 200));
      const startsAt = new Date(String(b.startsAt));
      const duration = Number(b.duration);
      const capacity = Number(b.capacity);
      const title = cleanText(b.title, 180);
      const meetingUrl = cleanText(b.meetingUrl, 500);
      if (
        !title ||
        !Number.isFinite(startsAt.getTime()) ||
        startsAt <= new Date() ||
        !Number.isInteger(duration) ||
        duration < 15 ||
        duration > 180 ||
        !Number.isInteger(capacity) ||
        capacity < 1 ||
        capacity > 50
      )
        throw new HttpError(400, "بيانات الحصة غير صحيحة");
      if (meetingUrl) {
        try {
          const url = new URL(meetingUrl);
          if (url.protocol !== "https:" || url.username || url.password)
            throw new Error();
        } catch {
          throw new HttpError(400, "رابط الاجتماع يجب أن يكون HTTPS");
        }
      }
      const c = await prisma.$transaction(async (tx) => {
        const existing = await tx.classSession.findMany({
          where: { teacherId: course.teacherId, status: "SCHEDULED" },
        });
        if (
          existing.some((x) =>
            overlaps(startsAt, duration, x.startsAt, x.duration),
          )
        )
          throw new HttpError(409, "المدرس لديه حصة متعارضة");
        return tx.classSession.create({
          data: {
            courseId: course.id,
            teacherId: course.teacherId,
            title,
            startsAt,
            duration,
            capacity,
            meetingUrl: meetingUrl || null,
          },
        });
      });
      return Response.json({ success: true, class: c }, { status: 201 });
    }
    const id = cleanText(b.classId, 200);
    const c = await prisma.classSession.findUnique({
      where: { id },
      include: { bookings: true },
    });
    if (!c) throw new HttpError(404, "الحصة غير موجودة");
    if (action === "book") {
      if (u.role !== "STUDENT") throw new HttpError(403, "الحجز لحساب الطالب");
      await requireEnrollment(u.id, c.courseId);
      const teacher = await prisma.user.findUniqueOrThrow({
        where: { id: c.teacherId },
      });
      if (!canTeach(teacher.gender, u.gender, u.birthDate))
        throw new HttpError(
          403,
          "الحصة لا تطابق قواعد توزيع المدرسين أو بيانات العمر والجنس غير مكتملة",
        );
      if (c.status !== "SCHEDULED" || c.startsAt <= new Date())
        throw new HttpError(409, "الحجز غير متاح");
      await prisma.$transaction(async (tx) => {
        if (
          await tx.classBooking.findUnique({
            where: { classId_studentId: { classId: id, studentId: u.id } },
          })
        )
          return;
        const count = await tx.classBooking.count({ where: { classId: id } });
        if (count >= c.capacity) throw new HttpError(409, "الحصة مكتملة العدد");
        const other = await tx.classBooking.findMany({
          where: { studentId: u.id, session: { status: "SCHEDULED" } },
          include: { session: true },
        });
        if (
          other.some((x) =>
            overlaps(
              c.startsAt,
              c.duration,
              x.session.startsAt,
              x.session.duration,
            ),
          )
        )
          throw new HttpError(409, "لديك حصة أخرى في هذا الموعد");
        await tx.classBooking.create({
          data: { classId: id, studentId: u.id },
        });
      });
    } else if (action === "cancel-booking") {
      if (u.role !== "STUDENT" || c.startsAt <= new Date())
        throw new HttpError(409, "إلغاء الحجز غير متاح");
      await prisma.classBooking.deleteMany({
        where: { classId: id, studentId: u.id },
      });
    } else if (action === "cancel-class") {
      await manageCourse(u, c.courseId);
      await prisma.classSession.update({
        where: { id },
        data: { status: "CANCELLED" },
      });
    } else if (action === "attendance") {
      await manageCourse(u, c.courseId);
      const studentId = cleanText(b.studentId, 200);
      await prisma.classBooking.update({
        where: { classId_studentId: { classId: id, studentId } },
        data: { attended: b.attended === true },
      });
    } else throw new HttpError(400, "الإجراء غير صحيح");
    await prisma.auditLog.create({
      data: { actorId: u.id, action, entityId: id },
    });
    return Response.json({ success: true });
  } catch (e) {
    return fail(e);
  }
}
