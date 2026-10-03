import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";

const classes = [
  {
    subject: "الرياضيات",
    title: "المعادلات الخطية",
    teacher: "مدرس AI",
    date: "اليوم",
    time: "04:00 م",
    duration: "45 دقيقة",
    status: "قادمة",
    type: "تفاعلية",
  },
  {
    subject: "اللغة الإنجليزية",
    title: "Present Perfect",
    teacher: "أ. أحمد",
    date: "اليوم",
    time: "06:00 م",
    duration: "40 دقيقة",
    status: "قادمة",
    type: "مباشرة",
  },
  {
    subject: "العلوم",
    title: "الجهاز الهضمي",
    teacher: "مدرس AI",
    date: "غدًا",
    time: "05:00 م",
    duration: "45 دقيقة",
    status: "مجدولة",
    type: "تفاعلية",
  },
];

export default function ClassesPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-slate-50">
      <Sidebar />

      <div className="mr-72 min-h-screen">
        <Header />

        <main className="p-6 lg:p-8">
          <div>
            <p className="text-sm font-bold text-indigo-600">
              التعلم المباشر
            </p>

            <h1 className="mt-2 text-3xl font-black text-slate-900">
              الحصص
            </h1>

            <p className="mt-2 text-slate-500">
              تابع حصصك المباشرة والتفاعلية القادمة.
            </p>
          </div>

          {/* الحصة القادمة */}
          <section className="mt-8 overflow-hidden rounded-3xl bg-slate-900 p-7 text-white shadow-xl">
            <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
              <div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
                    الحصة القادمة
                  </span>

                  <span className="text-sm text-slate-400">
                    اليوم · 04:00 م
                  </span>
                </div>

                <h2 className="mt-5 text-3xl font-black">
                  المعادلات الخطية
                </h2>

                <p className="mt-3 text-slate-300">
                  الرياضيات · مدرس AI · 45 دقيقة
                </p>
              </div>

              <button
                type="button"
                className="rounded-2xl bg-indigo-500 px-7 py-4 font-bold transition hover:bg-indigo-400"
              >
                دخول الحصة
              </button>
            </div>
          </section>

          {/* الحصص */}
          <section className="mt-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  جدول الحصص
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  حصصك القادمة
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {classes.map((item) => (
                <div
                  key={`${item.subject}-${item.title}`}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 font-black text-indigo-600">
                        {item.subject.charAt(0)}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-black text-slate-900">
                            {item.title}
                          </h3>

                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
                            {item.type}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-slate-400">
                          {item.subject} · {item.teacher}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 text-sm">
                      <div>
                        <p className="text-xs text-slate-400">
                          الموعد
                        </p>

                        <p className="mt-1 font-bold text-slate-700">
                          {item.date} · {item.time}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          المدة
                        </p>

                        <p className="mt-1 font-bold text-slate-700">
                          {item.duration}
                        </p>
                      </div>

                      <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600">
                        {item.status}
                      </span>

                      <button
                        type="button"
                        className="rounded-xl bg-slate-900 px-5 py-2.5 font-bold text-white transition hover:bg-indigo-600"
                      >
                        التفاصيل
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* تجربة الحصة */}
          <section className="mt-8 rounded-3xl border border-indigo-100 bg-indigo-50 p-7">
            <div className="max-w-3xl">
              <span className="text-sm font-black text-indigo-600">
                تجربة حصة حصة
              </span>

              <h2 className="mt-3 text-2xl font-black text-slate-900">
                الحصة ليست فيديو فقط
              </h2>

              <p className="mt-3 leading-8 text-slate-600">
                في النسخة القادمة سنربط هذه الصفحة ببيئة الحصة
                التفاعلية، بحيث يستطيع الطالب الاستماع للشرح، طرح
                الأسئلة، التفاعل مع المحتوى، وحل الأنشطة أثناء الحصة.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <span className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700">
                  🎙️ صوت
                </span>

                <span className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700">
                  💬 أسئلة مباشرة
                </span>

                <span className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700">
                  📝 أنشطة
                </span>

                <span className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700">
                  🤖 مدرس AI
                </span>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}