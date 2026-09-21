import { CreateCourseBuilder } from "@/features/training";

export default async function Page({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  return <CreateCourseBuilder courseId={courseId} />;
}
