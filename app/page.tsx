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
  };
  courses: Course[];
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await fetch("/api/dashboard");

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
              <p className="text-slate-500">
                جاري تحميل لوحة التعلم...
              </p>
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

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50">
      <Sidebar />

      <div className="mr-72 min-h-screen">
        <Header />

        <main className="p-6 lg:p-8">
          {/* Welcome */}
          <section className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-l from-indigo-700 via-indigo-600 to-violet-600 p-8 text-white shadow-lg">
            <div className="max-w-3xl">
              <p className="mb-2 text-indigo-100">
                مرحبًا بك في حصة 👋
              </p>

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

          {/* Statistics */}
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
              title="ساعات التعلم"
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

          {/* Courses */}
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
                        {course.lessonsCount} دروس
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

          {/* AI Teacher */}
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

          {/* Learning time */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  هدفك اليومي
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  خطتك اليومية مصممة لتناسب وقتك.
                </p>
              </div>

              <div className="text-left">
                <div className="text-3xl font-bold text-indigo-600">
                  {data.student.dailyMinutes}
                </div>

                <div className="text-sm text-slate-500">
                  دقيقة يوميًا
                </div>
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

        <span className="text-sm text-slate-500">
          {title}
        </span>
      </div>

      <div className="text-3xl font-bold text-slate-900">
        {value}
      </div>

      <div className="mt-1 text-sm text-slate-500">
        {description}
      </div>
    </div>
  );
}