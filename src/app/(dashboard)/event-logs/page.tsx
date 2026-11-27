/**
 * Layer: Next.js App Router Page (/event-logs)
 * Purpose: Route entry point that composes the Event Ingestion & Data Governance dashboard view.
 * Flow: App Router Page -> LogSourcesManager -> EventSourcesList
 */
import { LogSourcesManager } from "@/features/event-ingestion";

/** Renders the Event Ingestion & Data Governance page. */
export default function Page() {
  return <LogSourcesManager />;
}
