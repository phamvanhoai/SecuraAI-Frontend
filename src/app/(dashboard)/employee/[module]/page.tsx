import { redirect } from "next/navigation";

export default async function EmployeeModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module } = await params;
  redirect(`/${module}`);
}
