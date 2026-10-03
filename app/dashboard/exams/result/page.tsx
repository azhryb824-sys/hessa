"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Result = {
  score: number;
  earnedPoints: number;
  totalPoints: number;
  answeredQuestions: number;
  totalQuestions: number;
};

type ResultResponse = {
  success: boolean;
  attempt: {
    id: string;
    score: number;
    completedAt: string | null;
    exam: {
      id: string;
      title: string;
      subject: string;
      type: string;
    };
  };
  result: Result;
};

type LearningAnswer = {
  questionId: string;
  question: string;
  options: string[];
  studentAnswer: string | null;
  correctAnswer: string | null;
  isCorrect: boolean;
  pointsAwarded: number;
  points: number;
};

type LearningAssessment = {
  attemptId: string;
  assessmentId: string;
  title: string;
  subject: string;
  completedAt: string | null;
  score: number;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  answers: LearningAnswer[];
};

type LearningWeakness = {
  type: string;
  subject: string | null;
  value: number;
  confidence: number;
  reason: string;
};

type LearningRecommendation = {
  priority: string;
  type: string;
  subject: string;
  title: string;
  reason: string;
  expectedOutcome: string;
};

type LearningAnalysis = {
  success: boolean;
  learningState?: {
    overall?: {
      courseProgress: number;
      examScore: number;
      completedExams: number;
      totalCourses: number;
      totalCompletedLessons: number;
      totalAssessmentAttempts: number;
    };
    strengths?: LearningWeakness[];
    weaknesses?: LearningWeakness[];
    risks?: LearningWeakness[];
    diagnosticPatterns?: LearningWeakness[];
    recommendations?: LearningRecommendation[];
    recommendedAction?: {
      type: string;
      subject: string | null;
      reason: string;
    } | null;
    analysis?: {
      summary: string;
      evidenceQuality: string;
      confidence: number;
      language: string;
      limitations: string[];
    };
  };
  assessmentHistory?: LearningAssessment[];
};

function ExamResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const attemptId = searchParams.get("id");

  const [data, setData] = useState<ResultResponse | null>(null);
  const [learningData, setLearningData] = useState<LearningAnalysis | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [learningLoading, setLearningLoading] = useState(true);
  const [error, setError] = useState("");
  const [learningError, setLearningError] = useState("");

  useEffect(() => {
    if (!attemptId) {
      queueMicrotask(() => {
        setError("معرف المحاولة غير موجود.");
        setLoading(false);
        setLearningLoading(false);
      });
      return;
    }

    const id = attemptId;

    async function loadResult() {
      try {
        const response = await fetch(
          `/api/exams/result?id=${encodeURIComponent(id)}`,
          {
            cache: "no-store",
          },
        );

        const responseData = await response.json();

        if (!response.ok || !responseData.success) {
          throw new Error(responseData.message || "تعذر تحميل نتيجة الاختبار.");
        }

        setData(responseData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "حدث خطأ أثناء تحميل النتيجة.",
        );
      } finally {
        setLoading(false);
      }
    }

    async function loadLearningAnalysis() {
      try {
        const response = await fetch("/ai/learning-analysis", {
          cache: "no-store",
        });

        const responseData = await response.json();

        if (!response.ok || !responseData.success) {
          throw new Error(
            responseData.message || "تعذر تحميل تحليل الذكاء الاصطناعي.",
          );
        }

        setLearningData(responseData);
      } catch (err) {
        setLearningError(
          err instanceof Error
            ? err.message
            : "تعذر تحميل تحليل الذكاء الاصطناعي.",
        );
      } finally {
        setLearningLoading(false);
      }
    }

    loadResult();
    loadLearningAnalysis();
  }, [attemptId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6" dir="rtl">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            جاري تحميل النتيجة...
          </div>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-slate-50 p-6" dir="rtl">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl">
              !
            </div>

            <h1 className="mb-2 text-xl font-bold text-slate-900">
              تعذر تحميل النتيجة
            </h1>

            <p className="mb-6 text-slate-500">
              {error || "لم يتم العثور على النتيجة."}
            </p>

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

  const { result, attempt } = data;

  const currentAssessment = learningData?.assessmentHistory?.find(
    (item) => item.attemptId === attempt.id,
  );

  const analysis = learningData?.learningState?.analysis;

  const currentWeaknesses =
    learningData?.learningState?.weaknesses?.filter(
      (item) => item.subject === attempt.exam.subject,
    ) ?? [];

  const currentRecommendations =
    learningData?.learningState?.recommendations?.filter(
      (item) => item.subject === attempt.exam.subject,
    ) ?? [];

  const hasDetailedAnalysis = currentAssessment !== undefined;

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-6" dir="rtl">
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="rounded-3xl bg-white p-8 text-center shadow-sm">
          <div className="mb-4 text-sm font-semibold text-blue-600">
            {attempt.exam.subject}
          </div>

          <h1 className="mb-2 text-2xl font-bold text-slate-900 md:text-3xl">
            {attempt.exam.title}
          </h1>

          <p className="text-sm text-slate-500">تم إكمال الاختبار بنجاح</p>

          <div className="mx-auto mt-8 flex h-36 w-36 items-center justify-center rounded-full bg-blue-50">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">
                {result.score}%
              </div>

              <div className="mt-1 text-xs text-slate-500">الدرجة</div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
            <div className="text-2xl font-bold text-slate-900">
              {result.earnedPoints}/{result.totalPoints}
            </div>

            <div className="mt-1 text-sm text-slate-500">النقاط</div>
          </div>

          <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
            <div className="text-2xl font-bold text-slate-900">
              {result.answeredQuestions}/{result.totalQuestions}
            </div>

            <div className="mt-1 text-sm text-slate-500">الأسئلة المجابة</div>
          </div>

          <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
            <div className="text-2xl font-bold text-slate-900">
              {result.score}%
            </div>

            <div className="mt-1 text-sm text-slate-500">النتيجة</div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                تحليل الذكاء الاصطناعي
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Hessa AI Education Engine
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
              تحليل قائم على الأدلة
            </div>
          </div>

          {learningLoading ? (
            <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
              جاري تحليل نتيجة الاختبار...
            </div>
          ) : learningError ? (
            <div className="rounded-2xl bg-amber-50 p-5 text-sm leading-7 text-amber-800">
              تم تسجيل نتيجة الاختبار بنجاح، لكن تعذر تحميل التحليل الذكي
              حاليًا.
            </div>
          ) : !hasDetailedAnalysis ? (
            <div className="rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-600">
              تم تسجيل نتيجة الاختبار في ملفك التعليمي. لا توجد بيانات تحليل
              تفصيلية متاحة لهذه المحاولة حاليًا.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-2xl bg-slate-50 p-5">
                <div className="mb-3 text-sm font-semibold text-slate-900">
                  ملخص المحاولة
                </div>

                <p className="leading-8 text-slate-600">
                  تمت الإجابة عن{" "}
                  <span className="font-bold text-slate-900">
                    {currentAssessment.answeredQuestions}
                  </span>{" "}
                  من{" "}
                  <span className="font-bold text-slate-900">
                    {currentAssessment.totalQuestions}
                  </span>{" "}
                  أسئلة، وكانت الإجابات الصحيحة{" "}
                  <span className="font-bold text-slate-900">
                    {currentAssessment.correctAnswers}
                  </span>{" "}
                  والخاطئة{" "}
                  <span className="font-bold text-slate-900">
                    {currentAssessment.wrongAnswers}
                  </span>
                  .
                </p>
              </div>

              {currentAssessment.answers.length > 0 && (
                <div>
                  <h3 className="mb-3 font-bold text-slate-900">
                    تحليل الإجابات
                  </h3>

                  <div className="space-y-3">
                    {currentAssessment.answers.map((answer, index) => (
                      <div
                        key={answer.questionId}
                        className={`rounded-2xl border p-4 ${
                          answer.isCorrect
                            ? "border-emerald-200 bg-emerald-50"
                            : "border-red-200 bg-red-50"
                        }`}
                      >
                        <div className="mb-2 flex items-start gap-3">
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                              answer.isCorrect
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {index + 1}
                          </div>

                          <div className="font-semibold leading-7 text-slate-900">
                            {answer.question}
                          </div>
                        </div>

                        <div className="mr-10 space-y-1 text-sm leading-7">
                          <div>
                            <span className="text-slate-500">
                              إجابة الطالب:
                            </span>{" "}
                            <span className="font-semibold text-slate-900">
                              {answer.studentAnswer ?? "بدون إجابة"}
                            </span>
                          </div>

                          {!answer.isCorrect && (
                            <div>
                              <span className="text-slate-500">
                                الإجابة الصحيحة:
                              </span>{" "}
                              <span className="font-semibold text-emerald-700">
                                {answer.correctAnswer ?? "غير متاحة"}
                              </span>
                            </div>
                          )}

                          <div
                            className={
                              answer.isCorrect
                                ? "font-semibold text-emerald-700"
                                : "font-semibold text-red-700"
                            }
                          >
                            {answer.isCorrect
                              ? "إجابة صحيحة"
                              : "إجابة تحتاج إلى مراجعة"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentWeaknesses.length > 0 && (
                <div>
                  <h3 className="mb-3 font-bold text-slate-900">
                    نقاط تحتاج إلى مراجعة
                  </h3>

                  <div className="space-y-3">
                    {currentWeaknesses.map((weakness, index) => (
                      <div
                        key={`${weakness.subject}-${index}`}
                        className="rounded-2xl bg-amber-50 p-4"
                      >
                        <div className="mb-1 font-semibold text-slate-900">
                          {weakness.subject}
                        </div>

                        <p className="text-sm leading-7 text-slate-600">
                          {weakness.reason}
                        </p>

                        <div className="mt-2 text-xs text-slate-500">
                          درجة الثقة: {Math.round(weakness.confidence * 100)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentRecommendations.length > 0 && (
                <div>
                  <h3 className="mb-3 font-bold text-slate-900">
                    التوصية التالية
                  </h3>

                  <div className="space-y-3">
                    {currentRecommendations.map((recommendation, index) => (
                      <div
                        key={`${recommendation.type}-${index}`}
                        className="rounded-2xl bg-blue-50 p-5"
                      >
                        <div className="mb-2 font-bold text-blue-900">
                          {recommendation.title}
                        </div>

                        <p className="text-sm leading-7 text-slate-700">
                          {recommendation.reason}
                        </p>

                        <div className="mt-3 text-sm leading-7 text-slate-600">
                          <span className="font-semibold text-slate-900">
                            الهدف المتوقع:
                          </span>{" "}
                          {recommendation.expectedOutcome}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysis && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-bold text-slate-900">
                      مستوى الثقة في التحليل
                    </h3>

                    <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {analysis.evidenceQuality}
                    </span>
                  </div>

                  <div className="mb-3 text-2xl font-bold text-blue-600">
                    {Math.round(analysis.confidence * 100)}%
                  </div>

                  <p className="text-sm leading-7 text-slate-600">
                    {analysis.summary}
                  </p>
                </div>
              )}

              <div className="rounded-2xl bg-slate-50 p-4 text-xs leading-6 text-slate-500">
                التحليل الحالي قائم على الأدلة التعليمية المسجلة داخل المنصة. لا
                يتم اعتبار إجابة واحدة دليلًا كافيًا لإثبات مفهوم خاطئ محدد،
                وسيتم تحسين دقة التحليل مع توفر محاولات وبيانات تعليمية إضافية.
              </div>
            </div>
          )}
        </section>

        <div className="flex justify-center">
          <button
            onClick={() => router.push("/dashboard/exams")}
            className="rounded-2xl bg-blue-600 px-8 py-4 font-bold text-white transition hover:bg-blue-700"
          >
            العودة إلى الاختبارات
          </button>
        </div>
      </div>
    </main>
  );
}

function ExamResultFallback() {
  return (
    <main className="min-h-screen bg-slate-50 p-6" dir="rtl">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
          جاري تحميل النتيجة...
        </div>
      </div>
    </main>
  );
}

export default function ExamResultPage() {
  return (
    <Suspense fallback={<ExamResultFallback />}>
      <ExamResultContent />
    </Suspense>
  );
}
