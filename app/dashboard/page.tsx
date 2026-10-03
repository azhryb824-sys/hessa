"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";

type Course = {
  id: string;
  title: string;
  subject: string;
  progress: number;
  lessonsCount: number;
  completedLessons?: number;
  totalLessons?: number;
};

type LastCompletedLesson = {
  lessonId: string;
  title: string;
  order: number;
  completedAt: string | null;
  course: {
    id: string;
    title: string;
    subject: string;
  };
};

type DashboardData = {
  student: {
    name: string;
    learningLevel: string | null;
    learningGoal: string | null;
    dailyMinutes: number;
    learningStreak: number;
    totalHours: number;
  };

  statistics: {
    totalCourses: number;
    averageProgress: number;
    averageScore: number;
    completedAssessments: number;
    completedLessons?: number;
    totalLessons?: number;
    totalLearningMinutes?: number;
    calculatedTotalHours?: number;
  };

  lastCompletedLesson?: LastCompletedLesson | null;

  nextCourse?: Course | null;

  courses: Course[];
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await fetch("/api/dashboard", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load dashboard");
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || "Failed to load dashboard");
        }

        setData(result);
      } catch (err) {
        console.error(err);
        setError("تعذر تحميل لوحة التحكم");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-50">
        <Sidebar />

        <div className="mr-72 min-h-screen">
          <Header />

          <main className="p-6 lg:p-8">
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
              <p className="text-slate-500">جاري تحميل لوحة التعلم...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-50">
        <Sidebar />

        <div className="mr-72 min-h-screen">
          <Header />

          <main className="p-6 lg:p-8">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
              {error || "حدث خطأ أثناء تحميل البيانات"}
            </div>
          </main>
        </div>
      </div>
    );
  }

  const levelLabel =
    data.student.learningLevel === "BEGINNER"
      ? "مبتدئ"
      : data.student.learningLevel === "ADVANCED"
        ? "متقدم"
        : "متوسط";

  const completedLessons = data.statistics.completedLessons ?? 0;

  const totalLessons = data.statistics.totalLessons ?? 0;

  const lessonProgress =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const dailyGoalMinutes = data.student.dailyMinutes;

  const completedLessonMinutes = data.statistics.totalLearningMinutes ?? 0;

  const dailyGoalProgress =
    dailyGoalMinutes > 0
      ? Math.min(
          100,
          Math.round((completedLessonMinutes / dailyGoalMinutes) * 100),
        )
      : 0;

  const nextCourse =
    data.nextCourse ??
    data.courses.find((course) => course.progress < 100) ??
    null;

  const lastCompletedLesson = data.lastCompletedLesson ?? null;

  const nextLessonSubject =
    nextCourse?.subject ||
    lastCompletedLesson?.course.subject ||
    data.courses.find((course) => course.progress < 100)?.subject;

  const nextLessonOrder = lastCompletedLesson
    ? lastCompletedLesson.order + 1
    : 1;

  const continueLearningUrl = nextLessonSubject
    ? `/dashboard/lessons/subject?subject=${encodeURIComponent(
        nextLessonSubject,
      )}&order=${nextLessonOrder}`
    : "/dashboard/courses";

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50">
      <Sidebar />

      <div className="mr-72 min-h-screen">
        <Header />

        <main className="p-6 lg:p-8">
          <section className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-l from-indigo-700 via-indigo-600 to-violet-600 p-8 text-white shadow-lg">
            <div className="max-w-3xl">
              <p className="mb-2 text-indigo-100">مرحبًا بك في حصة 👋</p>

              <h1 className="text-3xl font-bold lg:text-4xl">
                أهلاً {data.student.name}
              </h1>

              <p className="mt-4 leading-7 text-indigo-100">
                {data.student.learningGoal ||
                  "استمر في التعلم وطوّر مهاراتك كل يوم."}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <span className="rounded-full bg-white/15 px-4 py-2 text-sm">
                  المستوى: {levelLabel}
                </span>

                <span className="rounded-full bg-white/15 px-4 py-2 text-sm">
                  {data.student.dailyMinutes} دقيقة يوميًا
                </span>

                <span className="rounded-full bg-white/15 px-4 py-2 text-sm">
                  🔥 {data.student.learningStreak} أيام متتالية
                </span>
              </div>
            </div>
          </section>

          <section className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="المواد"
              value={data.statistics.totalCourses.toString()}
              description="مواد مسجلة"
              icon="📚"
            />

            <StatCard
              title="متوسط التقدم"
              value={`${data.statistics.averageProgress}%`}
              description="في جميع المواد"
              icon="📈"
            />

            <StatCard
              title="مدة الدروس المكتملة"
              value={`${data.student.totalHours}`}
              description="ساعة إجماليًا"
              icon="⏱️"
            />

            <StatCard
              title="الاختبارات"
              value={data.statistics.completedAssessments.toString()}
              description="اختبارات مكتملة"
              icon="📝"
            />
          </section>

          <section className="mb-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-l from-indigo-50 to-violet-50 p-6 shadow-sm">
              <div className="flex flex-col gap-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700">
                      🚀 متابعة التعلم
                    </span>

                    <h2 className="mt-3 text-2xl font-bold text-slate-900">
                      {lastCompletedLesson
                        ? "أكمل من حيث توقفت"
                        : "ابدأ رحلتك التعليمية"}
                    </h2>

                    <p className="mt-2 leading-7 text-slate-600">
                      {lastCompletedLesson
                        ? `آخر درس أكملته: ${lastCompletedLesson.title}`
                        : "اختر مادة وابدأ أول درس لك."}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white p-3 text-2xl shadow-sm">
                    📖
                  </div>
                </div>

                {totalLessons > 0 && (
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-slate-600">الدروس المكتملة</span>

                      <span className="font-bold text-indigo-700">
                        {completedLessons} / {totalLessons}
                      </span>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all"
                        style={{
                          width: `${lessonProgress}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                <a
                  href={continueLearningUrl}
                  className="inline-flex w-fit items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white transition hover:bg-indigo-700"
                >
                  {lastCompletedLesson ? "متابعة التعلم ←" : "ابدأ التعلم ←"}
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
                    📅 هدف اليوم
                  </span>

                  <h2 className="mt-3 text-2xl font-bold text-slate-900">
                    {dailyGoalMinutes} دقيقة
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    هدفك اليومي مصمم ليتناسب مع وقتك ومستواك.
                  </p>
                </div>

                <div className="text-4xl">
                  {dailyGoalProgress >= 100 ? "🏆" : "🎯"}
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-500">الإنجاز الحالي</span>

                  <span className="font-bold text-emerald-600">
                    {dailyGoalProgress}%
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{
                      width: `${dailyGoalProgress}%`,
                    }}
                  />
                </div>

                <p className="mt-3 text-xs text-slate-400">
                  {completedLessonMinutes} دقيقة مسجلة من الدروس المكتملة
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  تقدمي في المواد
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  تابع تقدمك في كل مادة
                </p>
              </div>

              <a
                href="/dashboard/courses"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                عرض الكل
              </a>
            </div>

            <div className="space-y-5">
              {data.courses.map((course) => (
                <div key={course.id}>
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {course.title}
                      </h3>

                      <p className="text-xs text-slate-500">
                        {course.completedLessons ?? 0} من{" "}
                        {course.totalLessons ?? course.lessonsCount} دروس مكتملة
                      </p>
                    </div>

                    <span className="font-bold text-indigo-600">
                      {course.progress}%
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all"
                      style={{
                        width: `${course.progress}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-8 rounded-2xl border border-indigo-100 bg-gradient-to-l from-indigo-50 to-violet-50 p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-3 inline-flex rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700">
                  ✨ مدرس الذكاء الاصطناعي
                </div>

                <h2 className="text-2xl font-bold text-slate-900">
                  هل تحتاج إلى مساعدة في دراستك؟
                </h2>

                <p className="mt-2 max-w-2xl leading-7 text-slate-600">
                  اسأل مدرس الذكاء الاصطناعي، واحصل على شرح يتناسب مع مستواك
                  وطريقة تعلمك.
                </p>
              </div>

              <a
                href="/dashboard/ai-teacher"
                className="shrink-0 rounded-xl bg-indigo-600 px-6 py-3 text-center font-medium text-white transition hover:bg-indigo-700"
              >
                ابدأ التعلم مع AI
              </a>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  ملخص رحلتك التعليمية
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  نظرة سريعة على نشاطك الحالي في منصة حصة.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <MiniStat value={`${completedLessons}`} label="درس مكتمل" />

                <MiniStat value={`${totalLessons}`} label="إجمالي الدروس" />

                <MiniStat
                  value={`${data.student.learningStreak}`}
                  label="أيام متتالية"
                />
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-2xl">{icon}</span>

        <span className="text-sm text-slate-500">{title}</span>
      </div>

      <div className="text-3xl font-bold text-slate-900">{value}</div>

      <div className="mt-1 text-sm text-slate-500">{description}</div>
    </div>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-[90px] rounded-xl bg-slate-50 px-4 py-3 text-center">
      <div className="text-xl font-bold text-indigo-600">{value}</div>

      <div className="mt-1 text-xs text-slate-500">{label}</div>
    </div>
  );
}
