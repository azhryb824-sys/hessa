"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";

type Question = {
  id: string;
  question: string;
  options: string[];
  points: number;
};

type Exam = {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  type: string;
  questions: Question[];
};

function ExamTakeContent() {
  const router = useRouter();

  const [examId, setExamId] = useState<string | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const submissionKey = useRef<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");

    if (!id) {
      queueMicrotask(() => {
        setError("معرف الاختبار غير موجود.");
        setLoading(false);
      });
      return;
    }

    queueMicrotask(() => setExamId(id));

    async function loadExam() {
      try {
        const response = await fetch(
          `/api/exams/take?id=${encodeURIComponent(String(id))}`,
          {
            cache: "no-store",
          },
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "تعذر تحميل الاختبار.");
        }

        setExam(data.exam);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "حدث خطأ أثناء تحميل الاختبار.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadExam();
  }, []);

  const answeredCount = useMemo(() => {
    return Object.keys(answers).length;
  }, [answers]);

  function selectAnswer(questionId: string, answer: string) {
    setAnswers((current) => ({
      ...current,
      [questionId]: answer,
    }));
  }

  async function submitExam() {
    if (!examId || !exam) return;

    if (answeredCount !== exam.questions.length) {
      const confirmed = window.confirm(
        `لقد أجبت عن ${answeredCount} من ${exam.questions.length} أسئلة.\n\nهل تريد تسليم الاختبار رغم وجود أسئلة بدون إجابة؟`,
      );

      if (!confirmed) return;
    }

    try {
      setSubmitting(true);
      setError("");

      const response = await fetch("/api/exams/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionKey:
            submissionKey.current ||
            (submissionKey.current = crypto.randomUUID()),
          assessmentId: exam.id,
          answers,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "تعذر تسليم الاختبار.");
      }

      router.push(
        `/dashboard/exams/result?id=${encodeURIComponent(
          String(data.attemptId),
        )}`,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "حدث خطأ أثناء تسليم الاختبار.",
      );
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6" dir="rtl">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <div className="animate-pulse space-y-5">
              <div className="h-8 w-1/3 rounded bg-slate-200" />
              <div className="h-4 w-2/3 rounded bg-slate-200" />
              <div className="h-32 rounded-2xl bg-slate-100" />
              <div className="h-32 rounded-2xl bg-slate-100" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error && !exam) {
    return (
      <main className="min-h-screen bg-slate-50 p-6" dir="rtl">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl">
              !
            </div>

            <h1 className="mb-2 text-xl font-bold text-slate-900">
              تعذر تحميل الاختبار
            </h1>

            <p className="mb-6 text-slate-500">{error}</p>

            <button
              onClick={() => router.back()}
              className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white"
            >
              العودة
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!exam) return null;

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-6" dir="rtl">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {exam.subject}
              </div>

              <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
                {exam.title}
              </h1>

              {exam.description && (
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
                  {exam.description}
                </p>
              )}
            </div>

            <div className="rounded-2xl bg-slate-50 px-5 py-4 text-center">
              <div className="text-2xl font-bold text-slate-900">
                {answeredCount}/{exam.questions.length}
              </div>

              <div className="text-xs text-slate-500">الأسئلة المجابة</div>
            </div>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{
                width: `${
                  exam.questions.length > 0
                    ? (answeredCount / exam.questions.length) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </section>

        <section className="space-y-5">
          {exam.questions.map((question, index) => (
            <article
              key={question.id}
              className="rounded-3xl bg-white p-6 shadow-sm md:p-8"
            >
              <div className="mb-5 flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-700">
                  {index + 1}
                </div>

                <div className="flex-1">
                  <div className="mb-2 text-xs font-medium text-slate-400">
                    {question.points} نقطة
                  </div>

                  <h2 className="text-lg font-bold leading-8 text-slate-900">
                    {question.question}
                  </h2>
                </div>
              </div>

              <div className="space-y-3">
                {question.options.map((option, optionIndex) => {
                  const selected = answers[question.id] === option;

                  return (
                    <button
                      key={`${question.id}-${optionIndex}`}
                      type="button"
                      onClick={() => selectAnswer(question.id, option)}
                      className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-right transition ${
                        selected
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                          selected
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {String.fromCharCode(65 + optionIndex)}
                      </span>

                      <span
                        className={`text-sm font-medium ${
                          selected ? "text-blue-900" : "text-slate-700"
                        }`}
                      >
                        {option}
                      </span>
                    </button>
                  );
                })}
              </div>
            </article>
          ))}
        </section>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="sticky bottom-4 rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-lg backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-bold text-slate-900">
                جاهز لتسليم الاختبار؟
              </div>

              <div className="mt-1 text-sm text-slate-500">
                أجبت عن {answeredCount} من {exam.questions.length} أسئلة.
              </div>
            </div>

            <button
              type="button"
              onClick={submitExam}
              disabled={submitting}
              className="rounded-2xl bg-blue-600 px-8 py-4 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "جاري تسليم الاختبار..." : "تسليم الاختبار"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function ExamTakePage() {
  return <ExamTakeContent />;
}
