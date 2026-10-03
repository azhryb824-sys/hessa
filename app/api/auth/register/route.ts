import { prisma } from "@/lib/db/prisma";
import { createSession, hashPassword } from "@/lib/auth";
import { readBody, fail, cleanText, HttpError, rateLimit } from "@/lib/http";
export async function POST(request: Request) {
  try {
    const b = await readBody(request);
    await rateLimit("register-global", 30, 60);
    const email = cleanText(b.email, 180).toLowerCase();
    const name = cleanText(b.name, 100);
    const password = cleanText(b.password, 128);
    if (
      name.length < 2 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      password.length < 10
    )
      throw new HttpError(
        400,
        "أدخل اسمًا وبريدًا صحيحًا وكلمة مرور من 10 أحرف على الأقل",
      );
    await rateLimit(`register:${email}`, 3, 60);
    if (await prisma.user.findUnique({ where: { email } }))
      throw new HttpError(409, "تعذر إنشاء الحساب بهذا البريد");
    const birthDate = new Date(String(b.birthDate));
    if (
      !["MALE", "FEMALE"].includes(String(b.gender)) ||
      !Number.isFinite(birthDate.getTime()) ||
      birthDate > new Date() ||
      birthDate < new Date("1900-01-01")
    )
      throw new HttpError(400, "أدخل الجنس وتاريخ ميلاد صحيحًا");
    const user = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashPassword(password),
          gender: String(b.gender),
          birthDate,
          role: "STUDENT",
          studentProfile: { create: { dailyMinutes: 30 } },
        },
      });
      const courses = await tx.course.findMany({
        where: { status: "PUBLISHED" },
      });
      await tx.enrollment.createMany({
        data: courses.map((c) => ({ userId: user.id, courseId: c.id })),
      });
      return user;
    });
    await createSession(user.id);
    return Response.json(
      { success: true, redirect: "/dashboard" },
      { status: 201 },
    );
  } catch (e) {
    return fail(e);
  }
}
