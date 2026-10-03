"use client";

import { useState } from "react";

export default function Header() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-20 items-center justify-between px-6 lg:px-8">
        {/* الجانب الأيمن */}
        <div>
          <p className="text-sm text-slate-400">
            أهلاً بك من جديد 👋
          </p>

          <h2 className="mt-1 text-xl font-black text-slate-900">
            لوحة التعلم
          </h2>
        </div>

        {/* الجانب الأيسر */}
        <div className="flex items-center gap-3">
          {/* البحث */}
          <button
            type="button"
            className="hidden items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-500 transition hover:bg-slate-50 md:flex"
          >
            <span>⌕</span>
            <span>بحث...</span>
          </button>

          {/* الإشعارات */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setNotificationsOpen(!notificationsOpen)
              }
              className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-lg transition hover:bg-slate-50"
              aria-label="الإشعارات"
            >
              🔔

              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
            </button>

            {notificationsOpen && (
              <div className="absolute left-0 mt-3 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-slate-900">
                    الإشعارات
                  </h3>

                  <span className="text-xs font-bold text-indigo-600">
                    3 جديدة
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="rounded-xl bg-indigo-50 p-3">
                    <p className="text-sm font-bold text-slate-800">
                      لديك اختبار جديد
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      الرياضيات · اليوم
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-sm font-bold text-slate-800">
                      تم تحديث خطة التعلم
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      بناءً على أدائك الأخير
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-sm font-bold text-slate-800">
                      لديك حصة قادمة
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      اللغة الإنجليزية · بعد ساعة
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* الملف الشخصي */}
          <button
            type="button"
            className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 transition hover:bg-slate-50"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-600">
              ع
            </div>

            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-slate-900">
                الطالب
              </p>

              <p className="text-xs text-slate-400">
                حساب الطالب
              </p>
            </div>

            <span className="text-xs text-slate-400">
              ▾
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}