import { notFound } from "next/navigation";
import { panelHasModule, type PanelKind } from "@/config/navigation";
import AiModelsPage from "../ai-models/page";
import AnomalyMonitoringPage from "../anomaly-monitoring/page";
import AssetsPage from "../assets/page";
import AuditsPage from "../audits/page";
import ControlsPage from "../controls/page";
import EventLogsPage from "../event-logs/page";
import FilesPage from "../files/page";
import IncidentsPage from "../incidents/page";
import NotificationsPage from "../notifications/page";
import PoliciesPage from "../policies/page";
import ReportsPage from "../reports/page";
import RisksPage from "../risks/page";
import SettingsPage from "../settings/page";
import SystemLogsPage from "../system-logs/page";
import UsersPage from "../users/page";
import WorkflowDefinitionsPage from "../workflow-definitions/page";

const modulePages = {
  "ai-models": AiModelsPage,
  "anomaly-monitoring": AnomalyMonitoringPage,
  assets: AssetsPage,
  audits: AuditsPage,
  controls: ControlsPage,
  "event-logs": EventLogsPage,
  files: FilesPage,
  incidents: IncidentsPage,
  notifications: NotificationsPage,
  policies: PoliciesPage,
  reports: ReportsPage,
  risks: RisksPage,
  settings: SettingsPage,
  "system-logs": SystemLogsPage,
  users: UsersPage,
  "workflow-definitions": WorkflowDefinitionsPage,
} as const;

export function PanelModulePage({
  panel,
  module,
}: {
  panel: PanelKind;
  module: string;
}) {
  if (!panelHasModule(panel, module) || !(module in modulePages)) notFound();

  const Page = modulePages[module as keyof typeof modulePages];
  return <Page />;
}
