import { PanelModulePage } from "../../_components/panel-module-page";

export default async function SecurityOfficerModulePage({
  params,
}: PageProps<"/security-officer/[module]">) {
  const { module } = await params;
  return <PanelModulePage panel="security-officer" module={module} />;
}
