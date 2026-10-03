import { requireUser } from "@/lib/access";
import { verifyPassword, hashPassword, createSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { readBody, fail, HttpError, cleanText } from "@/lib/http";
export async function POST(request: Request) {
  try {
    const u = await requireUser();
    const b = await readBody(request);
    const current = cleanText(b.currentPassword, 128),
      password = cleanText(b.password, 128);
    if (!verifyPassword(current, u.password))
      throw new HttpError(403, "كلمة المرور الحالية غير صحيحة");
    if (password.length < 10)
      throw new HttpError(400, "كلمة المرور الجديدة يجب ألا تقل عن 10 أحرف");
    await prisma.$transaction([
      prisma.user.update({
        where: { id: u.id },
        data: { password: hashPassword(password) },
      }),
      prisma.session.deleteMany({ where: { userId: u.id } }),
    ]);
    await createSession(u.id);
    return Response.json({ success: true });
  } catch (e) {
    return fail(e);
  }
}
