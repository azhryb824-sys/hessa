import { requireStudent } from "@/lib/access";
import { learningData } from "@/lib/learning-data";
import { fail } from "@/lib/http";
export async function GET() {
  try {
    const user = await requireStudent();
    return Response.json(await learningData(user.id), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return fail(e);
  }
}
