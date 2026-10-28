"use client";
import { assetTypeLabel } from "../schemas/asset-type-schema";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/data-display/static-product";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAssetDetail } from "../hooks/use-asset-detail";
import {
  HardDrive,
  ShieldCheck,
  Network,
  FileText,
  Clock,
  ShieldAlert,
  ShieldOff,
  User,
  Link2,
  Shield,
  Radio,
  TriangleAlert,
  Siren,
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const date = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
        new Date(value),
      )
    : "Not set";

const title = (value: string) =>
  value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());

// ─── Tab definition ───────────────────────────────────────────────────────────

type TabId = "overview" | "classification" | "relations" | "record";

const TABS: Array<{
  id: TabId;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { strokeWidth?: number }>;
}> = [
  { id: "overview", label: "Overview", icon: HardDrive },
  { id: "classification", label: "Classification", icon: ShieldCheck },
  { id: "relations", label: "Relations", icon: Network },
  { id: "record", label: "Record", icon: FileText },
];

// ─── Main component ───────────────────────────────────────────────────────────

export function AssetDetailDialog({
  assetId,
  onClose,
}: {
  assetId: string | null;
  onClose: () => void;
}) {
  return <AssetDetailContent key={assetId} assetId={assetId} onClose={onClose} />;
}

function AssetDetailContent({
  assetId,
  onClose,
}: {
  assetId: string | null;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const detail = useAssetDetail(assetId);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  useEffect(() => {
    if (assetId) {
      ref.current?.showModal();
    } else {
      ref.current?.close();
    }
  }, [assetId]);

  const asset = detail.data;

  return (
    <Dialog
      title={asset ? `${asset.assetCode} — ${asset.name}` : "Asset details"}
      dialogRef={ref}
      onClose={onClose}
      className="max-h-[calc(100dvh-2rem)] w-[min(68rem,calc(100%-2rem))] overflow-y-auto [&>h2]:break-words"
    >
      {detail.isPending ? (
        <LoadingSkeleton />
      ) : detail.isError ? (
        <ErrorState onRetry={() => void detail.refetch()} />
      ) : asset ? (
        <div className="space-y-5">
          {/* Context bar */}
          <div className="border-border bg-neutral-soft/30 flex flex-wrap items-center gap-3 rounded-lg border p-3.5 text-xs">
            <span className="font-semibold tabular-nums">{asset.assetCode}</span>
            <span className="text-muted">·</span>
            <span className="text-muted">{assetTypeLabel(asset.assetType)}</span>
            <span className="text-muted">·</span>
            <StatusBadge tone={asset.status === "active" ? "success" : "neutral"}>
              {title(asset.status)}
            </StatusBadge>
          </div>

          {/* Tab switcher */}
          <div
            className="border-border bg-surface inline-flex w-full items-center gap-1 rounded-xl border p-1 shadow-xs sm:w-auto"
            role="tablist"
            aria-label="Asset detail views"
            onKeyDown={(event) => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              const index = TABS.findIndex((tab) => tab.id === activeTab);
              const next = event.key === "Home" ? TABS[0] : event.key === "End" ? TABS[TABS.length - 1] : TABS[(index + (event.key === "ArrowRight" ? 1 : -1) + TABS.length) % TABS.length];
              if (next) { setActiveTab(next.id); ref.current?.querySelector<HTMLButtonElement>(`#asset-detail-${next.id}-tab`)?.focus(); }
            }}
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                type="button"
                id={`asset-detail-${tab.id}-tab`}
                tabIndex={activeTab === tab.id ? 0 : -1}
                aria-selected={activeTab === tab.id}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-brand text-white shadow-xs"
                    : "text-muted hover:text-foreground",
                )}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon className="size-3.5" strokeWidth={2} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab panels */}
          {activeTab === "overview" && (
            <div role="region" aria-label="Asset overview" className="space-y-5">
              {/* Section heading */}
              <div className="flex items-start gap-2 border-b border-border pb-2">
                <HardDrive
                  className="mt-0.5 size-4 shrink-0 text-brand"
                  strokeWidth={1.8}
                />
                <h3 className="text-sm font-semibold">Asset overview</h3>
              </div>

              {/* Description */}
              <p className="text-muted max-w-prose text-sm leading-6 [overflow-wrap:anywhere] whitespace-pre-wrap">
                {asset.description ?? "No description provided."}
              </p>

              {/* Fact grid */}
              <div className="bg-neutral-soft/30 rounded-xl border border-border p-4">
                <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Fact label="Asset type" value={assetTypeLabel(asset.assetType)} />
                  <Fact
                    label="Criticality"
                    value={
                      asset.criticality === null ? "—" : title(asset.criticality)
                    }
                  />
                  <Fact
                    label="Data classification"
                    value={
                      asset.dataClassification === null
                        ? "—"
                        : title(asset.dataClassification)
                    }
                  />
                  <Fact
                    label="Status"
                    value={
                      <StatusBadge
                        tone={asset.status === "active" ? "success" : "neutral"}
                      >
                        {title(asset.status)}
                      </StatusBadge>
                    }
                  />
                  <Fact
                    label="Owner"
                    value={asset.owner?.fullName ?? "Unassigned"}
                  />
                  <Fact
                    label="Business service"
                    value={asset.businessService?.name ?? "Unassigned"}
                  />
                </dl>
              </div>
            </div>
          )}

          {activeTab === "classification" && (
            <div className="space-y-5">
              {/* Section heading */}
              <div className="flex items-start gap-2 border-b border-border pb-2">
                <ShieldCheck
                  className="mt-0.5 size-4 shrink-0 text-brand"
                  strokeWidth={1.8}
                />
                <h3 className="text-sm font-semibold">
                  Latest classification assessment
                </h3>
              </div>

              {asset.classification ? (
                <div className="space-y-4 text-sm">
                  {/* Assessed-by info bar */}
                  <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-lg border p-3.5 text-xs">
                    <User
                      className="mt-0.5 size-4 shrink-0 text-brand"
                      strokeWidth={1.8}
                    />
                    <span>
                      Assessed by{" "}
                      <span className="font-medium">
                        {asset.classification.assessedBy?.fullName ?? "Unknown"}
                      </span>{" "}
                      ·{" "}
                      {new Intl.DateTimeFormat("en-GB", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(asset.classification.assessedAt))}
                    </span>
                  </div>

                  {/* Impact scores */}
                  <div className="bg-neutral-soft/30 rounded-xl border border-border p-4">
                    <dl
                      className="grid gap-x-6 gap-y-4 sm:grid-cols-4"
                      aria-label="Impact scores"
                    >
                      <Fact
                        label="Confidentiality"
                        value={`${asset.classification.confidentialityImpact} / 5`}
                      />
                      <Fact
                        label="Integrity"
                        value={`${asset.classification.integrityImpact} / 5`}
                      />
                      <Fact
                        label="Availability"
                        value={`${asset.classification.availabilityImpact} / 5`}
                      />
                      <Fact
                        label="Business impact"
                        value={`${asset.classification.businessImpact} / 5`}
                      />
                    </dl>
                  </div>

                  {/* Rationale text blocks */}
                  <div className="grid gap-4 lg:grid-cols-2">
                    <p className="leading-6 [overflow-wrap:anywhere] whitespace-pre-wrap">
                      <strong className="mb-1 block">
                        Criticality assessment basis
                      </strong>
                      {asset.classification.rationale}
                    </p>
                    <p className="leading-6 [overflow-wrap:anywhere] whitespace-pre-wrap">
                      <strong className="mb-1 block">
                        Data classification basis
                      </strong>
                      {asset.classification.dataClassificationBasis ??
                        "No separate data classification basis recorded. Complete it when classifying again."}
                    </p>
                  </div>

                  {/* Methodology */}
                  <details className="border-border border-t pt-3">
                    <summary className="focus-visible:outline-brand cursor-pointer rounded text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4">
                      Methodology and references
                    </summary>
                    <p className="text-muted mt-3 leading-6 [overflow-wrap:anywhere]">
                      Method: {asset.classification.methodVersion} · Informed by
                      FIPS PUB 199 (2004), Section 3; internal extension, not a
                      FIPS category.
                    </p>
                    {asset.classification.dataClassificationMethodVersion ? (
                      <p className="text-muted mt-2 text-xs leading-5 [overflow-wrap:anywhere]">
                        Method:{" "}
                        {asset.classification.dataClassificationMethodVersion} ·
                        Informed by ISO/IEC 27002:2022, Control 5.12; internal
                        labels, not a compliance certification.
                      </p>
                    ) : null}
                  </details>
                </div>
              ) : (
                /* Empty state */
                <div className="border-border bg-neutral-soft/30 rounded-xl border p-6 text-center space-y-3">
                  <ShieldOff
                    className="text-muted mx-auto mb-2 size-6"
                    strokeWidth={1.5}
                  />
                  <p className="text-sm font-medium">No assessment recorded</p>
                  <p className="text-muted mt-0.5 text-xs">
                    No saved impact scores or assessment basis. Use Classify asset
                    to document an assessment.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "relations" && (
            <div className="space-y-5">
              {/* Section heading */}
              <div className="flex items-start gap-2 border-b border-border pb-2">
                <Network
                  className="mt-0.5 size-4 shrink-0 text-brand"
                  strokeWidth={1.8}
                />
                <h3 className="text-sm font-semibold">Linked entities</h3>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Collection
                  heading="Dependencies"
                  empty="No dependencies linked."
                  emptySubtitle="Link dependent assets to track relationships."
                  EmptyIcon={Link2}
                  items={asset.dependencies.map((item) => ({
                    key: item.id,
                    heading: `${item.asset.assetCode} — ${item.asset.name}`,
                    detail: `${item.type ? title(item.type) : "Dependency"} · Status: ${title(item.asset.status)}`,
                  }))}
                />
                <Collection
                  heading="Security controls"
                  empty="No controls linked."
                  emptySubtitle="Associate security controls to measure coverage."
                  EmptyIcon={Shield}
                  items={asset.controls.map((item) => ({
                    key: item.id,
                    heading: `${item.code} — ${item.name}`,
                    detail: title(item.implementationStatus),
                  }))}
                />
                <Collection
                  heading="Event sources"
                  empty="No event sources linked."
                  emptySubtitle="Attach event sources to enable log collection."
                  EmptyIcon={Radio}
                  items={asset.eventSources.map((item) => ({
                    key: item.id,
                    heading: item.name,
                    detail: `${item.sourceType} · ${title(item.status)}`,
                  }))}
                />
                <Collection
                  heading="Related risks"
                  empty="No risks linked."
                  emptySubtitle="Link risks that may affect this asset."
                  EmptyIcon={TriangleAlert}
                  items={asset.risks.map((item) => ({
                    key: item.id,
                    heading: `${item.code} — ${item.title}`,
                    detail: title(item.status),
                  }))}
                />
                <Collection
                  heading="Related incidents"
                  empty="No incidents linked."
                  emptySubtitle="Incidents involving this asset will appear here."
                  EmptyIcon={Siren}
                  items={asset.incidents.map((item) => ({
                    key: item.id,
                    heading: `${item.code} — ${item.title}`,
                    detail: `${title(item.severity)} · ${title(item.status)}`,
                  }))}
                />
              </div>
            </div>
          )}

          {activeTab === "record" && (
            <div className="space-y-5">
              {/* Section heading */}
              <div className="flex items-start gap-2 border-b border-border pb-2">
                <Clock
                  className="mt-0.5 size-4 shrink-0 text-brand"
                  strokeWidth={1.8}
                />
                <h3 className="text-sm font-semibold">Record information</h3>
              </div>

              <div className="bg-neutral-soft/30 rounded-xl border border-border p-4">
                <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Fact
                    label="Created by"
                    value={asset.createdBy?.fullName ?? "Unknown"}
                  />
                  <Fact label="Created at" value={date(asset.createdAt)} />
                  <Fact label="Last updated" value={date(asset.updatedAt)} />
                  {asset.status === "archived" ? (
                    <>
                      <Fact
                        label="Archived at"
                        value={
                          asset.archivedAt
                            ? new Intl.DateTimeFormat("en-GB", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              }).format(new Date(asset.archivedAt))
                            : "Not recorded"
                        }
                      />
                      <Fact
                        label="Archived by"
                        value={asset.archivedBy?.fullName ?? "Not recorded"}
                      />
                    </>
                  ) : null}
                </dl>
              </div>

              {asset.status === "archived" ? (
                <div>
                  <h4 className="text-sm font-medium">Archive reason</h4>
                  <p className="mt-1 text-sm leading-6 [overflow-wrap:anywhere] whitespace-pre-wrap">
                    {asset.archiveReason ?? "Not recorded"}
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      ) : null}

      {/* Footer */}
      <div className="flex items-center justify-end border-t border-border pt-4 mt-6">
        <Button variant="secondary" onClick={() => ref.current?.close()}>
          Close
        </Button>
      </div>
    </Dialog>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading asset details"
      aria-busy="true"
      className="space-y-5"
    >
      <span className="sr-only">Loading asset details…</span>
      {/* Context bar skeleton */}
      <Skeleton className="h-11 w-full rounded-lg" />
      {/* Tab switcher skeleton */}
      <Skeleton className="h-9 w-full rounded-xl sm:w-80" />
      {/* Fact grid skeleton */}
      <Skeleton className="h-6 w-40 rounded" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>
      {/* Section skeleton */}
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="border-border bg-neutral-soft/30 rounded-xl border p-6 text-center space-y-3">
      <ShieldAlert
        className="text-muted mx-auto mb-1 size-8"
        strokeWidth={1.5}
      />
      <p className="text-sm font-medium">Unable to load asset details</p>
      <p className="text-muted text-xs">
        The asset may not exist or you may not have access.
      </p>
      <Button variant="secondary" className="mt-1" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

// ─── Fact helper ──────────────────────────────────────────────────────────────

function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted text-xs font-medium uppercase tracking-wide">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium [overflow-wrap:anywhere]">
        {value}
      </dd>
    </div>
  );
}

// ─── Collection helper ────────────────────────────────────────────────────────

function Collection({
  heading,
  empty,
  emptySubtitle,
  EmptyIcon,
  items,
}: {
  heading: string;
  empty: string;
  emptySubtitle: string;
  EmptyIcon: React.ComponentType<React.SVGProps<SVGSVGElement> & { strokeWidth?: number }>;
  items: Array<{ key: string; heading: string; detail: string }>;
}) {
  return (
    <section className="border-border min-w-0 rounded-xl border">
      <div className="border-border flex items-center justify-between gap-3 border-b px-4 py-3">
        <h3 className="text-sm font-semibold">{heading}</h3>
        <span
          className="border-border bg-neutral-soft/40 inline-flex h-5 min-w-5 items-center justify-center rounded-full border px-1.5 text-xs font-medium tabular-nums"
          aria-label={`${items.length} ${heading.toLowerCase()}`}
        >
          {items.length}
        </span>
      </div>
      {items.length ? (
        <ul className="divide-border divide-y px-4">
          {items.map((item) => (
            <li key={item.key} className="py-3 [overflow-wrap:anywhere]">
              <p className="text-sm leading-6 font-medium">{item.heading}</p>
              <p className="text-muted mt-1 text-xs leading-5">{item.detail}</p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="border-border bg-neutral-soft/30 m-4 rounded-xl border p-5 text-center">
          <EmptyIcon
            className="text-muted mx-auto mb-2 size-6"
            strokeWidth={1.5}
          />
          <p className="text-sm font-medium">{empty}</p>
          <p className="text-muted mt-0.5 text-xs">{emptySubtitle}</p>
        </div>
      )}
    </section>
  );
}
