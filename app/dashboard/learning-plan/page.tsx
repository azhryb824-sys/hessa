"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";

type Course = {
  id: string;
  title: string;
  subject: string;
  progress: number;
  lessons: number;
  completedLessons: number;
};

type Exam = {
  id: string;
  title: string;
  subject: string;
  score: number | null;
  completed: boolean;
};

type DashboardData = {
  student: {
    name: string;
    learningLevel: string;
    learningGoal: string | null;
    dailyMinutes: number;
  };
  courses: Course[];
  exams: Exam[];
};

type PlanItem = {
  day: string;
  subject: string;
  lesson: string;
  duration: string;
  type: string;
  status: string;
};

export default function LearningPlanPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    async function loadPlanData() {
      try {
        const response = await fetch("/api/dashboard", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "تعذر تحميل بيانات خطة التعلم."
          );
        }

        setData({
          student: {
            name: result.student?.name ?? "طالب حصة",
            learningLevel:
              result.student?.learningLevel ?? "INTERMEDIATE",
            learningGoal:
              result.student?.learningGoal ?? null,
            dailyMinutes:
              result.student?.dailyMinutes ?? 45,
          },
          courses: Array.isArray(result.courses)
            ? result.courses
            : [],
          exams: Array.isArray(result.exams)
            ? result.exams
            : [],
        });
      } catch (err) {
        console.error(err);
        setError("تعذر تحميل خطة التعلم.");
      } finally {
        setLoading(false);
      }
    }

    loadPlanData();
  }, []);

  const analysis = useMemo(() => {
    if (!data) {
      return null;
    }

    const courses = data.courses;
    const exams = data.exams;

    const completedExams = exams.filter(
      (exam) => exam.completed && exam.score !== null
    );

    const averageScore =
      completedExams.length > 0
        ? Math.round(
            completedExams.reduce(
              (total, exam) => total + (exam.score ?? 0),
              0
            ) / completedExams.length
          )
        : 0;

    const weakestCourse =
      courses.length > 0
        ? [...courses].sort(
            (a, b) => a.progress - b.progress
          )[0]
        : null;

    const strongestCourse =
      courses.length > 0
        ? [...courses].sort(
            (a, b) => b.progress - a.progress
          )[0]
        : null;

    const averageProgress =
      courses.length > 0
        ? Math.round(
            courses.reduce(
              (total, course) => total + course.progress,
              0
            ) / courses.length
          )
        : 0;

    let level = "مبتدئ";

    if (data.student.learningLevel === "ADVANCED") {
      level = "متقدم";
    } else if (data.student.learningLevel === "INTERMEDIATE") {
      level = "متوسط";
    }

    return {
      level,
      averageScore,
      averageProgress,
      weakestCourse,
      strongestCourse,
      completedExams: completedExams.length,
    };
  }, [data]);

  const plan = useMemo<PlanItem[]>(() => {
    if (!data || !analysis) {
      return [];
    }

    const items: PlanItem[] = [];

    const weakestCourse = analysis.weakestCourse;

    if (weakestCourse) {
      const nextLessonNumber =
        Math.min(
          weakestCourse.completedLessons + 1,
          weakestCourse.lessons
        );

      if (
        weakestCourse.completedLessons <
        weakestCourse.lessons
      ) {
        items.push({
          day: "اليوم",
          subject: weakestCourse.subject,
          lesson: `الدرس ${nextLessonNumber} من ${weakestCourse.lessons}`,
          duration: `${Math.min(
            30,
            Math.max(20, data.student.dailyMinutes - 15)
          )} دقيقة`,
          type: "درس",
          status: "مقترح",
        });
      }

      if (weakestCourse.completedLessons > 0) {
        items.push({
          day: "اليوم",
          subject: weakestCourse.subject,
          lesson: "مراجعة وتدريب",
          duration: "15 دقيقة",
          type: "تدريب",
          status: "مقترح",
        });
      }
    }

    const otherCourse = data.courses.find(
      (course) => course.id !== weakestCourse?.id
    );

    if (otherCourse) {
      items.push({
        day: "غدًا",
        subject: otherCourse.subject,
        lesson:
          otherCourse.completedLessons <
          otherCourse.lessons
            ? `الدرس ${
                otherCourse.completedLessons + 1
              }`
            : "مراجعة",
        duration: "25 دقيقة",
        type:
          otherCourse.completedLessons <
          otherCourse.lessons
            ? "درس"
            : "مراجعة",
        status: "مخطط",
      });
    }

    if (analysis.averageScore < 60) {
      items.push({
        day: "غدًا",
        subject: weakestCourse?.subject ?? "مراجعة عامة",
        lesson: "مراجعة الأخطاء السابقة",
        duration: "20 دقيقة",
        type: "مراجعة",
        status: "مهم",
      });
    }

    return items.slice(0, 4);
  }, [data, analysis]);

  function handleUpdatePlan() {
    setUpdated(true);

    window.setTimeout(() => {
      setUpdated(false);
    }, 2500);
  }

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-50">
        <Sidebar />

        <div className="mr-72 min-h-screen">
          <Header />

          <main className="p-6 lg:p-8">
            <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
              <p className="text-slate-500">
                جاري تحميل خطة التعلم...
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !data || !analysis) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-50">
        <Sidebar />

        <div className="mr-72 min-h-screen">
          <Header />

          <main className="p-6 lg:p-8">
            <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
              {error || "تعذر تحميل بيانات خطة التعلم."}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50">
      <Sidebar />

      <div className="mr-72 min-h-screen">
        <Header />

        <main className="p-6 lg:p-8">
          <div>
            <p className="text-sm font-bold text-indigo-600">
              تعلم شخصي
            </p>

            <h1 className="mt-2 text-3xl font-black text-slate-900">
              خطة التعلم
            </h1>

            <p className="mt-2 max-w-2xl text-slate-500">
              مسار تعليمي يتكيف مع مستواك ونتائج اختباراتك
              وتقدمك في الدروس.
            </p>
          </div>

          <section className="mt-8 grid gap-5 lg:grid-cols-3">
            <div className="rounded-3xl bg-indigo-600 p-6 text-white shadow-lg">
              <p className="text-sm text-indigo-200">
                مستوى التعلم الحالي
              </p>

              <h2 className="mt-3 text-3xl font-black">
                {analysis.level}
              </h2>

              <p className="mt-3 text-sm leading-7 text-indigo-100">
                سيتم تحديث التوصيات مع كل درس واختبار جديد.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <p className="text-sm text-slate-400">
                الهدف الحالي
              </p>

              <h2 className="mt-3 text-2xl font-black text-slate-900">
                {data.student.learningGoal || "تحسين المستوى الدراسي"}
              </h2>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all"
                  style={{
                    width: `${Math.min(
                      analysis.averageProgress,
                      100
                    )}%`,
                  }}
                />
              </div>

              <p className="mt-3 text-sm font-bold text-indigo-600">
                {analysis.averageProgress}% متوسط تقدم المقررات
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <p className="text-sm text-slate-400">
                وقت التعلم اليومي
              </p>

              <h2 className="mt-3 text-2xl font-black text-slate-900">
                {data.student.dailyMinutes} دقيقة
              </h2>

              <p className="mt-3 text-sm text-slate-500">
                الوقت المخصص للتعلم اليومي وفق ملف الطالب.
              </p>
            </div>
          </section>

          <section className="mt-8 grid gap-5 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <p className="text-sm text-slate-400">
                متوسط نتائج الاختبارات
              </p>

              <h2 className="mt-3 text-3xl font-black text-slate-900">
                {analysis.completedExams > 0
                  ? `${analysis.averageScore}%`
                  : "لا توجد نتائج"}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                مبني على الاختبارات المكتملة.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <p className="text-sm text-slate-400">
                يحتاج إلى اهتمام أكبر
              </p>

              <h2 className="mt-3 text-2xl font-black text-slate-900">
                {analysis.weakestCourse?.subject ??
                  "سيتم تحديده لاحقًا"}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {analysis.weakestCourse
                  ? `${analysis.weakestCourse.progress}% تقدم حالي`
                  : "نحتاج إلى بيانات تقدم كافية."}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <p className="text-sm text-slate-400">
                نقطة القوة الحالية
              </p>

              <h2 className="mt-3 text-2xl font-black text-slate-900">
                {analysis.strongestCourse?.subject ??
                  "سيتم تحديدها لاحقًا"}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {analysis.strongestCourse
                  ? `${analysis.strongestCourse.progress}% تقدم حالي`
                  : "نحتاج إلى بيانات تقدم كافية."}
              </p>
            </div>
          </section>

          <section className="mt-8 rounded-3xl border border-indigo-100 bg-indigo-50 p-7">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <span className="text-sm font-black text-indigo-600">
                  خطة مدعومة بالبيانات
                </span>

                <h2 className="mt-3 text-2xl font-black text-slate-900">
                  حصة تعدّل المسار بناءً على أدائك
                </h2>

                <p className="mt-3 max-w-3xl leading-8 text-slate-600">
                  تعتمد الخطة الحالية على تقدم المقررات ونتائج
                  الاختبارات والدروس المكتملة. لاحقًا سيضيف محرك
                  الذكاء الاصطناعي تحليل الأخطاء وأنماط التعلم
                  والتوصيات الشخصية بصورة أعمق.
                </p>
              </div>

              <button
                type="button"
                onClick={handleUpdatePlan}
                className="shrink-0 rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white transition hover:bg-indigo-700"
              >
                {updated ? "تم تحديث التحليل ✓" : "تحديث الخطة"}
              </button>
            </div>
          </section>

          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                المسار المقترح
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                المهام التعليمية المقترحة بناءً على بياناتك الحالية
              </p>
            </div>

            {plan.length === 0 ? (
              <div className="mt-6 rounded-2xl bg-slate-50 p-8 text-center">
                <div className="text-4xl">📚</div>

                <p className="mt-3 font-bold text-slate-700">
                  لا توجد مهام مقترحة حاليًا
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  ستتكون الخطة تلقائيًا مع توفر بيانات التعلم.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {plan.map((item, index) => (
                  <div
                    key={`${item.day}-${item.subject}-${item.lesson}-${index}`}
                    className="rounded-2xl border border-slate-100 p-5 transition hover:border-indigo-100"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 font-black text-indigo-600">
                          {index + 1}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-indigo-600">
                              {item.day}
                            </span>

                            <span className="text-xs text-slate-300">
                              •
                            </span>

                            <span className="text-xs font-bold text-slate-400">
                              {item.subject}
                            </span>
                          </div>

                          <h3 className="mt-2 font-black text-slate-900">
                            {item.lesson}
                          </h3>

                          <p className="mt-1 text-sm text-slate-400">
                            {item.type} · {item.duration}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                            item.status === "مهم"
                              ? "bg-red-50 text-red-600"
                              : item.status === "مقترح"
                              ? "bg-indigo-50 text-indigo-600"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {item.status}
                        </span>

                        <button
                          type="button"
                          className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-600"
                        >
                          ابدأ
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="mt-8 grid gap-5 md:grid-cols-3">
            <AdaptiveCard
              number="01"
              title="تشخيص المستوى"
              description="تحليل نتائج الطالب وتقدم المقررات وتحديد المجالات التي تحتاج إلى اهتمام."
            />

            <AdaptiveCard
              number="02"
              title="تخصيص المسار"
              description="اختيار الدروس والمراجعات والتدريبات بناءً على مستوى الطالب الحالي."
            />

            <AdaptiveCard
              number="03"
              title="التكيف المستمر"
              description="إعادة بناء التوصيات مع كل درس مكتمل واختبار جديد ونتيجة تعليمية."
            />
          </section>
        </main>
      </div>
    </div>
  );
}

function AdaptiveCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6">
      <span className="text-sm font-black text-indigo-600">
        {number}
      </span>

      <h3 className="mt-4 text-lg font-black text-slate-900">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-7 text-slate-500">
        {description}
      </p>
    </div>
  );
}