"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
type Message = { role: string; content: string };
export default function Teacher() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("guided");
  useEffect(() => {
    fetch("/api/ai/chat")
      .then((r) => r.json())
      .then((d) => {
        setMessages(d.messages || []);
        setMode(d.mode);
      })
      .catch(() => setError("تعذر تحميل المحادثات"));
  }, []);
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || busy) return;
    const text = message;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setMessages((m) => [
        ...m,
        { role: "user", content: text },
        { role: "assistant", content: d.answer },
      ]);
      setMode(d.mode);
      setMessage("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر الاتصال");
    } finally {
      setBusy(false);
    }
  }
  function speak(text: string) {
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ar-SA";
      speechSynthesis.speak(utterance);
    }
  }
  return (
    <div dir="rtl" className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="mr-72">
        <Header />
        <main className="workspace-main">
          <p className="eyebrow">افهم الفكرة، ثم جرّبها</p>
          <h1>مدرسك في حصة</h1>
          <p className="notice">
            {mode === "model"
              ? "مدرس ذكي مرتبط بمحتوى موادك. تحقق من الشرح وناقش مدرسك عند الحاجة."
              : "الإرشاد التعليمي يعمل على محتوى المنصة. خدمة الإجابات المفتوحة لم تُفعّل بعد."}
          </p>
          <div className="suggestions">
            {["ضع لي خطة مذاكرة", "حلل مستواي", "اشرح المعادلات"].map((s) => (
              <button key={s} onClick={() => setMessage(s)}>
                {s}
              </button>
            ))}
          </div>
          <section className="chat-messages" aria-live="polite">
            {!messages.length && (
              <p className="empty-state">
                ابدأ بسؤال عن درس أو اطلب خطة مذاكرة.
              </p>
            )}
            {messages.map((m, i) => (
              <article key={i} className={`chat-bubble ${m.role}`}>
                <strong>{m.role === "user" ? "أنت" : "مدرس حصة"}</strong>
                <p>{m.content}</p>
                {m.role !== "user" && (
                  <button
                    className="text-button"
                    onClick={() => speak(m.content)}
                  >
                    استمع للشرح
                  </button>
                )}
              </article>
            ))}
          </section>
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          <form onSubmit={send} className="chat-form">
            <label className="sr-only" htmlFor="message">
              سؤالك
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={2000}
              placeholder="اسأل عن الدرس…"
              required
            />
            <button className="primary-button" disabled={busy}>
              {busy ? "جاري التفكير…" : "إرسال"}
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}
