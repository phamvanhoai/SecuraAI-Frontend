import { PanelModulePage } from "../../_components/panel-module-page";

export default async function EmployeeModulePage({
  params,
}: PageProps<"/employee/[module]">) {
  const { module } = await params;
  return <PanelModulePage panel="employee" module={module} />;
}
