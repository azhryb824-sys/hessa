"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";

type Lesson = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  duration: number;
  order: number;
  completed: boolean;
  completedAt: string | null;
};

type Course = {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  teacher: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  lessons: Lesson[];
};

export default function CourseSubjectPage() {
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadCourse() {
    try {
      setLoading(true);

      const response = await fetch(
        "/api/courses/details?subject=" +
          encodeURIComponent(
            new URLSearchParams(window.location.search).get("subject") ||
              "الرياضيات",
          ),
        {
          cache: "no-store",
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load course");
      }

      setCourse(result.course);
    } catch (error) {
      console.error(error);
      setError("تعذر تحميل المادة");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadCourse();
    });
  }, []);

  const lessonTypeLabel = (type: string) => {
    switch (type) {
      case "VIDEO":
        return "فيديو";
      case "INTERACTIVE":
        return "تفاعلي";
      case "PRACTICE":
        return "تدريب";
      case "LIVE":
        return "مباشر";
      case "READING":
        return "قراءة";
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-50">
        <Sidebar />

        <div className="mr-72 min-h-screen">
          <Header />

          <main className="p-6 lg:p-8">
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
              جاري تحميل المادة...
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-50">
        <Sidebar />

        <div className="mr-72 min-h-screen">
          <Header />

          <main className="p-6 lg:p-8">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
              {error || "المادة غير موجودة"}
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
            <a
              href="/dashboard/courses"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              ← العودة إلى المواد
            </a>
          </div>

          <section className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-l from-indigo-700 to-violet-600 p-8 text-white shadow-lg">
            <p className="mb-2 text-indigo-100">مادة تعليمية</p>

            <h1 className="text-3xl font-bold lg:text-4xl">{course.title}</h1>

            <p className="mt-3 max-w-3xl leading-7 text-indigo-100">
              {course.description}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-full bg-white/15 px-4 py-2 text-sm">
                المدرس: {course.teacher}
              </span>

              <span className="rounded-full bg-white/15 px-4 py-2 text-sm">
                {course.totalLessons} دروس
              </span>

              <span className="rounded-full bg-white/15 px-4 py-2 text-sm">
                مكتمل: {course.completedLessons}
              </span>

              <span className="rounded-full bg-white/15 px-4 py-2 text-sm">
                التقدم: {course.progress}%
              </span>
            </div>
          </section>

          <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  تقدمك في المادة
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  أكملت {course.completedLessons} من {course.totalLessons} دروس.
                </p>
              </div>

              <span className="text-2xl font-bold text-indigo-600">
                {course.progress}%
              </span>
            </div>

            <div className="h-4 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                style={{
                  width: `${course.progress}%`,
                }}
              />
            </div>
          </section>

          <section>
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-slate-900">دروس المادة</h2>

              <p className="mt-1 text-sm text-slate-500">
                تابع دروسك وشاهد تقدمك بشكل مباشر.
              </p>
            </div>

            <div className="space-y-4">
              {course.lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className={`rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                    lesson.completed ? "border-emerald-200" : "border-slate-200"
                  }`}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-bold ${
                          lesson.completed
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-indigo-50 text-indigo-600"
                        }`}
                      >
                        {lesson.completed ? "✓" : lesson.order}
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-900">
                          {lesson.title}
                        </h3>

                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                            {lessonTypeLabel(lesson.type)}
                          </span>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                            ⏱ {lesson.duration} دقيقة
                          </span>

                          {lesson.completed && (
                            <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-700">
                              مكتمل
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`rounded-xl px-5 py-3 font-medium text-white transition ${
                        lesson.completed
                          ? "bg-emerald-600 hover:bg-emerald-700"
                          : "bg-indigo-600 hover:bg-indigo-700"
                      }`}
                      onClick={() =>
                        router.push(
                          `/dashboard/lessons/subject?subject=${encodeURIComponent(
                            course.subject,
                          )}&order=${lesson.order}`,
                        )
                      }
                    >
                      {lesson.completed ? "مراجعة الدرس" : "ابدأ الدرس"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
