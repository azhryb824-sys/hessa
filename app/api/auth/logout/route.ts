import { endSession } from "@/lib/auth";
import { checkOrigin, fail } from "@/lib/http";
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    await endSession();
    return Response.json({ success: true });
  } catch (e) {
    return fail(e);
  }
}
