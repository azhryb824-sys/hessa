import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function fail(error: unknown) {
  if (error instanceof HttpError)
    return NextResponse.json(
      { success: false, message: error.message },
      { status: error.status },
    );
  console.error(
    "request-failed",
    error instanceof Error ? error.name : "unknown",
  );
  return NextResponse.json(
    { success: false, message: "تعذر تنفيذ الطلب. حاول مرة أخرى." },
    { status: 500 },
  );
}
export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = process.env.APP_URL || new URL(request.url).origin;
  if (origin && origin !== expected)
    throw new HttpError(403, "مصدر الطلب غير مسموح");
  if (request.headers.get("sec-fetch-site") === "cross-site")
    throw new HttpError(403, "مصدر الطلب غير مسموح");
}
export async function readBytes(request: Request, limit: number) {
  if (Number(request.headers.get("content-length")) > limit)
    throw new HttpError(413, "الطلب أكبر من الحد المسموح");
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new HttpError(413, "الطلب أكبر من الحد المسموح");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const data = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    data.set(chunk, offset);
    offset += chunk.length;
  }
  return data;
}
export async function readBody(request: Request) {
  checkOrigin(request);
  const text = new TextDecoder().decode(await readBytes(request, 32000));
  try {
    const value = JSON.parse(text);
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error();
    return value as Record<string, unknown>;
  } catch {
    throw new HttpError(400, "بيانات الطلب غير صحيحة");
  }
}
export async function rateLimit(key: string, limit = 30, minutes = 1) {
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    const old = await tx.rateLimit.findUnique({ where: { key } });
    if (old && old.windowEnd > now && old.count >= limit)
      throw new HttpError(429, "طلبات كثيرة. حاول بعد قليل.");
    await tx.rateLimit.upsert({
      where: { key },
      create: {
        key,
        count: 1,
        windowEnd: new Date(Date.now() + minutes * 60000),
      },
      update:
        old && old.windowEnd > now
          ? { count: { increment: 1 } }
          : { count: 1, windowEnd: new Date(Date.now() + minutes * 60000) },
    });
  });
}
export function cleanText(value: unknown, max = 2000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
