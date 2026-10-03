import { requireUser } from "@/lib/access";
import { classroomAccess } from "@/lib/classroom";
import { prisma } from "@/lib/db/prisma";
import { readBytes, checkOrigin, rateLimit, fail, HttpError } from "@/lib/http";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
type Context = { params: Promise<{ id: string }> };
const directory = () =>
  process.env.RECORDINGS_DIR ||
  path.join(process.cwd(), "storage", "recordings");
export async function GET(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const u = await requireUser();
    const c = await prisma.classSession.findUnique({
      where: { id },
      include: { bookings: true },
    });
    if (
      !c ||
      (u.role !== "ADMIN" &&
        c.teacherId !== u.id &&
        !c.bookings.some((b) => b.studentId === u.id))
    )
      throw new HttpError(403, "التسجيل غير متاح لحسابك");
    const recordingId = new URL(request.url).searchParams.get("recordingId");
    if (!recordingId)
      return Response.json({
        success: true,
        recordings: await prisma.classRecording.findMany({
          where: { classId: id },
          orderBy: { createdAt: "desc" },
        }),
      });
    const recording = await prisma.classRecording.findFirst({
      where: { id: recordingId, classId: id },
    });
    if (!recording) throw new HttpError(404, "التسجيل غير موجود");
    const bytes = await readFile(
      path.join(directory(), recording.id + ".webm"),
    );
    return new Response(bytes, {
      headers: {
        "Content-Type": "video/webm",
        "Content-Disposition": `attachment; filename="hessa-class-${recording.id}.webm"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    return fail(e);
  }
}
export async function POST(request: Request, context: Context) {
  try {
    checkOrigin(request);
    const { id } = await context.params;
    const { user, teacher, session } = await classroomAccess(id);
    if (!teacher) throw new HttpError(403, "حفظ التسجيل للمدرس");
    await rateLimit(`recording:${user.id}`, 5, 60);
    if (!request.headers.get("content-type")?.startsWith("video/webm"))
      throw new HttpError(400, "التسجيل يجب أن يكون WebM");
    const bytes = await readBytes(request, 50 * 1024 * 1024);
    if (!bytes.length) throw new HttpError(400, "التسجيل فارغ");
    const recordingId = randomUUID();
    await mkdir(directory(), { recursive: true });
    await writeFile(path.join(directory(), recordingId + ".webm"), bytes, {
      flag: "wx",
    });
    await prisma.classRecording.create({
      data: {
        id: recordingId,
        classId: id,
        teacherId: user.id,
        name: session.title,
        sizeBytes: bytes.length,
      },
    });
    return Response.json({ success: true, id: recordingId }, { status: 201 });
  } catch (e) {
    return fail(e);
  }
}
