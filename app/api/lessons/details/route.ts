import { requireStudent, requireEnrollment } from "@/lib/access";
import { prisma } from "@/lib/db/prisma";
import { fail, HttpError } from "@/lib/http";
export async function GET(request: Request) {
  try {
    const user = await requireStudent();
    const q = new URL(request.url).searchParams;
    const id = q.get("id");
    const courseId = q.get("courseId");
    const subject = q.get("subject");
    const order = Number(q.get("order"));
    if (
      !id &&
      (!Number.isInteger(order) || order < 1 || (!subject && !courseId))
    )
      throw new HttpError(400, "معرف الدرس أو المادة وترتيب الدرس مطلوب");
    const lesson = await prisma.lesson.findFirst({
      where: id
        ? { id }
        : {
            order,
            course: {
              ...(courseId ? { id: courseId } : { subject: subject! }),
              enrollments: { some: { userId: user.id } },
            },
          },
      include: {
        course: { select: { id: true, title: true, subject: true } },
        progress: { where: { userId: user.id } },
      },
    });
    if (!lesson) throw new HttpError(404, "الدرس غير موجود");
    await requireEnrollment(user.id, lesson.courseId);
    return Response.json(
      {
        success: true,
        lesson: {
          ...lesson,
          completed: lesson.progress.some((p) => p.completed),
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return fail(e);
  }
}
