"use client";

import { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";

export default function AITeacherPage() {
  const [message, setMessage] = useState("");

  const suggestions = [
    "اشرح لي درس المعادلات بطريقة سهلة",
    "اختبرني في اللغة الإنجليزية",
    "ما نقاط ضعفي في الرياضيات؟",
    "ضع لي خطة مذاكرة لليوم",
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50">
      <Sidebar />

      <div className="mr-72 min-h-screen">
        <Header />

        <main className="p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">
              مدرس AI
            </h1>

            <p className="mt-2 text-slate-500">
              مدرسك الذكي الذي يشرح لك، يختبر فهمك، ويتابع تطورك.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* AI Teacher */}
            <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 text-white shadow-xl lg:col-span-2">
              <div className="p-8">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-3xl">
                        🤖
                      </div>

                      <div>
                        <h2 className="text-2xl font-bold">
                          حصة AI
                        </h2>

                        <div className="mt-1 flex items-center gap-2 text-sm text-indigo-100">
                          <span className="h-2 w-2 rounded-full bg-emerald-400" />
                          جاهز للتعلم معك
                        </div>
                      </div>
                    </div>

                    <p className="mt-6 max-w-2xl leading-8 text-indigo-100">
                      مرحبًا! أنا مدرسك الذكي في منصة حصة.
                      أستطيع شرح الدروس، تبسيط المفاهيم الصعبة،
                      طرح الأسئلة عليك، وتصحيح إجاباتك ومساعدتك
                      على اكتشاف نقاط القوة والضعف لديك.
                    </p>
                  </div>
                </div>

                {/* Capabilities */}
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {[
                    ["📖", "شرح الدروس"],
                    ["🎯", "اختبار مستوى الفهم"],
                    ["🧠", "تحليل نقاط الضعف"],
                    ["📈", "تخصيص التعلم"],
                  ].map(([icon, title]) => (
                    <div
                      key={title}
                      className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur"
                    >
                      <div className="text-2xl">{icon}</div>
                      <div className="mt-2 font-semibold">{title}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Quick Actions */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                ابدأ بسرعة
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                اختر ما تريد أن تتعلمه الآن.
              </p>

              <div className="mt-5 space-y-3">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setMessage(suggestion)}
                    className="w-full rounded-xl border border-slate-200 p-4 text-right text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* Chat */}
          <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <h2 className="text-xl font-bold text-slate-900">
                ابدأ محادثة تعليمية
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                اكتب ما تريد أن تتعلمه وسنجهز لك التجربة المناسبة.
              </p>
            </div>

            <div className="flex min-h-[280px] items-center justify-center p-8">
              <div className="max-w-xl text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 text-4xl">
                  🧑‍🏫
                </div>

                <h3 className="mt-5 text-xl font-bold text-slate-900">
                  ماذا تريد أن تتعلم اليوم؟
                </h3>

                <p className="mt-2 leading-7 text-slate-500">
                  يمكنك أن تطلب شرحًا، حل سؤال، اختبارًا قصيرًا،
                  أو خطة تعلم مخصصة.
                </p>
              </div>
            </div>

            <div className="border-t border-slate-100 p-5">
              <div className="flex gap-3">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && message.trim()) {
                      alert("سيتم ربط مدرس AI الحقيقي في المرحلة القادمة.");
                    }
                  }}
                  placeholder="اكتب سؤالك للمدرس الذكي..."
                  className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white"
                />

                <button
                  onClick={() => {
                    if (!message.trim()) return;

                    alert(
                      "سيتم ربط محرك الذكاء الاصطناعي الحقيقي في المرحلة القادمة."
                    );
                  }}
                  className="rounded-2xl bg-indigo-600 px-7 py-4 font-semibold text-white transition hover:bg-indigo-700"
                >
                  إرسال
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}