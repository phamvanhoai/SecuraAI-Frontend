"use client";

import {
  Layers,
  Radio,
  Shield,
} from "lucide-react";
import { useState } from "react";
import {
  MetricStrip,
  ProductPageHeader,
} from "@/components/data-display/static-product";
import { useEventSources } from "../hooks/use-event-sources";
import { useNormalizedEventMetrics } from "../hooks/use-normalized-events";
import { useEventGovernanceSummary } from "../hooks/use-event-governance";
import { useSessionUser } from "@/features/authentication-account";
import { EventSourcesList } from "./event-sources-list";
import { EventGovernancePoliciesList } from "./event-governance-policies-list";
import { NormalizedEventsList } from "./normalized-events-list";
import { RegisterEventSourceForm } from "./register-event-source-form";
import { cn } from "@/lib/utils";

export function LogSourcesManager() {
  const session = useSessionUser();
  const canViewEvents =
    session.data?.roles.some((role) => role.code === "SECURITY_OFFICER") ?? false;

  const [selectedTab, setSelectedTab] = useState<
    "events" | "event-sources" | "governance"
  >("events");
  const [registerEventSourceOpen, setRegisterEventSourceOpen] = useState(false);

  const activeTab = !canViewEvents && selectedTab === "events" ? "event-sources" : selectedTab;

  const eventSourcesOverview = useEventSources({ limit: 100 });
  const eventMetrics = useNormalizedEventMetrics({ enabled: canViewEvents });
  const governanceSummary = useEventGovernanceSummary();

  const totalEventSources = eventSourcesOverview.data?.pagination.total ?? 0;
  const activeEventSources =
    eventSourcesOverview.data?.items.filter((s) => s.status === "ACTIVE").length ?? 0;
  const uniqueSourceTypes = new Set(
    eventSourcesOverview.data?.items.map((s) => s.sourceType) ?? [],
  ).size;
  const uniqueFamilies = new Set(
    eventSourcesOverview.data?.items.flatMap((s) => s.eventFamilies) ?? [],
  ).size;

  return (
    <>
      <ProductPageHeader
        description="Configure and monitor normalized security events, telemetry sources, and event data governance retention policies."
        showSampleNotice={false}
        title="Event Ingestion & Data Governance"
        {...(activeTab === "event-sources"
          ? {
              primaryAction: "Register event source",
              onPrimaryAction: () => setRegisterEventSourceOpen(true),
            }
          : {})}
      />
      <MetricStrip
        ariaLabel={
          activeTab === "events"
            ? "Security event metrics"
            : activeTab === "event-sources"
              ? "Event source metrics"
              : "Data governance & retention metrics"
        }
        metrics={
          activeTab === "events"
            ? [
              {
                label: "Total events",
                value: eventMetrics.data
                  ? String(eventMetrics.data.totalEvents)
                  : "—",
                detail: "Across all active sources",
                tone: "brand",
                loading: eventMetrics.isPending,
              },
              {
                label: "Resolved & mapped",
                value: eventMetrics.data
                  ? String(eventMetrics.data.totalMapped)
                  : "—",
                detail: "Entities identified",
                tone: "neutral",
                loading: eventMetrics.isPending,
              },
              {
                label: "24h Volume",
                value: eventMetrics.data
                  ? String(eventMetrics.data.eventsLast24Hours)
                  : "—",
                detail: "Ingested in last 24h",
                tone: "neutral",
                loading: eventMetrics.isPending,
              },
              {
                label: "Unmapped / Review",
                value: eventMetrics.data
                  ? String(eventMetrics.data.totalUnmapped)
                  : "—",
                detail: "Awaiting entity mapping",
                tone:
                  (eventMetrics.data?.totalUnmapped ?? 0) > 0
                    ? "warning"
                    : "neutral",
                loading: eventMetrics.isPending,
              },
            ]
            : activeTab === "event-sources"
              ? [
                {
                  label: "Total sources",
                  value: eventSourcesOverview.data
                    ? String(totalEventSources)
                    : "—",
                  detail: "Normalized event sources",
                  tone: "brand",
                  loading: eventSourcesOverview.isPending,
                },
                {
                  label: "Active sources",
                  value: eventSourcesOverview.data
                    ? String(activeEventSources)
                    : "—",
                  detail: "Ready to ingest events",
                  tone: "neutral",
                  loading: eventSourcesOverview.isPending,
                },
                {
                  label: "Source types",
                  value: eventSourcesOverview.data
                    ? String(uniqueSourceTypes)
                    : "—",
                  detail: "Distinct ingestion types",
                  tone: "neutral",
                  loading: eventSourcesOverview.isPending,
                },
                {
                  label: "Event families",
                  value: eventSourcesOverview.data
                    ? String(uniqueFamilies)
                    : "—",
                  detail: "Coverage across domains",
                  tone: "neutral",
                  loading: eventSourcesOverview.isPending,
                },
              ]
              : [
                {
                  label: "Total policies",
                  value: governanceSummary.data
                    ? String(governanceSummary.data.totalPolicies)
                    : "—",
                  detail: governanceSummary.data
                    ? `${governanceSummary.data.activePolicies} active policies`
                    : "Governance & retention",
                  tone: "brand",
                  loading: governanceSummary.isPending,
                },
                {
                  label: "Active retention",
                  value: governanceSummary.data
                    ? `${governanceSummary.data.avgRetentionDays}d avg`
                    : "—",
                  detail: "Average active retention",
                  tone: "neutral",
                  loading: governanceSummary.isPending,
                },
                {
                  label: "Cold storage",
                  value: governanceSummary.data
                    ? String(governanceSummary.data.policiesWithArchival)
                    : "—",
                  detail: "Policies with cold storage",
                  tone: "warning",
                  loading: governanceSummary.isPending,
                },
                {
                  label: "Automated purge",
                  value: governanceSummary.data
                    ? String(governanceSummary.data.policiesWithAutomatedDeletion)
                    : "—",
                  detail: "Automated disposal enabled",
                  tone: "danger",
                  loading: governanceSummary.isPending,
                },
              ]
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="border-border bg-surface inline-flex items-center gap-1 rounded-xl border p-1 shadow-xs">
          {canViewEvents ? (
            <button
              type="button"
              onClick={() => setSelectedTab("events")}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all",
                activeTab === "events"
                  ? "bg-brand text-brand-contrast font-semibold shadow-xs"
                  : "text-muted hover:bg-neutral-soft hover:text-foreground",
              )}
            >
              <Layers
                aria-hidden="true"
                className={cn(
                  "size-4",
                  activeTab === "events"
                    ? "text-brand-contrast"
                    : "text-muted",
                )}
                strokeWidth={2}
              />
              <span>Security events</span>
              {eventMetrics.data ? (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-bold transition-colors",
                    activeTab === "events"
                      ? "bg-white/20 text-brand-contrast"
                      : "border-border bg-neutral-soft text-muted border",
                  )}
                >
                  {eventMetrics.data.totalEvents}
                </span>
              ) : null}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setSelectedTab("event-sources")}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all",
              activeTab === "event-sources"
                ? "bg-brand text-brand-contrast font-semibold shadow-xs"
                : "text-muted hover:bg-neutral-soft hover:text-foreground",
            )}
          >
            <Radio
              aria-hidden="true"
              className={cn(
                "size-4",
                activeTab === "event-sources"
                  ? "text-brand-contrast"
                  : "text-muted",
              )}
              strokeWidth={2}
            />
            <span>Normalized event sources</span>
            {eventSourcesOverview.data ? (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-bold transition-colors",
                  activeTab === "event-sources"
                    ? "bg-white/20 text-brand-contrast"
                    : "border-border bg-neutral-soft text-muted border",
                )}
              >
                {totalEventSources}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setSelectedTab("governance")}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all",
              activeTab === "governance"
                ? "bg-brand text-brand-contrast font-semibold shadow-xs"
                : "text-muted hover:bg-neutral-soft hover:text-foreground",
            )}
          >
            <Shield
              aria-hidden="true"
              className={cn(
                "size-4",
                activeTab === "governance"
                  ? "text-brand-contrast"
                  : "text-muted",
              )}
              strokeWidth={2}
            />
            <span>Data governance & Retention</span>
            {governanceSummary.data ? (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-bold transition-colors",
                  activeTab === "governance"
                    ? "bg-white/20 text-brand-contrast"
                    : "border-border bg-neutral-soft text-muted border",
                )}
              >
                {governanceSummary.data.totalPolicies}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {registerEventSourceOpen ? (
        <div className="mb-6">
          <RegisterEventSourceForm
            onCancel={() => setRegisterEventSourceOpen(false)}
            onSuccess={() => setRegisterEventSourceOpen(false)}
          />
        </div>
      ) : null}

      {activeTab === "events" && canViewEvents ? (
        <NormalizedEventsList />
      ) : activeTab === "event-sources" ? (
        <EventSourcesList
          onRegisterClick={() => setRegisterEventSourceOpen(true)}
        />
      ) : (
        <EventGovernancePoliciesList />
      )}
    </>
  );
}
