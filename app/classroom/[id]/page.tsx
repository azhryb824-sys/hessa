import Classroom from "@/components/Classroom";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <Classroom classId={id} />;
}
