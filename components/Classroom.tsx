"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
type Person = { id: string; name: string; role: string };
type Event = {
  id: number;
  senderId: string;
  type: string;
  data: Record<string, unknown>;
};
type Stroke = { points: number[][] };
function Video({
  stream,
  label,
  muted = false,
}: {
  stream: MediaStream;
  label: string;
  muted?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return (
    <div className="video-tile">
      <video ref={ref} autoPlay playsInline muted={muted} />
      <span>{label}</span>
    </div>
  );
}
export default function Classroom({ classId }: { classId: string }) {
  const [ready, setReady] = useState(false),
    [title, setTitle] = useState("غرفة الحصة"),
    [teacher, setTeacher] = useState(false),
    [people, setPeople] = useState<Person[]>([]),
    [events, setEvents] = useState<Event[]>([]),
    [streams, setStreams] = useState<Record<string, MediaStream>>({}),
    [local, setLocal] = useState<MediaStream | null>(null),
    [error, setError] = useState(""),
    [text, setText] = useState(""),
    [mic, setMic] = useState(true),
    [camera, setCamera] = useState(true),
    [hand, setHand] = useState(false),
    [files, setFiles] = useState<{ id: string; name: string }[]>([]),
    [relay, setRelay] = useState(false),
    [recording, setRecording] = useState(false),
    [recordings, setRecordings] = useState<{ id: string; name: string }[]>([]);
  const localRef = useRef<MediaStream | null>(null),
    pcs = useRef(new Map<string, RTCPeerConnection>()),
    pending = useRef(new Map<string, RTCIceCandidateInit[]>()),
    self = useRef(""),
    ice = useRef<RTCIceServer[]>([]),
    cursor = useRef(0),
    drawing = useRef<number[][]>([]),
    board = useRef<SVGSVGElement>(null),
    screen = useRef<MediaStream | null>(null),
    recorder = useRef<MediaRecorder | null>(null);
  async function send(
    type: string,
    data: Record<string, unknown>,
    toUserId?: string,
  ) {
    const r = await fetch(`/api/classroom/${classId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, data, toUserId }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.message);
  }
  async function media() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localRef.current = stream;
      setLocal(stream);
      return stream;
    } catch {
      setError(
        "لم تُمنح صلاحية الكاميرا والميكروفون. الدردشة والسبورة تعملان.",
      );
      return null;
    }
  }
  function peer(id: string) {
    let pc = pcs.current.get(id);
    if (pc) return pc;
    pc = new RTCPeerConnection({ iceServers: ice.current });
    pcs.current.set(id, pc);
    for (const track of localRef.current?.getTracks() || [])
      pc.addTrack(track, localRef.current!);
    pc.onicecandidate = (e) => {
      if (e.candidate)
        send("candidate", { candidate: e.candidate.toJSON() }, id).catch(
          () => {},
        );
    };
    pc.ontrack = (e) => {
      const remote = e.streams[0] || new MediaStream([e.track]);
      setStreams((s) => ({ ...s, [id]: remote }));
    };
    pc.onconnectionstatechange = () => {
      if (pc?.connectionState === "failed")
        setError(
          "تعذر اتصال الفيديو بأحد المشاركين. قد يلزم خادم TURN للشبكات المختلفة.",
        );
    };
    return pc;
  }
  async function signal(event: Event) {
    const id = event.senderId;
    if (id === self.current) return;
    const pc = peer(id);
    if (event.type === "offer") {
      await pc.setRemoteDescription(
        event.data.description as RTCSessionDescriptionInit,
      );
      for (const c of pending.current.get(id) || [])
        await pc.addIceCandidate(c);
      pending.current.delete(id);
      await pc.setLocalDescription(await pc.createAnswer());
      await send("answer", { description: pc.localDescription?.toJSON() }, id);
    } else if (event.type === "answer") {
      await pc.setRemoteDescription(
        event.data.description as RTCSessionDescriptionInit,
      );
      for (const c of pending.current.get(id) || [])
        await pc.addIceCandidate(c);
      pending.current.delete(id);
    } else if (event.type === "candidate") {
      const c = event.data.candidate as RTCIceCandidateInit;
      if (pc.remoteDescription) await pc.addIceCandidate(c);
      else pending.current.set(id, [...(pending.current.get(id) || []), c]);
    }
  }
  useEffect(() => {
    if (!ready) return;
    let stopped = false,
      active = false;
    const connections = pcs.current;
    async function poll() {
      if (active) return;
      active = true;
      try {
        const r = await fetch(
          `/api/classroom/${classId}?after=${cursor.current}`,
        );
        const d = await r.json();
        if (!r.ok) throw new Error(d.message);
        if (stopped) return;
        self.current = d.user.id;
        ice.current = d.iceServers;
        setTitle(d.title);
        setTeacher(d.teacher);
        setPeople(d.people);
        setRelay(d.relayConfigured);
        for (const p of d.people as Person[]) {
          if (
            p.id !== self.current &&
            !pcs.current.has(p.id) &&
            self.current < p.id
          ) {
            const pc = peer(p.id);
            await pc.setLocalDescription(await pc.createOffer());
            await send(
              "offer",
              { description: pc.localDescription?.toJSON() },
              p.id,
            );
          }
        }
        for (const e of d.events as Event[]) {
          cursor.current = Math.max(cursor.current, e.id);
          if (["offer", "answer", "candidate"].includes(e.type)) {
            await signal(e);
          } else
            setEvents((old) =>
              old.some((x) => x.id === e.id) ? old : [...old, e],
            );
        }
        for (const [id, pc] of pcs.current)
          if (!d.people.some((p: Person) => p.id === id)) {
            pc.close();
            pcs.current.delete(id);
            setStreams((s) => {
              const next = { ...s };
              delete next[id];
              return next;
            });
          }
      } catch (e) {
        if (!stopped)
          setError(e instanceof Error ? e.message : "تعذر الاتصال بالحصة");
      } finally {
        active = false;
      }
    }
    void poll();
    const timer = setInterval(poll, 1800);
    return () => {
      stopped = true;
      clearInterval(timer);
      if (recorder.current?.state === "recording") recorder.current.stop();
      connections.forEach((pc) => pc.close());
      connections.clear();
      localRef.current?.getTracks().forEach((t) => t.stop());
      screen.current?.getTracks().forEach((t) => t.stop());
      void fetch(`/api/classroom/${classId}`, { method: "DELETE" });
    };
    // Connection handlers use mutable refs; restarting polling would discard media tracks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, classId]);
  async function join() {
    try {
      const r = await fetch(`/api/classroom/${classId}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      await media();
      setReady(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر الدخول");
    }
  }
  async function share() {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      screen.current = stream;
      const track = stream.getVideoTracks()[0];
      for (const pc of pcs.current.values()) {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        await sender?.replaceTrack(track);
      }
      setLocal(stream);
      track.onended = () => {
        const original = localRef.current?.getVideoTracks()[0];
        for (const pc of pcs.current.values())
          pc.getSenders()
            .find((s) => s.track?.kind === "video")
            ?.replaceTrack(original || null);
        setLocal(localRef.current);
      };
    } catch {
      setError("لم تبدأ مشاركة الشاشة.");
    }
  }
  async function record() {
    if (recorder.current?.state === "recording") {
      recorder.current.stop();
      setRecording(false);
      return;
    }
    try {
      const capture = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      if (!MediaRecorder.isTypeSupported("video/webm")) {
        capture.getTracks().forEach((t) => t.stop());
        throw new Error("المتصفح لا يدعم تسجيل WebM");
      }
      const mediaRecorder = new MediaRecorder(capture, {
        mimeType: "video/webm",
        videoBitsPerSecond: 1000000,
      });
      recorder.current = mediaRecorder;
      const chunks: Blob[] = [];
      let size = 0;
      mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data);
        size += e.data.size;
        if (size > 48 * 1024 * 1024 && mediaRecorder.state === "recording")
          mediaRecorder.stop();
      };
      mediaRecorder.onstop = async () => {
        capture.getTracks().forEach((t) => t.stop());
        setRecording(false);
        await send("recording", { active: false }).catch(() => {});
        try {
          const r = await fetch(`/api/classroom/${classId}/recordings`, {
            method: "POST",
            headers: { "Content-Type": "video/webm" },
            body: new Blob(chunks, { type: "video/webm" }),
          });
          const d = await r.json();
          if (!r.ok) throw new Error(d.message);
          await loadRecordings();
        } catch (e) {
          setError(e instanceof Error ? e.message : "تعذر حفظ التسجيل");
        }
      };
      capture.getVideoTracks()[0].onended = () => {
        if (mediaRecorder.state === "recording") mediaRecorder.stop();
      };
      await send("recording", { active: true });
      mediaRecorder.start(1000);
      setRecording(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "لم يبدأ التسجيل");
    }
  }
  async function loadRecordings() {
    const r = await fetch(`/api/classroom/${classId}/recordings`);
    const d = await r.json();
    if (r.ok) setRecordings(d.recordings);
  }
  async function loadFiles() {
    const r = await fetch(`/api/classroom/${classId}/files`);
    const d = await r.json();
    if (r.ok) setFiles(d.files);
  }
  async function upload(file: File) {
    try {
      if (file.size > 2 * 1024 * 1024)
        throw new Error("الحد الأقصى 2 ميجابايت");
      const r = await fetch(`/api/classroom/${classId}/files`, {
        method: "POST",
        headers: {
          "Content-Type": file.type,
          "x-file-name": encodeURIComponent(file.name),
        },
        body: file,
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      await loadFiles();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر رفع الملف");
    }
  }
  function point(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return [
      Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    ];
  }
  const clearIndex = events.findLastIndex((e) => e.type === "clear");
  const strokes = events
    .slice(clearIndex + 1)
    .filter((e) => e.type === "stroke")
    .map((e) => e.data as Stroke);
  const polls = events.filter((e) => e.type === "poll");
  const hands = new Map<string, boolean>();
  events
    .filter((e) => e.type === "hand")
    .forEach((e) => hands.set(e.senderId, e.data.raised === true));
  return (
    <main dir="rtl" className="classroom-page">
      <header className="management-header">
        <div>
          <p className="eyebrow">حصة تفاعلية</p>
          <h1>{title}</h1>
        </div>
        <Link className="secondary-button" href="/dashboard/classes">
          مغادرة الغرفة
        </Link>
      </header>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      {!ready ? (
        <section className="activity-card">
          <h2>جاهز للحصة؟</h2>
          <p>
            يمكنك الدخول قبل موعد الحصة بـ15 دقيقة. ستُطلب صلاحية الكاميرا
            والميكروفون.
          </p>
          <button className="primary-button" onClick={join}>
            الدخول إلى الغرفة
          </button>
        </section>
      ) : (
        <>
          <p className="notice">
            {relay
              ? "اتصال الفيديو يستخدم إعدادات الخادم المتاحة."
              : "الفيديو يعمل بالاتصال المباشر. الشبكات المختلفة قد تحتاج إعداد خادم TURN."}{" "}
            · {people.length} مشاركين
          </p>
          <div className="video-grid">
            {local && <Video stream={local} label="أنت" muted />}
            {Object.entries(streams).map(([id, stream]) => (
              <Video
                key={id}
                stream={stream}
                label={people.find((p) => p.id === id)?.name || "مشارك"}
              />
            ))}
          </div>
          <div className="actions">
            <button
              className="secondary-button"
              onClick={() => {
                localRef.current
                  ?.getAudioTracks()
                  .forEach((t) => (t.enabled = !mic));
                setMic(!mic);
              }}
            >
              {mic ? "كتم الميكروفون" : "تشغيل الميكروفون"}
            </button>
            <button
              className="secondary-button"
              onClick={() => {
                localRef.current
                  ?.getVideoTracks()
                  .forEach((t) => (t.enabled = !camera));
                setCamera(!camera);
              }}
            >
              {camera ? "إيقاف الكاميرا" : "تشغيل الكاميرا"}
            </button>
            <button className="secondary-button" onClick={share}>
              مشاركة الشاشة
            </button>
            {teacher && (
              <button className="secondary-button" onClick={record}>
                {recording ? "إيقاف التسجيل وحفظه" : "تسجيل نافذة الحصة"}
              </button>
            )}
            <button
              className="secondary-button"
              onClick={() => {
                send("hand", { raised: !hand })
                  .then(() => setHand(!hand))
                  .catch((e) => setError(e.message));
              }}
            >
              {hand ? "خفض اليد" : "رفع اليد ✋"}
            </button>
          </div>
          {events.filter((e) => e.type === "recording").at(-1)?.data.active ===
            true && <p className="notice">● المدرس يسجل الحصة الآن.</p>}
          <p>
            {people
              .filter((p) => hands.get(p.id))
              .map((p) => p.name)
              .join("، ")}{" "}
            {people.some((p) => hands.get(p.id)) ? "يريد المشاركة" : ""}
          </p>
          <div className="classroom-columns">
            <section className="activity-card">
              <div className="actions">
                <h2>السبورة المشتركة</h2>
                {teacher && (
                  <button
                    className="text-button"
                    onClick={() =>
                      send("clear", {}).catch((e) => setError(e.message))
                    }
                  >
                    مسح السبورة
                  </button>
                )}
              </div>
              <svg
                ref={board}
                viewBox="0 0 1000 600"
                className="whiteboard"
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  drawing.current = [point(e)];
                }}
                onPointerMove={(e) => {
                  if (e.buttons === 1 && drawing.current.length < 1000)
                    drawing.current.push(point(e));
                }}
                onPointerUp={() => {
                  if (drawing.current.length > 1)
                    send("stroke", { points: drawing.current }).catch((e) =>
                      setError(e.message),
                    );
                  drawing.current = [];
                }}
              >
                {strokes.map((s, i) => (
                  <polyline
                    key={i}
                    points={s.points
                      .map((p) => `${p[0] * 1000},${p[1] * 600}`)
                      .join(" ")}
                    fill="none"
                    stroke="#254edb"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                ))}
              </svg>
              <p className="muted">
                ارسم بالسحب؛ يظهر الخط للجميع بعد رفع المؤشر.
              </p>
            </section>
            <section className="activity-card">
              <h2>الأسئلة والدردشة</h2>
              <div className="room-chat" aria-live="polite">
                {events
                  .filter((e) => e.type === "chat")
                  .map((e) => (
                    <p key={e.id}>
                      <strong>
                        {people.find((p) => p.id === e.senderId)?.name ||
                          "مشارك"}
                        :{" "}
                      </strong>
                      {String(e.data.text)}
                    </p>
                  ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send("chat", { text })
                    .then(() => setText(""))
                    .catch((e) => setError(e.message));
                }}
              >
                <input
                  value={text}
                  maxLength={1500}
                  required
                  onChange={(e) => setText(e.target.value)}
                  placeholder="اكتب سؤالًا…"
                  aria-label="رسالتك"
                />
                <button className="primary-button">إرسال</button>
              </form>
            </section>
          </div>
          <section className="activity-card">
            <h2>استطلاعات واختبارات فورية</h2>
            {teacher && (
              <form
                className="management-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  send("poll", {
                    question: f.get("question"),
                    options: [f.get("a"), f.get("b")],
                  }).catch((e) => setError(e.message));
                }}
              >
                <label>
                  السؤال
                  <input name="question" maxLength={300} required />
                </label>
                <label>
                  الخيار الأول
                  <input name="a" required />
                </label>
                <label>
                  الخيار الثاني
                  <input name="b" required />
                </label>
                <button className="primary-button">طرح السؤال</button>
              </form>
            )}
            {polls.map((p) => {
              const votes = new Map<string, number>();
              events
                .filter(
                  (e) => e.type === "vote" && Number(e.data.pollId) === p.id,
                )
                .forEach((e) => votes.set(e.senderId, Number(e.data.option)));
              return (
                <article key={p.id}>
                  <h3>{String(p.data.question)}</h3>
                  <div className="suggestions">
                    {(p.data.options as string[]).map((o, i) => (
                      <button
                        key={i}
                        onClick={() =>
                          send("vote", { pollId: p.id, option: i }).catch((e) =>
                            setError(e.message),
                          )
                        }
                      >
                        {o} ·{" "}
                        {[...votes.values()].filter((v) => v === i).length}
                      </button>
                    ))}
                  </div>
                </article>
              );
            })}
          </section>
          <section className="activity-card">
            <h2>تسجيلات الحصة</h2>
            <p className="muted">
              يسجل المدرس النافذة والصوت الذي يختاره في المتصفح. الحد الأقصى
              للتسجيل 50 ميجابايت.
            </p>
            <button className="secondary-button" onClick={loadRecordings}>
              عرض التسجيلات
            </button>
            {recordings.map((r) => (
              <p key={r.id}>
                <a
                  href={`/api/classroom/${classId}/recordings?recordingId=${r.id}`}
                >
                  تنزيل {r.name}
                </a>
              </p>
            ))}
          </section>
          <section className="activity-card">
            <h2>ملفات الحصة</h2>
            <div className="actions">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.txt"
                onChange={(e) => {
                  if (e.target.files?.[0]) upload(e.target.files[0]);
                }}
                aria-label="رفع ملف للحصة"
              />
              <button className="secondary-button" onClick={loadFiles}>
                تحديث الملفات
              </button>
            </div>
            {files.map((f) => (
              <p key={f.id}>
                <a href={`/api/classroom/${classId}/files?fileId=${f.id}`}>
                  {f.name}
                </a>
              </p>
            ))}
          </section>
        </>
      )}
    </main>
  );
}
