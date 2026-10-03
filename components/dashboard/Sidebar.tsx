"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const items = [
  ["/dashboard", "الرئيسية", "⌂"],
  ["/dashboard/courses", "المواد", "▤"],
  ["/dashboard/classes", "الحصص", "◉"],
  ["/dashboard/assignments", "الواجبات", "✓"],
  ["/dashboard/exams", "الاختبارات", "▣"],
  ["/dashboard/ai-teacher", "مدرسك", "✦"],
  ["/dashboard/learning-plan", "الخطة", "◎"],
  ["/dashboard/progress", "تقدمي", "↗"],
  ["/dashboard/billing", "الاشتراك", "◇"],
];
export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="hessa-sidebar">
      <Link href="/dashboard" className="sidebar-brand">
        <span className="brand-mark">حصة ✦</span>
        <small>كل خطوة تصنع فرقًا</small>
      </Link>
      <nav aria-label="التنقل الرئيسي">
        {items.map(([href, label, icon]) => (
          <Link
            key={href}
            href={href}
            aria-current={path === href ? "page" : undefined}
            className={
              path === href || (href !== "/dashboard" && path.startsWith(href))
                ? "active"
                : ""
            }
          >
            <span aria-hidden="true">{icon}</span>
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <p className="sidebar-note">
        تعلم وفق وقتك.
        <br />
        قِس تقدمك بالأدلة.
      </p>
    </aside>
  );
}
