import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";

const assignments = [
  {
    subject: "الرياضيات",
    title: "حل المعادلات الخطية",
    due: "اليوم",
    questions: 10,
    status: "مطلوب",
  },
  {
    subject: "اللغة الإنجليزية",
    title: "Present Perfect Exercises",
    due: "غدًا",
    questions: 15,
    status: "مطلوب",
  },
  {
    subject: "العلوم",
    title: "الجهاز الهضمي",
    due: "2 أكتوبر",
    questions: 12,
    status: "لم يبدأ",
  },
  {
    subject: "اللغة العربية",
    title: "التعبير والكتابة",
    due: "4 أكتوبر",
    questions: 5,
    status: "لم يبدأ",
  },
];

export default function AssignmentsPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-slate-50">
      <Sidebar />

      <div className="mr-72 min-h-screen">
        <Header />

        <main className="p-6 lg:p-8">
          <div>
            <p className="text-sm font-bold text-indigo-600">
              المهام الدراسية
            </p>

            <h1 className="mt-2 text-3xl font-black text-slate-900">
              الواجبات
            </h1>

            <p className="mt-2 text-slate-500">
              راجع واجباتك وأنجز المهام المطلوبة منك.
            </p>
          </div>

          {/* إحصائيات */}
          <section className="mt-8 grid gap-4 sm:grid-cols-3">
            <Stat
              title="الواجبات المطلوبة"
              value="4"
              icon="📝"
            />

            <Stat
              title="تم إنجازها"
              value="12"
              icon="✓"
            />

            <Stat
              title="متوسط الإنجاز"
              value="86%"
              icon="↗"
            />
          </section>

          {/* قائمة الواجبات */}
          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  الواجبات الحالية
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  المهام التي تحتاج إلى إنجاز
                </p>
              </div>

              <button
                type="button"
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                تصفية
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {assignments.map((assignment) => (
                <div
                  key={assignment.title}
                  className="rounded-2xl border border-slate-100 p-5 transition hover:border-indigo-100 hover:bg-indigo-50/30"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-xl">
                        📝
                      </div>

                      <div>
                        <p className="text-xs font-bold text-indigo-600">
                          {assignment.subject}
                        </p>

                        <h3 className="mt-1 font-black text-slate-900">
                          {assignment.title}
                        </h3>

                        <p className="mt-2 text-sm text-slate-400">
                          {assignment.questions} أسئلة
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-5">
                      <div>
                        <p className="text-xs text-slate-400">
                          موعد التسليم
                        </p>

                        <p className="mt-1 font-bold text-slate-700">
                          {assignment.due}
                        </p>
                      </div>

                      <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-600">
                        {assignment.status}
                      </span>

                      <button
                        type="button"
                        className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
                      >
                        بدء الواجب
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* الذكاء الاصطناعي */}
          <section className="mt-8 rounded-3xl bg-slate-900 p-7 text-white">
            <div className="max-w-3xl">
              <span className="text-sm font-bold text-indigo-300">
                مساعدة ذكية
              </span>

              <h2 className="mt-3 text-2xl font-black">
                هل واجهت صعوبة في أحد الواجبات؟
              </h2>

              <p className="mt-3 leading-8 text-slate-300">
                سيتمكن مدرس AI في النسخة القادمة من مساعدتك على فهم
                السؤال وتقديم تلميحات تدريجية دون إعطائك الإجابة مباشرة.
              </p>

              <button
                type="button"
                className="mt-6 rounded-xl bg-indigo-500 px-6 py-3 font-bold transition hover:bg-indigo-400"
              >
                اسأل مدرس AI
              </button>
            </div>
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