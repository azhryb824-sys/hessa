import { getCurrentUser } from "@/lib/auth";
export async function GET() {
  const u = await getCurrentUser();
  if (!u) return Response.json({ success: false }, { status: 401 });
  return Response.json(
    {
      success: true,
      user: { id: u.id, name: u.name, email: u.email, role: u.role },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
