import "dotenv/config";
import { chromium } from "playwright";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const runtimeExecutable = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES
  ? require(
      process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + "/playwright",
    ).chromium.executablePath()
  : undefined;
const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
  (runtimeExecutable && existsSync(runtimeExecutable)
    ? runtimeExecutable
    : undefined);
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3100";
const browser = await chromium.launch({
  headless: true,
  executablePath,
  args: [
    "--no-sandbox",
    "--use-fake-ui-for-media-stream",
    "--use-fake-device-for-media-stream",
  ],
});
const password = process.env.HESSA_BOOTSTRAP_PASSWORD;
assert.ok(password);
await mkdir("qa", { recursive: true });
const errors = [];
try {
  const student = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    permissions: ["camera", "microphone"],
  });
  const teacher = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    permissions: ["camera", "microphone"],
  });
  const page = await student.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base);
  await page.screenshot({ path: "qa/home-desktop.png", fullPage: true });
  await page.goto(base + "/login");
  await page.locator("input[name=email]").fill("student@hessa.local");
  await page.locator("input[name=password]").fill(password);
  await page.getByRole("button", { name: "دخول", exact: true }).click();
  await page.waitForURL("**/dashboard");
  await page
    .getByText("واصل رحلتك التعليمية")
    .waitFor({ timeout: 10000 })
    .catch(() => {});
  await page.screenshot({ path: "qa/dashboard-desktop.png", fullPage: true });
  await page.goto(base + "/dashboard/learning-plan");
  await page.getByRole("button", { name: "تحديث الخطة وحفظها" }).click();
  await page.locator(".card-list").waitFor();
  await page.screenshot({ path: "qa/plan-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + "/dashboard");
  await page.locator(".hessa-header").waitFor();
  await page.screenshot({ path: "qa/dashboard-mobile.png", fullPage: true });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    "mobile dashboard horizontal overflow",
  );
  await page.goto(base);
  await page.screenshot({ path: "qa/home-mobile.png", fullPage: true });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    "mobile home horizontal overflow",
  );
  const login = await teacher.request.post(base + "/api/auth/login", {
    data: { email: "teacher@hessa.local", password },
    headers: { Origin: base },
  });
  assert.equal(login.status(), 200);
  const courses = await (
    await student.request.get(base + "/api/courses")
  ).json();
  const math = courses.courses.find((c) => c.subject === "الرياضيات");
  const existing = await (
    await teacher.request.get(base + "/api/classes")
  ).json();
  for (const c of existing.classes.filter(
    (c) => c.status === "SCHEDULED" && c.title.includes("تحقق"),
  ))
    await teacher.request.post(base + "/api/classes", {
      data: { action: "cancel-class", classId: c.id },
      headers: { Origin: base },
    });
  const created = await teacher.request.post(base + "/api/classes", {
    data: {
      action: "create",
      courseId: math.id,
      title: "حصة تحقق المتصفح",
      startsAt: new Date(Date.now() + 60000).toISOString(),
      duration: 30,
      capacity: 2,
    },
    headers: { Origin: base },
  });
  assert.equal(created.status(), 201);
  const { class: room } = await created.json();
  const booked = await student.request.post(base + "/api/classes", {
    data: { action: "book", classId: room.id },
    headers: { Origin: base },
  });
  assert.equal(booked.status(), 200);
  const teacherPage = await teacher.newPage();
  teacherPage.on("pageerror", (e) => errors.push(e.message));
  await teacherPage.goto(base + "/classroom/" + room.id);
  await teacherPage.getByRole("button", { name: "الدخول إلى الغرفة" }).click();
  await teacherPage.locator(".whiteboard").waitFor();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + "/classroom/" + room.id);
  await page.getByRole("button", { name: "الدخول إلى الغرفة" }).click();
  await page.locator(".whiteboard").waitFor();
  await page.locator('input[aria-label="رسالتك"]').fill("سؤال تحقق للمدرس");
  await page.getByRole("button", { name: "إرسال", exact: true }).click();
  await teacherPage.getByText("سؤال تحقق للمدرس").waitFor({ timeout: 15000 });
  await page.getByRole("button", { name: "رفع اليد ✋" }).click();
  await teacherPage
    .getByText("يريد المشاركة", { exact: false })
    .waitFor({ timeout: 15000 });
  await page.waitForFunction(
    () => document.querySelectorAll(".video-tile video").length >= 2,
    {},
    { timeout: 15000 },
  );
  await teacherPage.screenshot({
    path: "qa/classroom-desktop.png",
    fullPage: true,
  });
  assert.deepEqual(errors, [], "browser errors");
  console.log(
    "Browser checks passed: login, dashboard, saved plan, mobile layout, two-party classroom video, chat and raised hand",
  );
} finally {
  await browser.close();
}
