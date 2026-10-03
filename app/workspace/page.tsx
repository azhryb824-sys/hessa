import { requireUser } from "@/lib/access";
import { redirect } from "next/navigation";
import Management from "@/components/Management";
export default async function Workspace() {
  const user = await requireUser().catch(() => null);
  if (!user) redirect("/login");
  if (user.role === "STUDENT") redirect("/dashboard");
  return <Management />;
}
