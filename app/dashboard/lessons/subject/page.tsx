"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";

type Lesson = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  duration: number;
  order: number;
  course: {
    id: string;
    title: string;
    subject: string;
  };
};

function LessonPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const subject = searchParams.get("subject");
  const order = searchParams.get("order");

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLesson() {
      if (!subject || !order) {
        setError("بيانات الدرس غير مكتملة");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/lessons/details?subject=${encodeURIComponent(
            subject
          )}&order=${encodeURIComponent(order)}`,
          {
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "تعذر تحميل الدرس");
        }

        setLesson(result.lesson);
      } catch (error) {
        console.error(error);
        setError("تعذر تحميل الدرس");
      } finally {
        setLoading(false);
      }
    }

    loadLesson();
  }, [subject, order]);

  async function completeLesson() {
    if (!subject || !order || completing || completed) {
      return;
    }

    setCompleting(true);

    try {
      const response = await fetch("/api/lessons/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject,
          order: Number(order),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "تعذر تسجيل إكمال الدرس"
        );
      }

      setCompleted(true);

      alert(
        `تم إكمال الدرس بنجاح ✅\n\nتقدمك في المادة الآن: ${result.courseProgress}%`
      );

      router.push(
        `/dashboard/courses/subject?subject=${encodeURIComponent(subject)}`
      );
    } catch (error) {
      console.error(error);

      alert("تعذر تسجيل إكمال الدرس. حاول مرة أخرى.");
    } finally {
      setCompleting(false);
    }
  }

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-50">
        <Sidebar />

        <div className="mr-72 min-h-screen">
          <Header />

          <main className="p-6 lg:p-8">
            <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
              جاري تحميل الدرس...
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-50">
        <Sidebar />

        <div className="mr-72 min-h-screen">
          <Header />

          <main className="p-6 lg:p-8">
            <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
              <h1 className="text-xl font-bold">
                تعذر تحميل الدرس
              </h1>

              <p className="mt-2">
                {error || "الدرس غير موجود"}
              </p>
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
          <div className="mb-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              ← العودة إلى المادة
            </button>
          </div>

          <section className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-l from-indigo-700 to-violet-600 p-8 text-white shadow-lg">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-white/15 px-4 py-2 text-sm">
                {lesson.course.subject}
              </span>

              <span className="rounded-full bg-white/15 px-4 py-2 text-sm">
                الدرس {lesson.order}
              </span>

              <span className="rounded-full bg-white/15 px-4 py-2 text-sm">
                {lesson.duration} دقيقة
              </span>
            </div>

            <h1 className="mt-5 text-3xl font-bold lg:text-4xl">
              {lesson.title}
            </h1>

            {lesson.description && (
              <p className="mt-4 max-w-3xl leading-8 text-indigo-100">
                {lesson.description}
              </p>
            )}
          </section>

          <section className="mb-6 rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex min-h-[360px] items-center justify-center rounded-2xl bg-slate-100">
              <div className="text-center">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-indigo-600 text-4xl text-white shadow-lg">
                  ▶
                </div>

                <h2 className="mt-6 text-2xl font-bold text-slate-900">
                  محتوى الدرس
                </h2>

                <p className="mt-3 text-slate-500">
                  نوع الدرس:{" "}
                  {lesson.type === "VIDEO"
                    ? "فيديو"
                    : lesson.type === "INTERACTIVE"
                    ? "تفاعلي"
                    : lesson.type === "PRACTICE"
                    ? "تدريب"
                    : lesson.type}
                </p>

                <p className="mt-2 text-sm text-slate-400">
                  سيتم ربط المحتوى التعليمي الفعلي هنا.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {completed
                    ? "تم إكمال الدرس بنجاح 🎉"
                    : "جاهز لإكمال الدرس؟"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {completed
                    ? "تم تسجيل تقدمك في المادة."
                    : "بعد الانتهاء سيتم تسجيل تقدمك في المادة."}
                </p>
              </div>

              <button
                type="button"
                disabled={completing || completed}
                onClick={completeLesson}
                className={`rounded-xl px-7 py-3 font-bold text-white transition ${
                  completed
                    ? "cursor-default bg-emerald-600"
                    : "bg-indigo-600 hover:bg-indigo-700"
                } ${completing ? "cursor-wait opacity-70" : ""}`}
              >
                {completing
                  ? "جاري التسجيل..."
                  : completed
                  ? "تم الإكمال ✓"
                  : "إكمال الدرس"}
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default function LessonPage() {
  return (
    <Suspense
      fallback={
        <div dir="rtl" className="min-h-screen bg-slate-50">
          <Sidebar />

          <div className="mr-72 min-h-screen">
            <Header />

            <main className="p-6 lg:p-8">
              <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
                جاري تحميل الدرس...
              </div>
            </main>
          </div>
        </div>
      }
    >
      <LessonPageContent />
    </Suspense>
  );
}