"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";

type Lesson = {
  id: string;
  title: string;
  type: string;
  duration: number;
  order: number;
};

type Course = {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  progress: number;
  teacher: string;
  lessonsCount: number;
  lessons: Lesson[];
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCourses() {
      try {
        const response = await fetch("/api/courses");

        if (!response.ok) {
          throw new Error("Failed to load courses");
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || "Failed to load courses");
        }

        setCourses(data.courses);
      } catch (err) {
        console.error(err);
        setError("تعذر تحميل المواد الدراسية");
      } finally {
        setLoading(false);
      }
    }

    loadCourses();
  }, []);

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50">
      <Sidebar />

      <div className="mr-72 min-h-screen">
        <Header />

        <main className="p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">
              موادي الدراسية
            </h1>

            <p className="mt-2 text-slate-500">
              تابع تقدمك واستمر في رحلة التعلم الخاصة بك.
            </p>
          </div>

          {loading && (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
              <p className="text-slate-500">جاري تحميل المواد...</p>
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex h-36 items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600">
                    <span className="text-5xl font-bold text-white">
                      {course.title.charAt(0)}
                    </span>
                  </div>

                  <div className="p-5">
                    <h2 className="text-xl font-bold text-slate-900">
                      {course.title}
                    </h2>

                    <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
                      {course.description}
                    </p>

                    <div className="mt-5">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-slate-500">
                          نسبة الإنجاز
                        </span>

                        <span className="font-bold text-indigo-600">
                          {course.progress}%
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-indigo-600 transition-all"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between text-sm text-slate-500">
                      <span>
                        {course.lessonsCount} دروس
                      </span>

                      <span>
                        {course.teacher}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-800"
                    >
                      متابعة التعلم
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && courses.length === 0 && (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">
                لا توجد مواد مسجلة
              </h2>

              <p className="mt-2 text-slate-500">
                لم يتم تسجيل الطالب في أي مادة حتى الآن.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}