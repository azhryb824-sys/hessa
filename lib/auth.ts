export { hashPassword, verifyPassword } from "@/lib/password";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
export const tokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export async function getCurrentUser() {
  const token = (await cookies()).get("hessa-session")?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { id: tokenHash(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt <= new Date()) return null;
  return session.user;
}
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 86400000);
  await prisma.session.create({
    data: { id: tokenHash(token), userId, expiresAt },
  });
  (await cookies()).set("hessa-session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure:
      process.env.SESSION_SECURE !== "false" &&
      process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}
export async function endSession() {
  const jar = await cookies();
  const token = jar.get("hessa-session")?.value;
  if (token)
    await prisma.session.deleteMany({ where: { id: tokenHash(token) } });
  jar.delete("hessa-session");
}
