import { notFound } from "next/navigation";
import { panelHasModule, type PanelKind } from "@/config/navigation";
import AiModelsPage from "../ai-models/page";
import AlertsPage from "../alerts/page";
import AnomalyMonitoringPage from "../anomaly-monitoring/page";
import AssetsPage from "../assets/page";
import AuditsPage from "../audits/page";
import CompliancePage from "../compliance/page";
import ControlsPage from "../controls/page";
import CustomDashboardPage from "../custom-dashboard/page";
import EventLogsPage from "../event-logs/page";
import FilesPage from "../files/page";
import IncidentsPage from "../incidents/page";
import NotificationsPage from "../notifications/page";
import PoliciesPage from "../policies/page";
import ReportsPage from "../reports/page";
import RisksPage from "../risks/page";
import RolesPage from "../roles/page";
import SettingsPage from "../settings/page";
import TrainingPage from "../training/page";
import UsersPage from "../users/page";

const modulePages = {
  "ai-models": AiModelsPage,
  alerts: AlertsPage,
  "anomaly-monitoring": AnomalyMonitoringPage,
  assets: AssetsPage,
  audits: AuditsPage,
  compliance: CompliancePage,
  controls: ControlsPage,
  "custom-dashboard": CustomDashboardPage,
  "event-logs": EventLogsPage,
  files: FilesPage,
  incidents: IncidentsPage,
  notifications: NotificationsPage,
  policies: PoliciesPage,
  reports: ReportsPage,
  risks: RisksPage,
  roles: RolesPage,
  settings: SettingsPage,
  training: TrainingPage,
  users: UsersPage,
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
