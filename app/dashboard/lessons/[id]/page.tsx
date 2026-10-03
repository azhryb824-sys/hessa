"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
type Lesson = {
  id: string;
  title: string;
  content: string;
  duration: number;
  completed: boolean;
  course: { title: string; subject: string };
};
export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    fetch(`/api/lessons/details?id=${encodeURIComponent(id)}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.message);
        setLesson(d.lesson);
      })
      .catch((e) => setError(e.message));
  }, [id]);
  async function complete() {
    if (!lesson) return;
    setBusy(true);
    try {
      const r = await fetch("/api/lessons/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: lesson.id }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setLesson({ ...lesson, completed: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر إكمال الدرس");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div dir="rtl" className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="mr-72">
        <Header />
        <main className="workspace-main">
          {error && <p className="error-message">{error}</p>}
          {lesson ? (
            <>
              <p className="eyebrow">
                {lesson.course.subject} · {lesson.duration} دقيقة
              </p>
              <h1>{lesson.title}</h1>
              <article className="lesson-content">
                {lesson.content || "لم ينشر محتوى هذا الدرس بعد."}
              </article>
              <div className="actions">
                <button
                  className="primary-button"
                  disabled={busy || lesson.completed || !lesson.content}
                  onClick={complete}
                >
                  {lesson.completed
                    ? "تم إكمال الدرس ✓"
                    : busy
                      ? "جاري الحفظ…"
                      : "أكملت القراءة والتدريب"}
                </button>
                <Link className="secondary-button" href="/dashboard/ai-teacher">
                  ناقش الدرس مع المدرس
                </Link>
                <Link href="/dashboard/courses">العودة للمواد</Link>
              </div>
            </>
          ) : (
            !error && <p>جاري تحميل الدرس…</p>
          )}
        </main>
      </div>
    </div>
  );
}
