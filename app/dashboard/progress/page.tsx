"use client";

import { useEffect, useRef, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";

type Course = {
  id: string;
  title: string;
  subject: string;
  progress: number;
  lessonsCount: number;
  completedLessons: number;
  totalLessons: number;
};

type DashboardResponse = {
  success: boolean;
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
    completedLessons: number;
    totalLessons: number;
    totalLearningMinutes: number;
    calculatedTotalHours: number;
  };
  courses: Course[];
};

type LearningSignal = {
  type: string;
  subject: string | null;
  value: number | null;
  confidence: number;
  reason: string;
};

type LearningRecommendation = {
  priority: "HIGH" | "MEDIUM" | "LOW";
  type: string;
  subject: string | null;
  title: string;
  reason: string;
  expectedOutcome: string;
};

type SkillDiagnostic = {
  subject: string;
  skill: string;
  concept: string | null;
  questionIds: string[];
  answeredQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  accuracy: number;
  evidenceLevel: "DIRECT" | "INFERRED" | "INSUFFICIENT";
  confidence: number;
  status: "STRONG" | "NEEDS_REVIEW" | "WEAK" | "INSUFFICIENT_EVIDENCE";
  reason: string;
};

type LearningState = {
  overall: {
    courseProgress: number;
    examScore: number | null;
    completedExams: number;
    totalCourses: number;
    totalCompletedLessons: number;
    totalAssessmentAttempts: number;
  };
  strengths: LearningSignal[];
  weaknesses: LearningSignal[];
  risks: LearningSignal[];
  diagnosticPatterns: unknown[];
  skillDiagnostics: SkillDiagnostic[];
  recommendations: LearningRecommendation[];
  recommendedAction: {
    type: string;
    subject: string | null;
    reason: string;
  };
  analysis: {
    summary: string;
    evidenceQuality: "HIGH" | "MEDIUM" | "LOW";
    confidence: number;
    language?: string;
    limitations: string[];
  };
};

type LearningAnalysisResponse = {
  success: boolean;
  learningState: LearningState;
};

const subjectNames: Record<string, string> = {
  الرياضيات: "الرياضيات",
  "اللغة الإنجليزية": "اللغة الإنجليزية",
  العلوم: "العلوم",
  "اللغة العربية": "اللغة العربية",
};

function getSubjectName(subject: string) {
  return subjectNames[subject] ?? subject;
}

function getPriorityLabel(priority: string) {
  if (priority === "HIGH") return "أولوية عالية";
  if (priority === "MEDIUM") return "أولوية متوسطة";
  return "أولوية منخفضة";
}

function getEvidenceLabel(quality: "HIGH" | "MEDIUM" | "LOW") {
  if (quality === "HIGH") return "أدلة قوية";
  if (quality === "MEDIUM") return "أدلة متوسطة";
  return "أدلة محدودة";
}

function getSkillEvidenceLabel(level: SkillDiagnostic["evidenceLevel"]) {
  if (level === "DIRECT") return "دليل مباشر";
  if (level === "INFERRED") return "استنتاج مدعوم";
  return "أدلة غير كافية";
}

function getSkillStatusLabel(status: SkillDiagnostic["status"]) {
  if (status === "STRONG") return "مؤشر قوة";
  if (status === "NEEDS_REVIEW") return "يحتاج مراجعة";
  if (status === "WEAK") return "مؤشر ضعف";
  return "أدلة غير كافية";
}

function getSkillStatusClass(status: SkillDiagnostic["status"]) {
  if (status === "STRONG") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "NEEDS_REVIEW") {
    return "bg-amber-50 text-amber-700";
  }

  if (status === "WEAK") {
    return "bg-red-50 text-red-700";
  }

  return "bg-slate-100 text-slate-600";
}

function getSkillEvidenceClass(level: SkillDiagnostic["evidenceLevel"]) {
  if (level === "DIRECT") {
    return "bg-blue-50 text-blue-700";
  }

  if (level === "INFERRED") {
    return "bg-indigo-50 text-indigo-700";
  }

  return "bg-slate-100 text-slate-600";
}

export default function ProgressPage() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);

  const [learningState, setLearningState] = useState<LearningState | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(true);

  const [showFullAnalysis, setShowFullAnalysis] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const fullAnalysisRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setAnalysisLoading(true);
        setError(null);

        const [dashboardResponse, analysisResponse] = await Promise.all([
          fetch("/api/dashboard", {
            cache: "no-store",
          }),
          fetch("/ai/learning-analysis", {
            cache: "no-store",
          }),
        ]);

        if (!dashboardResponse.ok) {
          throw new Error("تعذر تحميل بيانات التقدم الدراسي.");
        }

        if (!analysisResponse.ok) {
          throw new Error("تعذر تحميل تحليل الذكاء الاصطناعي.");
        }

        const dashboardData =
          (await dashboardResponse.json()) as DashboardResponse;

        const analysisData =
          (await analysisResponse.json()) as LearningAnalysisResponse;

        if (!dashboardData.success) {
          throw new Error("تعذر تحميل بيانات الطالب.");
        }

        if (!analysisData.success) {
          throw new Error("تعذر تحميل التحليل التعليمي.");
        }

        setDashboard(dashboardData);
        setLearningState(analysisData.learningState);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "حدث خطأ أثناء تحميل البيانات.",
        );
      } finally {
        setLoading(false);
        setAnalysisLoading(false);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    if (!showFullAnalysis || !learningState) {
      return;
    }

    const timer = window.setTimeout(() => {
      fullAnalysisRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);

    return () => window.clearTimeout(timer);
  }, [showFullAnalysis, learningState]);

  function handleFullAnalysis() {
    setShowFullAnalysis((current) => !current);
  }

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-50">
        <Sidebar />

        <div className="mr-72 min-h-screen">
          <Header />

          <main className="p-6 lg:p-8">
            <div className="flex min-h-[500px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />

                <p className="mt-4 text-slate-500">
                  جارٍ تحميل تقدمك الدراسي...
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-50">
        <Sidebar />

        <div className="mr-72 min-h-screen">
          <Header />

          <main className="p-6 lg:p-8">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
              {error ?? "تعذر تحميل بيانات التقدم الدراسي."}
            </div>
          </main>
        </div>
      </div>
    );
  }

  const statistics = dashboard.statistics;
  const courses = dashboard.courses;
  const student = dashboard.student;

  const averageScore =
    learningState?.overall.examScore ??
    (statistics.completedAssessments > 0 ? statistics.averageScore : null);

  const aiSummary =
    learningState?.analysis.summary ??
    "لا توجد بيانات كافية لعرض التحليل التعليمي.";

  const aiRecommendation = learningState?.recommendations[0] ?? null;

  const strengths = learningState?.strengths ?? [];

  const weaknesses = learningState?.weaknesses ?? [];

  const skillDiagnostics = learningState?.skillDiagnostics ?? [];

  const completedLessons = statistics.completedLessons;

  const totalLessons = statistics.totalLessons;

  const totalHours =
    statistics.calculatedTotalHours > 0
      ? statistics.calculatedTotalHours
      : student.totalHours;

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50">
      <Sidebar />

      <div className="mr-72 min-h-screen">
        <Header />

        <main className="p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">تقدمي الدراسي</h1>

            <p className="mt-2 text-slate-500">
              تابع مستواك وإنجازاتك واكتشف المجالات التي تحتاج إلى تطوير.
            </p>
          </div>

          <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">المعدل العام</p>

              <div className="mt-3 text-3xl font-bold text-slate-900">
                {statistics.averageProgress}%
              </div>

              <p className="mt-2 text-sm text-slate-500">
                متوسط التقدم في المقررات
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                الدروس المكتملة
              </p>

              <div className="mt-3 text-3xl font-bold text-slate-900">
                {completedLessons}
              </div>

              <p className="mt-2 text-sm text-slate-500">
                من أصل {totalLessons} درسًا
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                مدة الدروس المكتملة
              </p>

              <div className="mt-3 text-3xl font-bold text-slate-900">
                {totalHours}
              </div>

              <p className="mt-2 text-sm text-slate-500">ساعة تعلم مسجلة</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                السلسلة اليومية
              </p>

              <div className="mt-3 text-3xl font-bold text-slate-900">
                {student.learningStreak}
              </div>

              <p className="mt-2 text-sm text-slate-500">يومًا متتاليًا</p>
            </div>
          </section>

          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  نتائج التقييم
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  النتائج التي يعتمد عليها محرك التحليل التعليمي.
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 px-5 py-3 text-center">
                <p className="text-xs text-slate-500">
                  متوسط التقييمات الفعلية
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {averageScore === null ? "لا توجد نتيجة" : `${averageScore}%`}
                </p>
              </div>
            </div>
          </section>

          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">مستوى المواد</h2>

              <p className="mt-1 text-sm text-slate-500">
                نظرة تفصيلية على تقدمك في كل مادة.
              </p>
            </div>

            <div className="space-y-6">
              {courses.map((course) => {
                const progress = Math.max(
                  0,
                  Math.min(100, Math.round(course.progress)),
                );

                return (
                  <div key={course.id}>
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-800">
                          {getSubjectName(course.subject)}
                        </h3>

                        <p className="text-xs text-slate-400">
                          {course.completedLessons} من {course.totalLessons}{" "}
                          درسًا مكتملًا
                        </p>
                      </div>

                      <div className="text-left">
                        <span className="font-bold text-slate-900">
                          {progress}%
                        </span>

                        <p className="text-xs text-slate-400">تقدم المادة</p>
                      </div>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all"
                        style={{
                          width: `${progress}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-7 text-white shadow-lg">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 text-2xl">
                ✨
              </div>

              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-bold">تحليل الذكاء الاصطناعي</h2>

                {learningState && (
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs">
                    {getEvidenceLabel(learningState.analysis.evidenceQuality)}
                  </span>
                )}
              </div>

              <p className="mt-3 leading-7 text-indigo-100">
                {analysisLoading
                  ? "جارٍ تحليل بياناتك التعليمية..."
                  : aiSummary}
              </p>

              {aiRecommendation && (
                <div className="mt-5 rounded-xl bg-white/10 p-4">
                  <p className="text-xs font-medium text-indigo-200">
                    التوصية الحالية
                  </p>

                  <p className="mt-1 font-semibold">{aiRecommendation.title}</p>

                  <p className="mt-1 text-sm leading-6 text-indigo-100">
                    {aiRecommendation.reason}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={handleFullAnalysis}
                disabled={analysisLoading || !learningState}
                className="mt-6 rounded-xl bg-white px-5 py-3 font-semibold text-indigo-700 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {showFullAnalysis
                  ? "إخفاء التحليل الكامل"
                  : "عرض التحليل الكامل"}
              </button>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">الإنجازات</h2>

              <div className="mt-5 space-y-4">
                <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">
                    🔥
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {student.learningStreak} أيام متتالية
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      استمر في التعلم والمحافظة على سلسلة التعلم.
                    </p>
                  </div>
                </div>

                {averageScore !== null && averageScore >= 90 && (
                  <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">
                      🎯
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-800">
                        نتيجة ممتازة
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        حصلت على نتيجة 90% أو أكثر في تقييم.
                      </p>
                    </div>
                  </div>
                )}

                {completedLessons >= 20 && (
                  <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">
                      📚
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-800">
                        {completedLessons} درسًا
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        أكملت عددًا كبيرًا من الدروس التعليمية.
                      </p>
                    </div>
                  </div>
                )}

                {completedLessons < 20 && averageScore === null && (
                  <div className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">
                    واصل التعلم لإضافة إنجازات جديدة إلى ملفك التعليمي.
                  </div>
                )}
              </div>
            </section>
          </div>

          {showFullAnalysis && learningState && (
            <section
              ref={fullAnalysisRef}
              className="mt-8 scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900">
                  التحليل التعليمي الكامل
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  هذا التحليل مبني على الأدلة التعليمية الفعلية المسجلة في
                  المنصة.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">جودة الأدلة</p>

                  <p className="mt-2 text-xl font-bold text-slate-900">
                    {getEvidenceLabel(learningState.analysis.evidenceQuality)}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">مستوى الثقة</p>

                  <p className="mt-2 text-xl font-bold text-slate-900">
                    {Math.round(learningState.analysis.confidence * 100)}%
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">
                    محاولات التقييم الفعلية
                  </p>

                  <p className="mt-2 text-xl font-bold text-slate-900">
                    {learningState.overall.totalAssessmentAttempts}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-slate-200 p-5">
                <h3 className="font-bold text-slate-900">ملخص التحليل</h3>

                <p className="mt-2 leading-7 text-slate-600">
                  {learningState.analysis.summary}
                </p>
              </div>

              <div className="mt-8">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-slate-900">
                    تشخيص المهارات
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    تحليل المهارات المستنتجة من الأسئلة التي أجاب عنها الطالب.
                    لا يعتبر المؤشر حكمًا نهائيًا عندما تكون الأدلة غير كافية.
                  </p>
                </div>

                {skillDiagnostics.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {skillDiagnostics.map((diagnostic, index) => (
                      <div
                        key={`${diagnostic.subject}-${diagnostic.skill}-${index}`}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-slate-500">
                              {getSubjectName(diagnostic.subject)}
                            </p>

                            <h4 className="mt-1 text-lg font-bold text-slate-900">
                              {diagnostic.skill}
                            </h4>

                            {diagnostic.concept && (
                              <p className="mt-1 text-sm text-slate-500">
                                {diagnostic.concept}
                              </p>
                            )}
                          </div>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getSkillStatusClass(
                              diagnostic.status,
                            )}`}
                          >
                            {getSkillStatusLabel(diagnostic.status)}
                          </span>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <div className="rounded-xl bg-slate-50 p-3 text-center">
                            <p className="text-xs text-slate-500">الإجابات</p>

                            <p className="mt-1 font-bold text-slate-900">
                              {diagnostic.answeredQuestions}
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-3 text-center">
                            <p className="text-xs text-slate-500">الصحيحة</p>

                            <p className="mt-1 font-bold text-emerald-700">
                              {diagnostic.correctAnswers}
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-3 text-center">
                            <p className="text-xs text-slate-500">الخاطئة</p>

                            <p className="mt-1 font-bold text-red-600">
                              {diagnostic.wrongAnswers}
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-3 text-center">
                            <p className="text-xs text-slate-500">الدقة</p>

                            <p className="mt-1 font-bold text-slate-900">
                              {diagnostic.accuracy}%
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getSkillEvidenceClass(
                              diagnostic.evidenceLevel,
                            )}`}
                          >
                            {getSkillEvidenceLabel(diagnostic.evidenceLevel)}
                          </span>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            الثقة {Math.round(diagnostic.confidence * 100)}%
                          </span>
                        </div>

                        <div className="mt-4 rounded-xl bg-slate-50 p-4">
                          <p className="text-sm leading-6 text-slate-600">
                            {diagnostic.reason}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-500">
                    لا توجد أدلة كافية حاليًا لبناء تشخيص مهارات.
                  </div>
                )}
              </div>

              {strengths.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-bold text-slate-900">نقاط القوة</h3>

                  <div className="mt-3 space-y-3">
                    {strengths.map((signal, index) => (
                      <div
                        key={`${signal.subject}-${index}`}
                        className="rounded-xl border border-emerald-100 bg-emerald-50 p-4"
                      >
                        <p className="font-semibold text-slate-900">
                          {getSubjectName(signal.subject ?? "عام")}
                        </p>

                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {signal.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {weaknesses.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-bold text-slate-900">
                    نقاط تحتاج إلى تطوير
                  </h3>

                  <div className="mt-3 space-y-3">
                    {weaknesses.map((signal, index) => (
                      <div
                        key={`${signal.subject}-${index}`}
                        className="rounded-xl border border-amber-100 bg-amber-50 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-slate-900">
                            {getSubjectName(signal.subject ?? "عام")}
                          </p>

                          {signal.value !== null && (
                            <span className="font-bold text-slate-900">
                              {signal.value}%
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {signal.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {learningState.recommendations.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-bold text-slate-900">التوصيات</h3>

                  <div className="mt-3 space-y-3">
                    {learningState.recommendations.map(
                      (recommendation, index) => (
                        <div
                          key={`${recommendation.subject}-${recommendation.type}-${index}`}
                          className="rounded-xl border border-slate-200 p-5"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                              {getPriorityLabel(recommendation.priority)}
                            </span>

                            {recommendation.subject && (
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                {getSubjectName(recommendation.subject)}
                              </span>
                            )}
                          </div>

                          <h4 className="mt-3 font-bold text-slate-900">
                            {recommendation.title}
                          </h4>

                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            {recommendation.reason}
                          </p>

                          <p className="mt-3 text-sm font-medium text-slate-700">
                            النتيجة المتوقعة: {recommendation.expectedOutcome}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

              <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50 p-5">
                <p className="text-sm font-medium text-indigo-700">
                  الإجراء التعليمي المقترح الآن
                </p>

                <h3 className="mt-2 font-bold text-slate-900">
                  {learningState.recommendedAction.subject
                    ? getSubjectName(learningState.recommendedAction.subject)
                    : "المسار الحالي"}
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {learningState.recommendedAction.reason}
                </p>
              </div>

              {learningState.analysis.limitations.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-bold text-slate-900">
                    حدود التحليل الحالي
                  </h3>

                  <ul className="mt-3 list-disc space-y-2 pr-5 text-sm leading-6 text-slate-500">
                    {learningState.analysis.limitations.map(
                      (limitation, index) => (
                        <li key={index}>{limitation}</li>
                      ),
                    )}
                  </ul>
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
