import { PanelModulePage } from "../../_components/panel-module-page";

export default async function AdminModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module } = await params;
  return <PanelModulePage panel="admin" module={module} />;
}
