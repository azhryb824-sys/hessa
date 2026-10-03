"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";

type Exam = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  subject: string;
  questions: number;
  totalPoints: number;
  completed: boolean;
  latestAttempt: {
    id: string;
    score: number;
    completedAt: string | null;
  } | null;
  attemptsCount: number;
};

type ExamsData = {
  statistics: {
    totalExams: number;
    completedExams: number;
    pendingExams: number;
    averageScore: number;
  };
  exams: Exam[];
};

export default function ExamsPage() {
  const [data, setData] = useState<ExamsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadExams() {
      try {
        const response = await fetch("/api/exams", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load exams");
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || "Failed to load exams");
        }

        setData(result);
      } catch (err) {
        console.error(err);
        setError("تعذر تحميل الاختبارات");
      } finally {
        setLoading(false);
      }
    }

    loadExams();
  }, []);

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-50">
        <Sidebar />
        <div className="mr-72 min-h-screen">
          <Header />
          <main className="p-6 lg:p-8">
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
              <p className="text-slate-500">جاري تحميل الاختبارات...</p>
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
              {error || "حدث خطأ أثناء تحميل الاختبارات"}
            </div>
          </main>
        </div>
      </div>
    );
  }

  const recommendedExam =
    data.exams.find((exam) => !exam.completed) ??
    data.exams[0] ??
    null;

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50">
      <Sidebar />

      <div className="mr-72 min-h-screen">
        <Header />

        <main className="p-6 lg:p-8">
          <div>
            <p className="text-sm font-bold text-indigo-600">التقييم</p>

            <h1 className="mt-2 text-3xl font-black text-slate-900">
              الاختبارات
            </h1>

            <p className="mt-2 text-slate-500">
              اختبر فهمك وتابع تطور مستواك الدراسي.
            </p>
          </div>

          <section className="mt-8 grid gap-4 sm:grid-cols-3">
            <Stat
              title="الاختبارات المكتملة"
              value={data.statistics.completedExams.toString()}
              icon="✓"
            />

            <Stat
              title="متوسط الدرجات"
              value={`${data.statistics.averageScore}%`}
              icon="↗"
            />

            <Stat
              title="اختبارات لم تبدأ"
              value={data.statistics.pendingExams.toString()}
              icon="📝"
            />
          </section>

          {recommendedExam && (
            <section className="mt-8 overflow-hidden rounded-3xl bg-indigo-600 p-7 text-white shadow-lg">
              <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
                <div>
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
                    {recommendedExam.completed
                      ? "آخر اختبار"
                      : "اختبار مقترح لك"}
                  </span>

                  <h2 className="mt-5 text-2xl font-black">
                    {recommendedExam.title}
                  </h2>

                  <p className="mt-3 text-indigo-100">
                    {recommendedExam.questions} أسئلة ·{" "}
                    {recommendedExam.totalPoints} درجات ·{" "}
                    {recommendedExam.subject}
                  </p>

                  <p className="mt-3 max-w-2xl text-sm leading-7 text-indigo-100">
                    {recommendedExam.description ||
                      "اختبر فهمك وتابع تطور مستواك الدراسي."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    window.location.href = recommendedExam.completed
                      ? `/dashboard/exams/result?id=${encodeURIComponent(
                          recommendedExam.latestAttempt?.id ?? ""
                        )}`
                      : `/dashboard/exams/take?id=${encodeURIComponent(
                          recommendedExam.id
                        )}`;
                  }}
                  className="shrink-0 rounded-2xl bg-white px-7 py-4 font-bold text-indigo-600 transition hover:bg-indigo-50"
                >
                  {recommendedExam.completed
                    ? "عرض النتيجة"
                    : "بدء الاختبار"}
                </button>
              </div>
            </section>
          )}

          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                سجل الاختبارات
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                نتائج الاختبارات السابقة والاختبارات المتاحة
              </p>
            </div>

            {data.exams.length === 0 ? (
              <div className="mt-6 rounded-2xl bg-slate-50 p-8 text-center">
                <div className="text-4xl">📝</div>

                <p className="mt-3 font-bold text-slate-700">
                  لا توجد اختبارات متاحة حاليًا
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  ستظهر الاختبارات هنا عند إضافتها إلى المقررات.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {data.exams.map((exam) => {
                  const completed = exam.completed;

                  return (
                    <div
                      key={exam.id}
                      className="rounded-2xl border border-slate-100 p-5 transition hover:border-indigo-100"
                    >
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-xl">
                            🧠
                          </div>

                          <div>
                            <p className="text-xs font-bold text-indigo-600">
                              {exam.subject}
                            </p>

                            <h3 className="mt-1 font-black text-slate-900">
                              {exam.title}
                            </h3>

                            <p className="mt-2 text-sm text-slate-400">
                              {exam.questions} أسئلة ·{" "}
                              {exam.totalPoints} درجات
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-5">
                          <div>
                            <p className="text-xs text-slate-400">
                              النتيجة
                            </p>

                            <p
                              className={`mt-1 font-black ${
                                completed
                                  ? "text-emerald-600"
                                  : "text-slate-400"
                              }`}
                            >
                              {completed && exam.latestAttempt
                                ? `${exam.latestAttempt.score}%`
                                : "—"}
                            </p>
                          </div>

                          <span
                            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                              completed
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-amber-50 text-amber-600"
                            }`}
                          >
                            {completed ? "مكتمل" : "لم يبدأ"}
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              window.location.href = completed
                                ? `/dashboard/exams/result?id=${encodeURIComponent(
                                    exam.latestAttempt?.id ?? ""
                                  )}`
                                : `/dashboard/exams/take?id=${encodeURIComponent(
                                    exam.id
                                  )}`;
                            }}
                            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-600"
                          >
                            {completed ? "عرض النتيجة" : "بدء الاختبار"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="mt-8 rounded-3xl border border-indigo-100 bg-indigo-50 p-7">
            <span className="text-sm font-black text-indigo-600">
              تحليل ذكي
            </span>

            <h2 className="mt-3 text-2xl font-black text-slate-900">
              الاختبار لن ينتهي عند ظهور الدرجة
            </h2>

            <p className="mt-3 max-w-3xl leading-8 text-slate-600">
              سيحلل محرك حصة إجابات الطالب والأخطاء المتكررة
              والموضوعات التي تحتاج إلى مراجعة، ثم يستخدم النتائج
              لتحديث خطة التعلم الشخصية.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}

function Stat({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-slate-500">
          {title}
        </span>

        <span className="text-xl">{icon}</span>
      </div>

      <p className="mt-4 text-3xl font-black text-slate-900">
        {value}
      </p>
    </div>
  );
}