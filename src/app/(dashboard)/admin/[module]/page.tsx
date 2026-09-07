import { PanelModulePage } from "../../_components/panel-module-page";

export default async function AdminModulePage({
  params,
}: PageProps<"/admin/[module]">) {
  const { module } = await params;
  return <PanelModulePage panel="admin" module={module} />;
}
