"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { label: "الرئيسية", href: "/dashboard", icon: "⌂" },
  { label: "موادي", href: "/dashboard/courses", icon: "▣" },
  { label: "الحصص", href: "/dashboard/classes", icon: "◉" },
  { label: "الواجبات", href: "/dashboard/assignments", icon: "✓" },
  { label: "الاختبارات", href: "/dashboard/exams", icon: "▤" },
  { label: "مدرس AI", href: "/dashboard/ai-teacher", icon: "✦" },
  { label: "خطة التعلم", href: "/dashboard/learning-plan", icon: "◎" },
  { label: "تقدمي", href: "/dashboard/progress", icon: "↗" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed right-0 top-0 z-40 flex h-screen w-72 flex-col border-l border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-6 py-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-lg font-black text-white">
            ح
          </div>

          <div>
            <h1 className="text-xl font-black text-slate-900">
              حصة
            </h1>
            <p className="text-xs text-slate-400">
              منصة التعليم الذكية
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
        <p className="mb-3 px-3 text-xs font-bold text-slate-400">
          التعلم
        </p>

        {menuItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${
                active
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-base ${
                  active
                    ? "bg-indigo-100"
                    : "bg-slate-100"
                }`}
              >
                {item.icon}
              </span>

              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-600">
              ع
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">
                الطالب
              </p>

              <p className="truncate text-xs text-slate-400">
                حساب الطالب
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}