import { PanelModulePage } from "../../_components/panel-module-page";

export default async function ExecutiveAuditorModulePage({
  params,
}: PageProps<"/executive-auditor/[module]">) {
  const { module } = await params;
  return <PanelModulePage panel="executive-auditor" module={module} />;
}
