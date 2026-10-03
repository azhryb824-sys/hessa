import { requireStudent } from "@/lib/access";
import { prisma } from "@/lib/db/prisma";
import { learningData } from "@/lib/learning-data";
import { fail, checkOrigin, rateLimit } from "@/lib/http";
async function buildPlan(userId: string) {
  const d = await learningData(userId);
  const lessons = await prisma.lesson.findMany({
    where: {
      course: { enrollments: { some: { userId } } },
      progress: { none: { userId, completed: true } },
    },
    orderBy: [{ order: "asc" }],
    include: { course: true },
  });
  const rank = new Map(
    d.courses
      .slice()
      .sort((a, b) => a.progress - b.progress)
      .map((c, i) => [c.id, i]),
  );
  lessons.sort(
    (a, b) =>
      (rank.get(a.courseId) || 0) - (rank.get(b.courseId) || 0) ||
      a.order - b.order,
  );
  let budget = d.student.dailyMinutes;
  const items: {
    id: string;
    subject: string;
    title: string;
    minutes: number;
    type: string;
    href: string;
  }[] = [];
  for (const l of lessons) {
    if (budget <= 0 || items.length >= 3) break;
    const minutes = Math.min(budget, l.duration || 15);
    items.push({
      id: l.id,
      subject: l.course.subject,
      title: l.title,
      minutes,
      type: "LESSON",
      href: `/dashboard/lessons/${l.id}`,
    });
    budget -= minutes;
  }
  if (d.statistics.averageScore < 70 && d.exams.length)
    items.unshift({
      id: d.exams[0].id,
      subject: d.exams[0].subject,
      title: "راجع إجابات آخر اختبار وحدد سبب الخطأ",
      minutes: 10,
      type: "REVIEW",
      href: `/dashboard/exams/result?id=${d.exams[0].id}`,
    });
  let remaining = d.student.dailyMinutes;
  const scheduled = items
    .map((item) => {
      const minutes = Math.min(remaining, item.minutes);
      remaining -= minutes;
      return { ...item, minutes };
    })
    .filter((item) => item.minutes > 0);
  return {
    generatedAt: new Date().toISOString(),
    dailyMinutes: d.student.dailyMinutes,
    items: scheduled,
    analysis: d.learningState,
    adaptive: d.adaptive,
  };
}
export async function GET() {
  try {
    const u = await requireStudent();
    const plan = await prisma.learningPlan.findFirst({
      where: { userId: u.id },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({
      success: true,
      plan: plan ? JSON.parse(plan.data) : await buildPlan(u.id),
      saved: !!plan,
    });
  } catch (e) {
    return fail(e);
  }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const u = await requireStudent();
    await rateLimit(`plan:${u.id}`, 10);
    const data = await buildPlan(u.id);
    await prisma.learningPlan.create({
      data: {
        userId: u.id,
        data: JSON.stringify(data),
        engineVersion: "0.4.0",
      },
    });
    return Response.json({ success: true, plan: data, saved: true });
  } catch (e) {
    return fail(e);
  }
}
