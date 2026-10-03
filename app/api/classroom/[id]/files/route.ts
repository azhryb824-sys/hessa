import { classroomAccess } from "@/lib/classroom";
import { prisma } from "@/lib/db/prisma";
import { readBytes, checkOrigin, fail, HttpError, rateLimit } from "@/lib/http";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    await classroomAccess(id);
    const fileId = new URL(request.url).searchParams.get("fileId");
    if (fileId) {
      const f = await prisma.classFile.findFirst({
        where: { id: fileId, classId: id },
      });
      if (!f) throw new HttpError(404, "الملف غير موجود");
      return new Response(new Uint8Array(f.data), {
        headers: {
          "Content-Type": f.mimeType,
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(f.name)}`,
          "X-Content-Type-Options": "nosniff",
          "Cache-Control": "private, no-store",
        },
      });
    }
    const files = await prisma.classFile.findMany({
      where: { classId: id },
      select: { id: true, name: true, mimeType: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ success: true, files });
  } catch (e) {
    return fail(e);
  }
}
export async function POST(request: Request, context: Context) {
  try {
    checkOrigin(request);
    const { id } = await context.params;
    const { user } = await classroomAccess(id);
    await rateLimit(`file:${user.id}`, 10, 60);
    const limit = 2 * 1024 * 1024;
    const bytes = await readBytes(request, limit);
    if (bytes.length > limit)
      throw new HttpError(413, "الحد الأقصى للملف 2 ميجابايت");
    const name = decodeURIComponent(request.headers.get("x-file-name") || "ملف")
      .replace(/[\/\\\r\n]/g, "_")
      .slice(0, 150);
    const mime =
      request.headers.get("content-type") || "application/octet-stream";
    if (
      !["application/pdf", "image/png", "image/jpeg", "text/plain"].includes(
        mime,
      )
    )
      throw new HttpError(400, "الأنواع المسموحة PDF وصور PNG/JPEG ونص");
    await prisma.classFile.create({
      data: {
        classId: id,
        senderId: user.id,
        name,
        mimeType: mime,
        data: bytes,
      },
    });
    return Response.json({ success: true });
  } catch (e) {
    return fail(e);
  }
}
