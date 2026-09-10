import type { Metadata } from "next";
import { ScheduleManagementView } from "@/features/integrations";

export const metadata: Metadata = {
  title: "Sync Schedules – SecuraAI",
  description:
    "Manage automatic log synchronization schedules for all connected SIEM and firewall integrations.",
};

export default function IntegrationSchedulesPage() {
  return <ScheduleManagementView />;
}
