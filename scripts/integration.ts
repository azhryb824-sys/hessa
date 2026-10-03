import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
if (process.env.HESSA_TEST_MODE !== "1")
  throw new Error(
    "Integration tests create test users and records. Set HESSA_TEST_MODE=1 only on a disposable local database.",
  );
const base = process.env.TEST_BASE_URL || "http://localhost:3000";
let checks = 0;
async function call(
  path: string,
  cookie = "",
  body?: Record<string, unknown>,
  status = 200,
  origin = base,
) {
  const r = await fetch(base + path, {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
      ...(body ? { Origin: origin } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const d = await r.json();
  assert.equal(r.status, status, `${path}: ${JSON.stringify(d)}`);
  checks++;
  return { d, cookie: r.headers.get("set-cookie")?.split(";")[0] || "" };
}
async function login(email: string, password: string) {
  return (await call("/api/auth/login", "", { email, password })).cookie;
}
async function main() {
  await call("/api/dashboard", "", undefined, 401);
  const password = process.env.HESSA_BOOTSTRAP_PASSWORD!;
  assert.ok(password);
  const studentPassword = randomUUID() + "Aa1!";
  const suffix = randomUUID();
  const student = (
    await call(
      "/api/auth/register",
      "",
      {
        name: "طالب اختبار",
        email: `test-${suffix}@hessa.local`,
        password: studentPassword,
        gender: "MALE",
        birthDate: "2005-01-01",
      },
      201,
    )
  ).cookie;
  const other = (
    await call(
      "/api/auth/register",
      "",
      {
        name: "طالب آخر",
        email: `other-${suffix}@hessa.local`,
        password: studentPassword,
        gender: "MALE",
        birthDate: "2004-01-01",
      },
      201,
    )
  ).cookie;
  const girl = (
    await call(
      "/api/auth/register",
      "",
      {
        name: "طالبة اختبار",
        email: `girl-${suffix}@hessa.local`,
        password: studentPassword,
        gender: "FEMALE",
        birthDate: "2004-01-01",
      },
      201,
    )
  ).cookie;
  const teacher = await login("teacher@hessa.local", password);
  const admin = await login("admin@hessa.local", password);
  const parent = await login("parent@hessa.local", password);
  await call("/api/workspace", student, undefined, 403);
  await call("/api/workspace", teacher, { action: "user", name: "ممنوع" }, 403);
  await call(
    "/api/lessons/complete",
    student,
    { lessonId: "bad" },
    403,
    "https://untrusted.example",
  );
  const { d: dashboard } = await call("/api/dashboard", student);
  assert.equal(dashboard.statistics.completedLessons, 0);
  assert.equal(dashboard.student.learningStreak, 0);
  const { d: courses } = await call("/api/courses", student);
  const math = courses.courses.find(
    (c: { subject: string }) => c.subject === "الرياضيات",
  );
  assert.ok(math);
  const lessonId = math.lessons[0].id;
  const { d: lesson } = await call(
    `/api/lessons/details?id=${lessonId}`,
    student,
  );
  assert.ok(lesson.lesson.content);
  await call("/api/lessons/complete", student, { lessonId });
  await call("/api/lessons/complete", student, { lessonId });
  const { d: completed } = await call("/api/dashboard", student);
  assert.equal(completed.statistics.completedLessons, 1);
  assert.equal(completed.student.learningStreak, 1);
  const { d: exams } = await call("/api/exams", student);
  const examId = exams.exams.find(
    (e: { subject: string }) => e.subject === "الرياضيات",
  ).id;
  const { d: exam } = await call(`/api/exams/take?id=${examId}`, student);
  assert.ok(
    exam.exam.questions.every(
      (q: Record<string, unknown>) => !("correctAnswer" in q),
    ),
  );
  const key = randomUUID();
  const body = {
    assessmentId: examId,
    submissionKey: key,
    answers: { [exam.exam.questions[0].id]: "12" },
  };
  const { d: result } = await call("/api/exams/submit", student, body);
  const { d: repeat } = await call("/api/exams/submit", student, body);
  assert.equal(result.attemptId, repeat.attemptId);
  await call(`/api/exams/result?id=${result.attemptId}`, other, undefined, 404);
  await call(`/api/exams/result?id=${result.attemptId}`, student);
  await call("/api/exams/submit", student, {
    ...body,
    submissionKey: randomUUID(),
  });
  await call("/api/exams/submit", student, {
    ...body,
    submissionKey: randomUUID(),
  });
  await call(
    "/api/exams/submit",
    student,
    { ...body, submissionKey: randomUUID() },
    409,
  );
  const { d: plan } = await call("/api/learning-plan", student, {});
  assert.ok(plan.saved);
  assert.ok(plan.plan.items.every((i: { id: string }) => i.id !== lessonId));
  assert.ok(
    plan.plan.items.reduce(
      (sum: number, i: { minutes: number }) => sum + i.minutes,
      0,
    ) <= plan.plan.dailyMinutes,
  );
  await call("/api/ai/chat", student, { message: "ضع لي خطة مذاكرة" });
  await call("/ai/learning-analysis", student);
  const { d: oldClasses } = await call("/api/classes", teacher);
  for (const c of oldClasses.classes.filter(
    (c: { title: string; status: string }) =>
      ["حصة تحقق", "حصة تحقق المتصفح"].includes(c.title) &&
      c.status === "SCHEDULED",
  ))
    await call("/api/classes", teacher, {
      action: "cancel-class",
      classId: c.id,
    });
  const startsAt = new Date(Date.now() + 60000).toISOString();
  const { d: session } = await call(
    "/api/classes",
    teacher,
    {
      action: "create",
      courseId: math.id,
      title: "حصة تحقق",
      startsAt,
      duration: 30,
      capacity: 1,
    },
    201,
  );
  const classId = session.class.id;
  await call(
    "/api/classes",
    teacher,
    {
      action: "create",
      courseId: math.id,
      title: "متعارضة",
      startsAt,
      duration: 30,
      capacity: 1,
    },
    409,
  );
  await call("/api/classes", girl, { action: "book", classId }, 403);
  await call("/api/classes", student, { action: "book", classId });
  await call("/api/classes", other, { action: "book", classId }, 409);
  await call(`/api/classroom/${classId}`, other, undefined, 403);
  await call(`/api/classroom/${classId}`, student);
  await call(
    `/api/classroom/${classId}`,
    student,
    { type: "poll", data: { question: "ممنوع", options: ["أ", "ب"] } },
    403,
  );
  await call(`/api/classroom/${classId}`, teacher, {
    type: "poll",
    data: { question: "هل فهمت؟", options: ["نعم", "أحتاج شرحًا"] },
  });
  await call("/api/assignments", teacher, {
    action: "create",
    courseId: math.id,
    title: `واجب تحقق ${suffix}`,
    instructions: "حل مثالًا واشرحه",
    dueAt: new Date(Date.now() + 86400000).toISOString(),
    maxPoints: 10,
  });
  const { d: assignments } = await call("/api/assignments", student);
  const assignmentId = assignments.assignments.find(
    (a: { title: string }) => a.title === `واجب تحقق ${suffix}`,
  ).id;
  await call("/api/assignments", student, {
    action: "submit",
    assignmentId,
    answer: "إجابة اختبار",
  });
  const { d: teacherAssignments } = await call("/api/assignments", teacher);
  const submission = teacherAssignments.assignments.find(
    (a: { id: string }) => a.id === assignmentId,
  ).submissions[0];
  await call(
    "/api/assignments",
    teacher,
    { action: "grade", submissionId: submission.id, score: 11 },
    400,
  );
  await call("/api/assignments", teacher, {
    action: "grade",
    submissionId: submission.id,
    score: 8,
    feedback: "جيد",
  });
  await call(
    "/api/assignments",
    student,
    { action: "submit", assignmentId, answer: "تعديل بعد التقييم" },
    409,
  );
  const { d: ownAssignments } = await call("/api/assignments", other);
  assert.equal(
    ownAssignments.assignments.find(
      (a: { id: string }) => a.id === assignmentId,
    ).submissions.length,
    0,
  );
  const { d: parentWorkspace } = await call("/api/workspace", parent);
  assert.equal(parentWorkspace.children.length, 1);
  await call("/api/billing", admin, {
    action: "plan",
    name: "باقة تحقق",
    priceHalalas: 3000,
    durationDays: 30,
  });
  const { d: billing } = await call("/api/billing", student);
  const { d: order } = await call("/api/billing", student, {
    action: "order",
    planId: billing.plans[0].id,
  });
  await call(
    "/api/billing",
    student,
    {
      action: "confirm-payment",
      invoiceId: order.invoice.id,
      reference: "غير مصرح",
    },
    403,
  );
  await call("/api/billing", admin, {
    action: "confirm-payment",
    invoiceId: order.invoice.id,
    reference: "test-internal-only",
  });
  const { d: paid } = await call("/api/billing", student);
  await call("/api/billing", admin, {
    action: "confirm-payment",
    invoiceId: order.invoice.id,
    reference: "test-internal-only",
  });
  const { d: again } = await call("/api/billing", student);
  assert.equal(paid.subscription.expiresAt, again.subscription.expiresAt);
  await call("/api/profile", student, {
    dailyMinutes: 35,
    learningGoal: "تقوية المهارات",
  });
  const { d: profile } = await call("/api/profile", student);
  assert.equal(profile.profile.dailyMinutes, 35);
  await call("/api/profile", student, { dailyMinutes: 999 }, 400);
  await call("/api/ai/assistant", teacher, { message: "كيف أحسن الدرس؟" });
  await call("/api/ai/assistant", parent, { message: "كيف أدعم ابني؟" });
  await call("/api/ai/assistant", student, { message: "اختبار الصلاحية" }, 403);
  const changedPassword = randomUUID() + "Aa1!";
  await call(
    "/api/auth/password",
    other,
    { currentPassword: "wrong", password: changedPassword },
    403,
  );
  await call("/api/auth/password", other, {
    currentPassword: studentPassword,
    password: changedPassword,
  });
  await call("/api/dashboard", other, undefined, 401);
  const changedSession = await login(
    `other-${suffix}@hessa.local`,
    changedPassword,
  );
  await call("/api/dashboard", changedSession);
  await call("/api/auth/logout", student, {});
  await call("/api/dashboard", student, undefined, 401);
  console.log(
    `${checks} integration assertions passed: identity isolation, CSRF, lessons, exams, plan, chat, bookings, classroom roles, grading, parent scope, billing idempotency, logout`,
  );
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
