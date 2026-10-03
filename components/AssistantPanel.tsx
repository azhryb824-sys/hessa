"use client";
import { useState } from "react";
export default function AssistantPanel() {
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState("");
  return (
    <section className="activity-card">
      <h2>مساعدك التعليمي</h2>
      <p>اطلب إرشادًا لمتابعة التقدم أو إعداد درس أو تنظيم العمل.</p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            const r = await fetch("/api/ai/assistant", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ message }),
            });
            const d = await r.json();
            if (!r.ok) throw new Error(d.message);
            setAnswer(d.answer);
            setMode(d.mode);
          } catch (e) {
            setError(e instanceof Error ? e.message : "تعذر الاتصال");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          طلبك
          <textarea
            maxLength={2000}
            value={message}
            required
            onChange={(e) => setMessage(e.target.value)}
          />
        </label>
        <button className="primary-button" disabled={busy}>
          {busy ? "جاري التحليل…" : "اسأل المساعد"}
        </button>
      </form>
      {error && <p className="error-message">{error}</p>}
      {answer && (
        <>
          <p className="muted">
            {mode === "model"
              ? "إجابة من النموذج المرتبط بسياق حسابك"
              : "إرشاد محلي من بيانات المنصة؛ النموذج الخارجي غير مفعّل"}
          </p>
          <p className="lesson-content">{answer}</p>
        </>
      )}
    </section>
  );
}
