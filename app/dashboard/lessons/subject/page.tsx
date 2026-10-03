import { requireStudent } from "@/lib/access";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
export default async function SubjectLesson({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; order?: string }>;
}) {
  const u = await requireStudent();
  const q = await searchParams;
  const lesson = await prisma.lesson.findFirst({
    where: {
      order: Number(q.order) || 1,
      course: {
        subject: q.subject || "",
        enrollments: { some: { userId: u.id } },
      },
    },
  });
  if (!lesson) redirect("/dashboard/courses");
  redirect(`/dashboard/lessons/${lesson.id}`);
}
