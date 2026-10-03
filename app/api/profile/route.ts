import { requireStudent } from "@/lib/access";
import { prisma } from "@/lib/db/prisma";
import { readBody, cleanText, fail, HttpError } from "@/lib/http";
export async function GET() {
  try {
    const u = await requireStudent();
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: u.id },
    });
    return Response.json({ success: true, profile });
  } catch (e) {
    return fail(e);
  }
}
export async function POST(request: Request) {
  try {
    const u = await requireStudent();
    const b = await readBody(request);
    const dailyMinutes = Number(b.dailyMinutes);
    if (
      !Number.isInteger(dailyMinutes) ||
      dailyMinutes < 10 ||
      dailyMinutes > 180
    )
      throw new HttpError(400, "اختر هدفًا يوميًا بين 10 و180 دقيقة");
    const learningGoal = cleanText(b.learningGoal, 500);
    await prisma.studentProfile.upsert({
      where: { userId: u.id },
      create: { userId: u.id, dailyMinutes, learningGoal },
      update: { dailyMinutes, learningGoal },
    });
    return Response.json({ success: true });
  } catch (e) {
    return fail(e);
  }
}
