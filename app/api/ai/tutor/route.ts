import { HessaAICore } from "@/lib/ai/core";
import { searchCurriculum } from "@/lib/ai/curriculum-store";
import { prisma } from "@/lib/db/prisma";
import type { TutorRequest } from "@/lib/ai/types";
import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth/session";
import { requireEntitlement } from "@/lib/billing/entitlement";

const core = new HessaAICore();

export async function POST(request: Request) {
  try {
    const currentStudent = await requireStudent();
    await requireEntitlement(currentStudent.id);
    const body = (await request.json()) as TutorRequest;
    const studentId = currentStudent.id;
    body.student = { ...body.student, studentId };

    if (studentId) {
      const student = await prisma.user.findUnique({
        where: { id: studentId },
        include: { studentProfile: true }
      });
      if (student?.studentProfile) {
        body.student = {
          ...body.student,
          learningLevel: student.studentProfile.learningLevel,
          learningGoal: student.studentProfile.learningGoal
        };
      }
    }

    if (!body.retrievedContext?.length) {
      body.retrievedContext = await searchCurriculum(
        `${body.lessonTitle ?? ""} ${body.message ?? ""}`,
        body.subject,
        body.student?.grade
      );
    }

    const result = await core.tutor(body);
    return NextResponse.json(result, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "AI Core request failed" },
      { status: 400 }
    );
  }
}
