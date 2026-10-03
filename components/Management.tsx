"use client";
import AssistantPanel from "@/components/AssistantPanel";
import Billing from "@/components/Billing";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
type User = { id: string; name: string; role: string; email: string };
type Course = {
  id: string;
  title: string;
  lessons: { id: string; title: string }[];
  _count: { enrollments: number };
};
type Data = {
  user: { name: string; role: string };
  users: User[];
  courses: Course[];
  classes: {
    id: string;
    title: string;
    startsAt: string;
    bookings: {
      id: string;
      studentId: string;
      attended: boolean;
      interactions: number;
    }[];
  }[];
  assignments: {
    id: string;
    title: string;
    maxPoints: number;
    submissions: {
      id: string;
      studentId: string;
      answer: string;
      score: number | null;
      feedback: string | null;
    }[];
  }[];
  children: {
    student: { id: string; name: string };
    statistics: {
      averageProgress: number;
      averageScore: number;
      completedLessons: number;
    };
    analysis: { summary: string };
  }[];
};
export default function Management() {
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("courses");
  async function load() {
    const r = await fetch("/api/workspace");
    const d = await r.json();
    if (!r.ok) throw new Error(d.message);
    setData(d);
  }
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);
  async function send(endpoint: string, body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      await load();
      setNotice("تم الحفظ بنجاح");
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر الحفظ");
    } finally {
      setBusy(false);
    }
  }
  function form(endpoint: string, action: string, children: React.ReactNode) {
    return (
      <form
        className="management-form"
        onSubmit={(e) => {
          e.preventDefault();
          send(endpoint, {
            action,
            ...Object.fromEntries(new FormData(e.currentTarget)),
          });
        }}
      >
        {children}
        <button className="primary-button" disabled={busy}>
          حفظ
        </button>
      </form>
    );
  }
  function courseSelect() {
    return (
      <label>
        المادة
        <select name="courseId" required>
          <option value="">اختر مادة</option>
          {data?.courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </label>
    );
  }
  function userSelect(name: string, role: string, label: string) {
    return (
      <label>
        {label}
        <select name={name} required>
          <option value="">اختر</option>
          {data?.users
            .filter((u) => u.role === role)
            .map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
        </select>
      </label>
    );
  }
  return (
    <main dir="rtl" className="management-page">
      <header className="management-header">
        <div>
          <p className="eyebrow">حصة · مساحة العمل</p>
          <h1>
            {data?.user.role === "PARENT"
              ? "متابعة أبنائك"
              : data?.user.role === "ADMIN"
                ? "إدارة المنصة"
                : "مساحة المدرس"}
          </h1>
          <p>{data?.user.name}</p>
        </div>
        <button
          className="secondary-button"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/login");
          }}
        >
          خروج
        </button>
      </header>
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}
      {!data ? (
        <p>جاري التحميل…</p>
      ) : data.user.role === "PARENT" ? (
        <div className="activity-grid">
          {data.children.map((c) => (
            <article className="activity-card" key={c.student.id}>
              <h2>{c.student.name}</h2>
              <p>تقدم المواد: {c.statistics.averageProgress}%</p>
              <p>متوسط النتائج: {c.statistics.averageScore}%</p>
              <p>الدروس المكتملة: {c.statistics.completedLessons}</p>
              <p>{c.analysis.summary}</p>
            </article>
          ))}
          {!data.children.length && (
            <p className="empty-state">لم تربط الإدارة أبناء بحسابك بعد.</p>
          )}
        </div>
      ) : (
        <>
          <nav className="management-tabs">
            {[
              ["courses", "المواد والمحتوى"],
              ["classes", "الحصص والحضور"],
              ["assignments", "الواجبات والتقييم"],
              ["exams", "الاختبارات"],
              ...(data.user.role === "ADMIN"
                ? [
                    ["users", "الحسابات والربط"],
                    ["billing", "الباقات والسداد"],
                  ]
                : []),
            ].map(([key, label]) => (
              <button
                key={key}
                className={tab === key ? "active" : ""}
                onClick={() => setTab(key)}
              >
                {label}
              </button>
            ))}
          </nav>
          <section className="metric-grid">
            <article>
              <strong>{data.courses.length}</strong>
              <span>مواد</span>
            </article>
            <article>
              <strong>{data.classes.length}</strong>
              <span>حصص</span>
            </article>
            <article>
              <strong>{data.assignments.length}</strong>
              <span>واجبات</span>
            </article>
          </section>
          {tab === "courses" && (
            <>
              <h2>إنشاء مادة</h2>
              {form(
                "/api/workspace",
                "course",
                <>
                  <label>
                    اسم المادة
                    <input name="title" required />
                  </label>
                  <label>
                    التخصص
                    <input name="subject" required />
                  </label>
                  <label>
                    وصف المادة
                    <input name="description" />
                  </label>
                  {data.user.role === "ADMIN" &&
                    userSelect("teacherId", "TEACHER", "المدرس")}
                </>,
              )}
              <h2>إضافة أو تحديث درس</h2>
              {form(
                "/api/workspace",
                "lesson",
                <>
                  {courseSelect()}
                  <label>
                    العنوان
                    <input name="title" required />
                  </label>
                  <label>
                    ترتيب الدرس
                    <input type="number" name="order" min="1" required />
                  </label>
                  <label>
                    المدة بالدقائق
                    <input
                      type="number"
                      name="duration"
                      min="1"
                      max="240"
                      required
                    />
                  </label>
                  <label className="full-width">
                    الشرح والأمثلة والتمارين
                    <textarea name="content" required maxLength={12000} />
                  </label>
                </>,
              )}
              <div className="activity-grid">
                {data.courses.map((c) => (
                  <article className="activity-card" key={c.id}>
                    <h2>{c.title}</h2>
                    <p>{c._count.enrollments} طلاب</p>
                    {c.lessons.map((l) => (
                      <p key={l.id}>{l.title}</p>
                    ))}
                  </article>
                ))}
              </div>
            </>
          )}
          {tab === "classes" && (
            <>
              <h2>جدولة حصة</h2>
              {form(
                "/api/classes",
                "create",
                <>
                  {courseSelect()}
                  <label>
                    العنوان
                    <input name="title" required />
                  </label>
                  <label>
                    الموعد
                    <input type="datetime-local" name="startsAt" required />
                  </label>
                  <label>
                    المدة
                    <input
                      type="number"
                      name="duration"
                      min="15"
                      max="180"
                      required
                    />
                  </label>
                  <label>
                    المقاعد
                    <input
                      type="number"
                      name="capacity"
                      min="1"
                      max="50"
                      defaultValue="1"
                      required
                    />
                  </label>
                  <label>
                    رابط اجتماع HTTPS
                    <input
                      type="url"
                      name="meetingUrl"
                      placeholder="https://…"
                    />
                  </label>
                </>,
              )}
              <div className="card-list">
                {data.classes.map((c) => (
                  <article key={c.id}>
                    <div>
                      <h2>{c.title}</h2>
                      <a href={`/classroom/${c.id}`} className="text-button">
                        فتح الغرفة التفاعلية
                      </a>
                      <p>{new Date(c.startsAt).toLocaleString("ar-SA")}</p>
                      {c.bookings.map((b) => (
                        <label key={b.id}>
                          <input
                            type="checkbox"
                            checked={b.attended}
                            onChange={(e) =>
                              send("/api/classes", {
                                action: "attendance",
                                classId: c.id,
                                studentId: b.studentId,
                                attended: e.target.checked,
                              })
                            }
                          />
                          {data.users.find((u) => u.id === b.studentId)?.name ||
                            "طالب"}
                          <small>{b.interactions} تفاعل داخل الحصة</small>
                        </label>
                      ))}
                    </div>
                    <button
                      className="secondary-button"
                      disabled={busy}
                      onClick={() =>
                        send("/api/classes", {
                          action: "cancel-class",
                          classId: c.id,
                        })
                      }
                    >
                      إلغاء الحصة
                    </button>
                  </article>
                ))}
              </div>
            </>
          )}
          {tab === "assignments" && (
            <>
              <h2>إضافة واجب</h2>
              {form(
                "/api/assignments",
                "create",
                <>
                  {courseSelect()}
                  <label>
                    العنوان
                    <input name="title" required />
                  </label>
                  <label>
                    موعد التسليم
                    <input type="datetime-local" name="dueAt" required />
                  </label>
                  <label>
                    الدرجة الكاملة
                    <input
                      type="number"
                      name="maxPoints"
                      min="1"
                      max="1000"
                      defaultValue="100"
                      required
                    />
                  </label>
                  <label className="full-width">
                    التعليمات
                    <textarea name="instructions" required />
                  </label>
                </>,
              )}
              {data.assignments.map((a) => (
                <section className="activity-card" key={a.id}>
                  <h2>{a.title}</h2>
                  {a.submissions.map((s) => (
                    <article key={s.id}>
                      <h3>
                        {data.users.find((u) => u.id === s.studentId)?.name ||
                          "طالب"}
                      </h3>
                      <p className="lesson-content">{s.answer}</p>
                      {form(
                        "/api/assignments",
                        "grade",
                        <>
                          <input
                            type="hidden"
                            name="submissionId"
                            value={s.id}
                          />
                          <label>
                            الدرجة من {a.maxPoints}
                            <input
                              type="number"
                              name="score"
                              min="0"
                              max={a.maxPoints}
                              defaultValue={s.score ?? ""}
                              required
                            />
                          </label>
                          <label>
                            الملاحظات
                            <textarea
                              name="feedback"
                              defaultValue={s.feedback || ""}
                            />
                          </label>
                        </>,
                      )}
                    </article>
                  ))}
                  {!a.submissions.length && <p>لم تصل إجابات بعد.</p>}
                </section>
              ))}
            </>
          )}
          {tab === "exams" && (
            <>
              <h2>إنشاء اختبار قصير</h2>
              {form(
                "/api/workspace",
                "exam",
                <>
                  {courseSelect()}
                  <label>
                    عنوان الاختبار
                    <input name="title" required />
                  </label>
                  <label className="full-width">
                    السؤال
                    <textarea name="question" required />
                  </label>
                  {[1, 2, 3, 4].map((i) => (
                    <label key={i}>
                      الخيار {i}
                      <input name={`option${i}`} required />
                    </label>
                  ))}
                  <label>
                    رقم الخيار الصحيح
                    <input
                      type="number"
                      name="correct"
                      min="1"
                      max="4"
                      required
                    />
                  </label>
                </>,
              )}
            </>
          )}
          {tab === "billing" && <Billing />}
          {tab === "users" && (
            <>
              <h2>إنشاء حساب</h2>
              {form(
                "/api/workspace",
                "user",
                <>
                  <label>
                    الاسم
                    <input name="name" required />
                  </label>
                  <label>
                    البريد
                    <input type="email" name="email" required />
                  </label>
                  <label>
                    كلمة المرور
                    <input
                      type="password"
                      name="password"
                      minLength={10}
                      required
                    />
                  </label>
                  <label>
                    الدور
                    <select name="role">
                      <option value="STUDENT">طالب</option>
                      <option value="TEACHER">مدرس</option>
                      <option value="PARENT">ولي أمر</option>
                      <option value="ADMIN">مشرف</option>
                    </select>
                  </label>
                  <label>
                    الجنس
                    <select name="gender">
                      <option value="MALE">ذكر</option>
                      <option value="FEMALE">أنثى</option>
                    </select>
                  </label>
                  <label>
                    تاريخ الميلاد
                    <input type="date" name="birthDate" required />
                  </label>
                </>,
              )}
              <h2>إعادة تعيين كلمة مرور مستخدم</h2>
              {form(
                "/api/workspace",
                "reset-password",
                <>
                  <label>
                    المستخدم
                    <select name="userId" required>
                      {data.users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} · {u.email}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    كلمة المرور الجديدة
                    <input
                      name="password"
                      type="password"
                      minLength={10}
                      required
                    />
                  </label>
                </>,
              )}
              <h2>ربط ولي أمر بطالب</h2>
              {form(
                "/api/workspace",
                "parent-link",
                <>
                  {userSelect("parentId", "PARENT", "ولي الأمر")}
                  {userSelect("studentId", "STUDENT", "الطالب")}
                </>,
              )}
              <h2>تسجيل طالب في مادة</h2>
              {form(
                "/api/workspace",
                "enroll",
                <>
                  {userSelect("studentId", "STUDENT", "الطالب")}
                  {courseSelect()}
                </>,
              )}
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>الاسم</th>
                      <th>البريد</th>
                      <th>الدور</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.users.map((u) => (
                      <tr key={u.id}>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td>{u.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
      <AssistantPanel />
    </main>
  );
}
