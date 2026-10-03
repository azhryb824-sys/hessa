"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
type Plan = {
  generatedAt: string;
  dailyMinutes: number;
  items: {
    id: string;
    title: string;
    subject: string;
    minutes: number;
    href: string;
  }[];
  adaptive: { mastery: number | null; note: string; uniqueQuestions: number };
};
export default function PlanPage() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function load(method = "GET") {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/learning-plan", {
        method,
        cache: "no-store",
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setPlan(d.plan);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر تحميل الخطة");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, []);
  return (
    <div dir="rtl" className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="mr-72">
        <Header />
        <main className="workspace-main">
          <p className="eyebrow">خطوات واضحة، تقدم مستمر</p>
          <h1>خطة تعلمك</h1>
          <p>تُبنى الخطة على الدروس المتبقية وإجاباتك، وتلتزم بوقتك اليومي.</p>
          <button
            className="primary-button"
            disabled={busy}
            onClick={() => load("POST")}
          >
            {busy ? "جاري التحليل…" : "تحديث الخطة وحفظها"}
          </button>
          {error && (
            <p role="alert" className="error-message">
              {error}
            </p>
          )}
          {plan && (
            <>
              <section className="metric-grid">
                <article>
                  <strong>{plan.dailyMinutes}</strong>
                  <span>دقيقة في اليوم</span>
                </article>
                <article>
                  <strong>{plan.adaptive.uniqueQuestions}</strong>
                  <span>أسئلة مختلفة محللة</span>
                </article>
                <article>
                  <strong>
                    {plan.adaptive.mastery === null
                      ? "—"
                      : `${plan.adaptive.mastery}%`}
                  </strong>
                  <span>تقدير إتقان أولي</span>
                </article>
              </section>
              <p className="notice">{plan.adaptive.note}</p>
              <div className="card-list">
                {plan.items.map((item, i) => (
                  <article key={item.id}>
                    <span className="step-number">{i + 1}</span>
                    <div>
                      <p className="eyebrow">
                        {item.subject} · {item.minutes} دقيقة
                      </p>
                      <h2>{item.title}</h2>
                    </div>
                    <Link className="primary-button" href={item.href}>
                      ابدأ
                    </Link>
                  </article>
                ))}
                {!plan.items.length && (
                  <p className="empty-state">
                    أكملت الدروس المتاحة. يمكنك مراجعة النتائج أو انتظار محتوى
                    جديد.
                  </p>
                )}
              </div>
              <p className="muted">
                آخر توليد: {new Date(plan.generatedAt).toLocaleString("ar-SA")}
              </p>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
