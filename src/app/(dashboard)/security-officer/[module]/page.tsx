import { redirect } from "next/navigation";

export default async function SecurityOfficerModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module } = await params;
  redirect(`/${module}`);
}
