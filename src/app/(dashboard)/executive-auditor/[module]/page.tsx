import { PanelModulePage } from "../../_components/panel-module-page";

export default async function ExecutiveAuditorModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module } = await params;
  return <PanelModulePage panel="executive-auditor" module={module} />;
}
