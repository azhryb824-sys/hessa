import { classroomAccess } from "@/lib/classroom";
import { prisma } from "@/lib/db/prisma";
import { fail, readBody, cleanText, HttpError, rateLimit } from "@/lib/http";
import { getCurrentUser } from "@/lib/auth";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const { user, session, teacher } = await classroomAccess(id);
    const after = Number(new URL(request.url).searchParams.get("after")) || 0;
    await prisma.classPresence.upsert({
      where: { classId_userId: { classId: id, userId: user.id } },
      create: { classId: id, userId: user.id },
      update: { lastSeen: new Date() },
    });
    if (!teacher)
      await prisma.classBooking.update({
        where: { classId_studentId: { classId: id, studentId: user.id } },
        data: { attended: true },
      });
    const presence = await prisma.classPresence.findMany({
      where: { classId: id, lastSeen: { gt: new Date(Date.now() - 15000) } },
    });
    const people = await prisma.user.findMany({
      where: { id: { in: presence.map((p) => p.userId) } },
      select: { id: true, name: true, role: true },
    });
    const events = await prisma.classEvent.findMany({
      where: {
        classId: id,
        id: { gt: after },
        OR: [{ toUserId: null }, { toUserId: user.id }],
      },
      orderBy: { id: "asc" },
      take: 500,
    });
    const iceServers: RTCIceServer[] = [];
    if (process.env.WEBRTC_STUN_URL)
      iceServers.push({ urls: process.env.WEBRTC_STUN_URL });
    if (process.env.WEBRTC_TURN_URL)
      iceServers.push({
        urls: process.env.WEBRTC_TURN_URL,
        username: process.env.WEBRTC_TURN_USER,
        credential: process.env.WEBRTC_TURN_PASSWORD,
      });
    return Response.json(
      {
        success: true,
        user: { id: user.id, name: user.name },
        teacher,
        title: session.title,
        people,
        events: events.map((e) => ({ ...e, data: JSON.parse(e.data) })),
        iceServers,
        relayConfigured: !!process.env.WEBRTC_TURN_URL,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return fail(e);
  }
}
export async function POST(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const { user, session, teacher } = await classroomAccess(id);
    const b = await readBody(request);
    await rateLimit(`room:${id}:${user.id}`, 180);
    const type = cleanText(b.type, 30);
    const toUserId = cleanText(b.toUserId, 200) || null;
    const payload = b.data;
    if (
      ![
        "chat",
        "hand",
        "stroke",
        "clear",
        "poll",
        "vote",
        "offer",
        "answer",
        "candidate",
        "recording",
      ].includes(type)
    )
      throw new HttpError(400, "نوع الحدث غير صحيح");
    if (["clear", "poll", "recording"].includes(type) && !teacher)
      throw new HttpError(403, "هذا الإجراء للمدرس");
    if (["offer", "answer", "candidate"].includes(type)) {
      if (
        !toUserId ||
        (!session.bookings.some((x) => x.studentId === toUserId) &&
          toUserId !== session.teacherId)
      )
        throw new HttpError(403, "المستلم خارج الحصة");
    } else if (toUserId) throw new HttpError(400, "حدث عام غير صالح");
    if (!payload || typeof payload !== "object" || Array.isArray(payload))
      throw new HttpError(400, "بيانات الحدث غير صحيحة");
    const d = payload as Record<string, unknown>;
    if (
      type === "chat" &&
      (!cleanText(d.text, 1500) || String(d.text).length > 1500)
    )
      throw new HttpError(400, "رسالة غير صحيحة");
    if (
      type === "stroke" &&
      (!Array.isArray(d.points) ||
        d.points.length > 1000 ||
        d.points.some(
          (p) =>
            !Array.isArray(p) ||
            p.length !== 2 ||
            p.some((v) => typeof v !== "number" || v < 0 || v > 1),
        ))
    )
      throw new HttpError(400, "رسم غير صحيح");
    if (
      type === "poll" &&
      (!cleanText(d.question, 300) ||
        !Array.isArray(d.options) ||
        d.options.length < 2 ||
        d.options.length > 5 ||
        d.options.some((o) => typeof o !== "string" || o.length > 150))
    )
      throw new HttpError(400, "الاستطلاع غير صحيح");
    if (type === "vote") {
      const poll = await prisma.classEvent.findFirst({
        where: { id: Number(d.pollId), classId: id, type: "poll" },
      });
      if (
        !poll ||
        !Number.isInteger(d.option) ||
        Number(d.option) < 0 ||
        Number(d.option) >= JSON.parse(poll.data).options.length
      )
        throw new HttpError(400, "الخيار غير صالح");
    }
    const event = await prisma.classEvent.create({
      data: {
        classId: id,
        senderId: user.id,
        toUserId,
        type,
        data: JSON.stringify(payload),
      },
    });
    return Response.json({ success: true, id: event.id });
  } catch (e) {
    return fail(e);
  }
}
export async function DELETE(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user) throw new HttpError(401, "سجّل الدخول");
    const { checkOrigin } = await import("@/lib/http");
    checkOrigin(request);
    await prisma.classPresence.deleteMany({
      where: { classId: id, userId: user.id },
    });
    return Response.json({ success: true });
  } catch (e) {
    return fail(e);
  }
}
