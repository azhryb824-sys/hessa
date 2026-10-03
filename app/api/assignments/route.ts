import { prisma } from "@/lib/db/prisma";
import {
  requireUser,
  requireStudent,
  requireEnrollment,
  manageCourse,
} from "@/lib/access";
import { fail, readBody, cleanText, HttpError } from "@/lib/http";
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
    const assignments = await prisma.assignment.findMany({
      where: { courseId: { in: courses.map((c) => c.id) } },
      include: {
        submissions: { where: u.role === "STUDENT" ? { studentId: u.id } : {} },
      },
      orderBy: { dueAt: "asc" },
    });
    return Response.json({
      success: true,
      assignments,
      courses: courses.map((c) => ({ id: c.id, title: c.title })),
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
      const c = await manageCourse(u, cleanText(b.courseId, 200));
      const title = cleanText(b.title, 180),
        instructions = cleanText(b.instructions, 5000),
        dueAt = new Date(String(b.dueAt)),
        maxPoints = Number(b.maxPoints);
      if (
        !title ||
        !instructions ||
        !Number.isFinite(dueAt.getTime()) ||
        dueAt <= new Date() ||
        !Number.isInteger(maxPoints) ||
        maxPoints < 1 ||
        maxPoints > 1000
      )
        throw new HttpError(400, "بيانات الواجب غير صحيحة");
      await prisma.assignment.create({
        data: {
          courseId: c.id,
          teacherId: c.teacherId,
          title,
          instructions,
          dueAt,
          maxPoints,
        },
      });
    } else if (action === "submit") {
      if (u.role !== "STUDENT")
        throw new HttpError(403, "التسليم لحساب الطالب");
      const assignmentId = cleanText(b.assignmentId, 200);
      const a = await prisma.assignment.findUnique({
        where: { id: assignmentId },
      });
      if (!a) throw new HttpError(404, "الواجب غير موجود");
      await requireEnrollment(u.id, a.courseId);
      if (a.dueAt < new Date()) throw new HttpError(409, "انتهى موعد التسليم");
      const answer = cleanText(b.answer, 8000);
      if (!answer) throw new HttpError(400, "اكتب إجابتك");
      await prisma.$transaction(async (tx) => {
        const old = await tx.assignmentSubmission.findUnique({
          where: { assignmentId_studentId: { assignmentId, studentId: u.id } },
        });
        if (old?.score !== null && old?.score !== undefined)
          throw new HttpError(409, "لا يمكن تعديل واجب تم تقييمه");
        await tx.assignmentSubmission.upsert({
          where: { assignmentId_studentId: { assignmentId, studentId: u.id } },
          create: { assignmentId, studentId: u.id, answer },
          update: { answer, submittedAt: new Date() },
        });
      });
    } else if (action === "grade") {
      const id = cleanText(b.submissionId, 200);
      const s = await prisma.assignmentSubmission.findUnique({
        where: { id },
        include: { assignment: true },
      });
      if (!s) throw new HttpError(404, "التسليم غير موجود");
      await manageCourse(u, s.assignment.courseId);
      const score = Number(b.score);
      if (
        !Number.isInteger(score) ||
        score < 0 ||
        score > s.assignment.maxPoints
      )
        throw new HttpError(400, "الدرجة خارج النطاق");
      await prisma.assignmentSubmission.update({
        where: { id },
        data: { score, feedback: cleanText(b.feedback, 2000) },
      });
    } else throw new HttpError(400, "الإجراء غير صحيح");
    return Response.json({ success: true });
  } catch (e) {
    return fail(e);
  }
}
