"use client";
import { useEffect, useState } from "react";
type Invoice = {
  id: string;
  userId: string;
  amountHalalas: number;
  status: string;
  plan: { name: string };
  subscription: { expiresAt: string } | null;
};
type Data = {
  admin: boolean;
  plans: {
    id: string;
    name: string;
    priceHalalas: number;
    durationDays: number;
  }[];
  invoices: Invoice[];
  subscription: { expiresAt: string } | null;
  paymentInstructions: string;
};
export default function Billing() {
  const [data, setData] = useState<Data | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  async function load() {
    const r = await fetch("/api/billing");
    const d = await r.json();
    if (!r.ok) throw new Error(d.message);
    setData(d);
  }
  useEffect(() => {
    queueMicrotask(() => {
      load().catch((e) => setError(e.message));
    });
  }, []);
  async function send(b: Record<string, unknown>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const r = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(b),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      await load();
      setNotice("تم تنفيذ الطلب");
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر التنفيذ");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <h1>الباقات والاشتراكات</h1>
      {error && <p className="error-message">{error}</p>}
      {notice && <p className="notice">{notice}</p>}
      {data && (
        <>
          <p className="notice">{data.paymentInstructions}</p>
          <p>
            {data.subscription
              ? `اشتراكك فعال حتى ${new Date(data.subscription.expiresAt).toLocaleDateString("ar-SA")}`
              : "لا يوجد اشتراك مدفوع فعال"}
          </p>
          {data.admin && (
            <form
              className="management-form"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                send({
                  action: "plan",
                  name: f.get("name"),
                  priceHalalas: Math.round(Number(f.get("price")) * 100),
                  durationDays: Number(f.get("days")),
                });
              }}
            >
              <label>
                اسم الباقة
                <input name="name" required />
              </label>
              <label>
                السعر بالريال
                <input name="price" type="number" step=".01" min="1" required />
              </label>
              <label>
                عدد الأيام
                <input name="days" type="number" min="1" max="366" required />
              </label>
              <button className="primary-button" disabled={busy}>
                إضافة باقة
              </button>
            </form>
          )}
          <div className="activity-grid">
            {data.plans.map((p) => (
              <article className="activity-card" key={p.id}>
                <h2>{p.name}</h2>
                <p>
                  {(p.priceHalalas / 100).toFixed(2)} ريال · {p.durationDays}{" "}
                  يومًا
                </p>
                {!data.admin && (
                  <button
                    className="primary-button"
                    disabled={busy}
                    onClick={() => send({ action: "order", planId: p.id })}
                  >
                    طلب اشتراك
                  </button>
                )}
              </article>
            ))}
            {!data.plans.length && (
              <p className="empty-state">لم تنشر الإدارة باقات بعد.</p>
            )}
          </div>
          <h2>مطالبات السداد</h2>
          <p className="muted">
            هذه سجلات داخلية للاشتراك، وليست فواتير ضريبية.
          </p>
          {data.invoices.map((i) => (
            <article className="activity-card" key={i.id}>
              <h3>
                {i.plan.name} · {(i.amountHalalas / 100).toFixed(2)} ريال
              </h3>
              <p>المرجع: {i.id}</p>
              <p>
                الحالة:{" "}
                {i.status === "PAID"
                  ? "مسددة"
                  : i.status === "PENDING"
                    ? "بانتظار السداد"
                    : "ملغاة"}
              </p>
              {i.status === "PENDING" && (
                <>
                  <button
                    className="text-button"
                    disabled={busy}
                    onClick={() => send({ action: "cancel", invoiceId: i.id })}
                  >
                    إلغاء الطلب
                  </button>
                  {data.admin && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        send({
                          action: "confirm-payment",
                          invoiceId: i.id,
                          reference: new FormData(e.currentTarget).get(
                            "reference",
                          ),
                        });
                      }}
                    >
                      <label>
                        مرجع التحويل بعد التحقق من وصوله
                        <input name="reference" required />
                      </label>
                      <button className="primary-button" disabled={busy}>
                        اعتماد السداد وتفعيل الاشتراك
                      </button>
                    </form>
                  )}
                </>
              )}
            </article>
          ))}
        </>
      )}
    </section>
  );
}
