"use client";
import { useEffect, useState, useCallback } from "react";
type Activity = {
  id: string;
  title: string;
  instructions?: string;
  dueAt?: string;
  maxPoints?: number;
  startsAt?: string;
  duration?: number;
  capacity?: number;
  seatsLeft?: number;
  booked?: boolean;
  eligible?: boolean;
  status?: string;
  meetingUrl?: string;
  teacherName?: string;
  submissions?: {
    answer: string;
    score: number | null;
    feedback: string | null;
  }[];
};
export default function Activities({
  kind,
}: {
  kind: "classes" | "assignments";
}) {
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/${kind}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setItems(d[kind]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر التحميل");
    } finally {
      setLoading(false);
    }
  }, [kind]);
  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);
  async function mutate(id: string, action: string, answer?: string) {
    setBusy(id);
    setError("");
    try {
      const r = await fetch(`/api/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, classId: id, assignmentId: id, answer }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر تنفيذ الطلب");
    } finally {
      setBusy("");
    }
  }
  return (
    <>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      {loading && <p>جاري التحميل…</p>}
      <div className="activity-grid">
        {items.map((item) => (
          <article className="activity-card" key={item.id}>
            <p className="eyebrow">
              {kind === "classes" ? item.teacherName : "واجب دراسي"}
            </p>
            <h2>{item.title}</h2>
            <p className="muted">
              {new Date(item.startsAt || item.dueAt!).toLocaleString("ar-SA")}
            </p>
            {kind === "classes" ? (
              <>
                <p>
                  {item.duration} دقيقة · {item.seatsLeft} مقاعد متاحة
                </p>
                {item.status === "CANCELLED" ? (
                  <p>أُلغيت الحصة</p>
                ) : item.booked ? (
                  <div className="actions">
                    {
                      <a
                        className="primary-button"
                        href={`/classroom/${item.id}`}
                      >
                        الغرفة التفاعلية
                      </a>
                    }
                    {item.meetingUrl ? (
                      <a
                        className="primary-button"
                        href={item.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        فتح الحصة
                      </a>
                    ) : (
                      <p className="notice">
                        حجزك مؤكد؛ سيضيف المدرس رابط الحصة.
                      </p>
                    )}
                    <button
                      className="secondary-button"
                      disabled={busy === item.id}
                      onClick={() => mutate(item.id, "cancel-booking")}
                    >
                      إلغاء الحجز
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      className="primary-button"
                      disabled={
                        busy === item.id ||
                        !item.eligible ||
                        !item.seatsLeft ||
                        new Date(item.startsAt!) <= new Date()
                      }
                      onClick={() => mutate(item.id, "book")}
                    >
                      حجز الحصة
                    </button>
                    {!item.eligible && (
                      <p className="muted">
                        لا تطابق بياناتك قواعد توزيع المدرسين لهذه الحصة.
                      </p>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                <p className="lesson-content">{item.instructions}</p>
                <p>الدرجة الكاملة: {item.maxPoints}</p>
                {item.submissions?.[0] && (
                  <p className="notice">
                    تم التسليم.{" "}
                    {item.submissions[0].score === null
                      ? "بانتظار التقييم"
                      : `الدرجة ${item.submissions[0].score}/${item.maxPoints} — ${item.submissions[0].feedback || ""}`}
                  </p>
                )}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    mutate(
                      item.id,
                      "submit",
                      String(new FormData(e.currentTarget).get("answer")),
                    );
                  }}
                >
                  <label>
                    إجابتك
                    <textarea
                      name="answer"
                      defaultValue={item.submissions?.[0]?.answer || ""}
                      maxLength={8000}
                      required
                    />
                  </label>
                  <button
                    className="primary-button"
                    disabled={
                      busy === item.id ||
                      new Date(item.dueAt!) < new Date() ||
                      item.submissions?.[0]?.score != null
                    }
                  >
                    حفظ الإجابة وتسليمها
                  </button>
                </form>
              </>
            )}
          </article>
        ))}
        {!loading && !items.length && (
          <p className="empty-state">
            لا توجد {kind === "classes" ? "حصص" : "واجبات"} لموادك حاليًا.
          </p>
        )}
      </div>
    </>
  );
}
