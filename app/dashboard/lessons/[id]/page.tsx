"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

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

export default function LessonPage() {
  const params = useParams();
  const id = params.id as string;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    async function loadLesson() {
      try {
        const response = await fetch(
          `/api/lessons/details?id=${encodeURIComponent(id)}`,
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "تعذر تحميل الدرس");
        }

        setLesson(data.lesson);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "حدث خطأ أثناء تحميل الدرس"
        );
      } finally {
        setLoading(false);
      }
    }

    loadLesson();
  }, [id]);

  if (loading) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-slate-50 p-6"
      >
        <div className="mx-auto max-w-4xl rounded-3xl bg-white p-10 text-center shadow-sm">
          <div className="text-lg font-semibold text-slate-700">
            جاري تحميل الدرس...
          </div>
        </div>
      </main>
    );
  }

  if (error || !lesson) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-slate-50 p-6"
      >
        <div className="mx-auto max-w-4xl rounded-3xl bg-white p-10 text-center shadow-sm">
          <div className="text-xl font-bold text-red-600">
            تعذر تحميل الدرس
          </div>

          <p className="mt-3 text-slate-500">
            {error || "الدرس غير موجود"}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-50 p-6"
    >
      <div className="mx-auto max-w-4xl space-y-6">
        {/* العنوان */}
        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
              {lesson.course.subject}
            </span>

            <span className="text-sm text-slate-400">
              الدرس {lesson.order}
            </span>
          </div>

          <h1 className="text-3xl font-bold text-slate-900">
            {lesson.title}
          </h1>

          {lesson.description && (
            <p className="mt-4 leading-8 text-slate-600">
              {lesson.description}
            </p>
          )}
        </section>

        {/* مساحة الدرس */}
        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="flex min-h-[320px] items-center justify-center rounded-2xl bg-slate-100">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 text-3xl text-white">
                ▶
              </div>

              <h2 className="text-xl font-bold text-slate-800">
                محتوى الدرس
              </h2>

              <p className="mt-2 text-slate-500">
                سيتم ربط محتوى الفيديو/التفاعل التعليمي هنا.
              </p>

              <div className="mt-4 text-sm text-slate-400">
                مدة الدرس: {lesson.duration} دقيقة
              </div>
            </div>
          </div>
        </section>

        {/* معلومات الدرس */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-400">نوع الدرس</div>
            <div className="mt-2 font-bold text-slate-800">
              {lesson.type}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-400">المدة</div>
            <div className="mt-2 font-bold text-slate-800">
              {lesson.duration} دقيقة
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-400">المادة</div>
            <div className="mt-2 font-bold text-slate-800">
              {lesson.course.subject}
            </div>
          </div>
        </section>

        {/* زر الإكمال */}
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <button
            type="button"
            className="w-full rounded-2xl bg-blue-600 px-6 py-4 text-lg font-bold text-white transition hover:bg-blue-700"
            onClick={() => alert("سيتم تسجيل إكمال الدرس في الخطوة التالية")}
          >
            إكمال الدرس
          </button>
        </section>
      </div>
    </main>
  );
}