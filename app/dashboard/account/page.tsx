"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
export default function Account() {
  const [goal, setGoal] = useState("");
  const [minutes, setMinutes] = useState(30);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        setGoal(d.profile?.learningGoal || "");
        setMinutes(d.profile?.dailyMinutes || 30);
      })
      .catch(() => setError("تعذر تحميل الملف"));
  }, []);
  async function submit(e: React.FormEvent<HTMLFormElement>, endpoint: string) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const form = e.currentTarget;
    try {
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setNotice("تم الحفظ بنجاح");
      if (endpoint.includes("password")) form.reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر الحفظ");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="mr-72">
        <Header />
        <main className="workspace-main">
          <h1>حسابك وأهدافك</h1>
          {notice && <p className="notice">{notice}</p>}
          {error && <p className="error-message">{error}</p>}
          <section className="activity-card">
            <h2>هدف التعلم</h2>
            <form onSubmit={(e) => submit(e, "/api/profile")}>
              <label>
                ما الذي تريد تحسينه؟
                <textarea
                  name="learningGoal"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  maxLength={500}
                />
              </label>
              <label>
                الدقائق اليومية
                <input
                  type="number"
                  name="dailyMinutes"
                  min="10"
                  max="180"
                  value={minutes}
                  onChange={(e) => setMinutes(Number(e.target.value))}
                />
              </label>
              <button className="primary-button" disabled={busy}>
                حفظ الهدف
              </button>
            </form>
          </section>
          <section className="activity-card">
            <h2>تغيير كلمة المرور</h2>
            <form onSubmit={(e) => submit(e, "/api/auth/password")}>
              <label>
                كلمة المرور الحالية
                <input
                  type="password"
                  name="currentPassword"
                  required
                  autoComplete="current-password"
                />
              </label>
              <label>
                كلمة المرور الجديدة
                <input
                  type="password"
                  name="password"
                  required
                  minLength={10}
                  autoComplete="new-password"
                />
              </label>
              <button className="primary-button" disabled={busy}>
                تحديث كلمة المرور وإنهاء الجلسات السابقة
              </button>
            </form>
          </section>
        </main>
      </div>
    </div>
  );
}
