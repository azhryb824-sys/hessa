import { prisma } from "@/lib/db/prisma";
import { createSession, verifyPassword, hashPassword } from "@/lib/auth";
import { readBody, fail, cleanText, rateLimit, HttpError } from "@/lib/http";
export async function POST(request: Request) {
  try {
    const body = await readBody(request);
    await rateLimit("login-global", 100);
    const email = cleanText(body.email, 180).toLowerCase();
    const password = cleanText(body.password, 128);
    await rateLimit(`login:${email}`, 8, 15);
    const user = await prisma.user.findUnique({ where: { email } });
    // Always perform a password derivation, including for unknown accounts.
    const ok = verifyPassword(
      password,
      user?.password || hashPassword("unavailable-account"),
    );
    if (!user || !ok)
      throw new HttpError(401, "البريد الإلكتروني أو كلمة المرور غير صحيحة");
    await createSession(user.id);
    return Response.json({
      success: true,
      role: user.role,
      redirect: user.role === "STUDENT" ? "/dashboard" : "/workspace",
    });
  } catch (e) {
    return fail(e);
  }
}
