"use client";
import { useState } from "react";
import Link from "next/link";
export default function Login() {
  const [register, setRegister] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = Object.fromEntries(new FormData(e.currentTarget));
      const r = await fetch(`/api/auth/${register ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      window.location.assign(d.redirect);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر الاتصال");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-page" dir="rtl">
      <section className="auth-card">
        <Link href="/" className="brand-mark">
          حصة ✦
        </Link>
        <p className="eyebrow">تعلم بخطة تناسبك</p>
        <h1>{register ? "ابدأ رحلتك التعليمية" : "مرحبًا بعودتك"}</h1>
        <p>موادك، تقدمك ومدرسك في مكان واحد.</p>
        <form onSubmit={submit}>
          {register && (
            <>
              <label>
                الاسم
                <input name="name" required minLength={2} />
              </label>
              <label>
                الجنس
                <select name="gender" required>
                  <option value="">اختر</option>
                  <option value="MALE">ذكر</option>
                  <option value="FEMALE">أنثى</option>
                </select>
              </label>
              <label>
                تاريخ الميلاد
                <input
                  type="date"
                  name="birthDate"
                  required
                  max={new Date().toISOString().slice(0, 10)}
                />
              </label>
            </>
          )}
          <label>
            البريد الإلكتروني
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              dir="ltr"
            />
          </label>
          <label>
            كلمة المرور
            <input
              type="password"
              name="password"
              minLength={register ? 10 : 1}
              required
              autoComplete={register ? "new-password" : "current-password"}
              dir="ltr"
            />
          </label>
          {error && (
            <p role="alert" className="error-message">
              {error}
            </p>
          )}
          <button className="primary-button" disabled={busy}>
            {busy ? "جاري المتابعة…" : register ? "إنشاء حساب" : "دخول"}
          </button>
        </form>
        <button
          className="text-button"
          onClick={() => {
            setRegister(!register);
            setError("");
          }}
        >
          {register ? "لديك حساب؟ سجّل الدخول" : "ليس لديك حساب؟ سجّل الآن"}
        </button>
      </section>
    </main>
  );
}
