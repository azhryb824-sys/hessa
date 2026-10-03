import { requireUser } from "@/lib/access";
import { prisma } from "@/lib/db/prisma";
import { readBody, fail, cleanText, HttpError } from "@/lib/http";
export async function GET() {
  try {
    const u = await requireUser();
    if (!["STUDENT", "ADMIN"].includes(u.role))
      throw new HttpError(403, "غير مصرح");
    const plans = await prisma.billingPlan.findMany({
      where: u.role === "ADMIN" ? {} : { active: true },
    });
    const invoices = await prisma.billingInvoice.findMany({
      where: u.role === "ADMIN" ? {} : { userId: u.id },
      include: { plan: true, subscription: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: u.id,
        startsAt: { lte: new Date() },
        expiresAt: { gt: new Date() },
      },
      orderBy: { expiresAt: "desc" },
    });
    return Response.json({
      success: true,
      admin: u.role === "ADMIN",
      plans,
      invoices,
      subscription,
      paymentInstructions:
        process.env.PAYMENT_INSTRUCTIONS ||
        "تواصل مع الإدارة لتأكيد وسيلة السداد. لا تحول مبلغًا قبل معرفة بيانات المستفيد.",
      checkoutEnabled: false,
    });
  } catch (e) {
    return fail(e);
  }
}
export async function POST(request: Request) {
  try {
    const u = await requireUser();
    const b = await readBody(request);
    const action = cleanText(b.action, 40);
    if (action === "plan") {
      if (u.role !== "ADMIN") throw new HttpError(403, "إعداد الباقات للمشرف");
      const name = cleanText(b.name, 100),
        priceHalalas = Number(b.priceHalalas),
        durationDays = Number(b.durationDays);
      if (
        !name ||
        !Number.isInteger(priceHalalas) ||
        priceHalalas < 100 ||
        priceHalalas > 10000000 ||
        !Number.isInteger(durationDays) ||
        durationDays < 1 ||
        durationDays > 366
      )
        throw new HttpError(400, "بيانات الباقة غير صحيحة");
      await prisma.billingPlan.create({
        data: { name, priceHalalas, durationDays },
      });
    } else if (action === "order") {
      if (u.role !== "STUDENT")
        throw new HttpError(403, "طلب الاشتراك لحساب الطالب");
      const planId = cleanText(b.planId, 200);
      const plan = await prisma.billingPlan.findFirst({
        where: { id: planId, active: true },
      });
      if (!plan) throw new HttpError(404, "الباقة غير متاحة");
      const invoice = await prisma.$transaction(async (tx) => {
        const pending = await tx.billingInvoice.findFirst({
          where: { userId: u.id, planId, status: "PENDING" },
        });
        return (
          pending ||
          tx.billingInvoice.create({
            data: {
              userId: u.id,
              planId,
              amountHalalas: plan.priceHalalas,
              durationDays: plan.durationDays,
            },
          })
        );
      });
      return Response.json({ success: true, invoice });
    } else if (action === "confirm-payment") {
      if (u.role !== "ADMIN")
        throw new HttpError(403, "اعتماد السداد للمشرف فقط");
      const invoiceId = cleanText(b.invoiceId, 200),
        reference = cleanText(b.reference, 200);
      if (!reference) throw new HttpError(400, "مرجع السداد مطلوب");
      await prisma.$transaction(async (tx) => {
        const invoice = await tx.billingInvoice.findUnique({
          where: { id: invoiceId },
        });
        if (!invoice) throw new HttpError(404, "المطالبة غير موجودة");
        if (invoice.status === "PAID") return;
        if (invoice.status !== "PENDING")
          throw new HttpError(409, "المطالبة غير قابلة للسداد");
        const last = await tx.subscription.findFirst({
          where: { userId: invoice.userId },
          orderBy: { expiresAt: "desc" },
        });
        const startsAt =
          last && last.expiresAt > new Date() ? last.expiresAt : new Date();
        const expiresAt = new Date(
          startsAt.getTime() + invoice.durationDays * 86400000,
        );
        await tx.subscription.create({
          data: { userId: invoice.userId, invoiceId, startsAt, expiresAt },
        });
        await tx.billingInvoice.update({
          where: { id: invoiceId },
          data: {
            status: "PAID",
            paymentReference: reference,
            paidAt: new Date(),
          },
        });
        await tx.auditLog.create({
          data: {
            actorId: u.id,
            action: "payment-confirmed",
            entityId: invoiceId,
          },
        });
      });
    } else if (action === "cancel") {
      const id = cleanText(b.invoiceId, 200);
      const invoice = await prisma.billingInvoice.findUnique({ where: { id } });
      if (!invoice || (u.role !== "ADMIN" && invoice.userId !== u.id))
        throw new HttpError(404, "المطالبة غير موجودة");
      await prisma.billingInvoice.updateMany({
        where: { id, status: "PENDING" },
        data: { status: "CANCELLED" },
      });
    } else throw new HttpError(400, "الإجراء غير صحيح");
    return Response.json({ success: true });
  } catch (e) {
    return fail(e);
  }
}
