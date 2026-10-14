"use client";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { StatusBadge } from "@/components/data-display/static-product";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAssetDetail } from "../hooks/use-asset-detail";
const date = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
        new Date(value),
      )
    : "Not set";
const title = (value: string) =>
  value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
export function AssetDetailDialog({
  assetId,
  onClose,
}: {
  assetId: string | null;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const detail = useAssetDetail(assetId);
  useEffect(() => {
    if (assetId) ref.current?.showModal();
    else ref.current?.close();
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
        <div
          role="status"
          aria-label="Loading asset details"
          aria-busy="true"
          className="space-y-5"
        >
          <span className="sr-only">Loading asset details…</span>
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className="h-16" />
            ))}
          </div>
          <Skeleton className="h-40 w-full" />
        </div>
      ) : detail.isError ? (
        <Alert className="border-danger/25 bg-danger-soft text-danger">
          <strong className="block">Unable to load asset details</strong>
          <span>The asset may not exist or you may not have access.</span>
          <Button
            variant="secondary"
            className="mt-3"
            onClick={() => void detail.refetch()}
          >
            Try again
          </Button>
        </Alert>
      ) : asset ? (
        <div className="space-y-6">
          <p className="text-muted max-w-prose text-sm leading-6 [overflow-wrap:anywhere] whitespace-pre-wrap">
            {asset.description ?? "No description provided."}
          </p>
          <section
            aria-label="Asset overview"
            className="border-border bg-neutral-soft/40 rounded-lg border p-4"
          >
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
              <Fact label="Asset type" value={asset.assetType} />
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
          </section>
          <section className="border-border rounded-lg border p-4">
            <h3 className="font-semibold">Latest classification assessment</h3>
            {asset.classification ? (
              <div className="mt-3 space-y-4 text-sm">
                <p className="text-muted">
                  Assessed by{" "}
                  {asset.classification.assessedBy?.fullName ?? "Unknown"} ·{" "}
                  {new Intl.DateTimeFormat("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(asset.classification.assessedAt))}
                </p>
                <dl
                  className="bg-neutral-soft/40 grid grid-cols-2 gap-4 rounded-lg p-3 sm:grid-cols-4"
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
                    <p className="text-muted text-xs">
                      {asset.classification.dataClassificationMethodVersion} ·
                      Informed by ISO/IEC 27002:2022, Control 5.12; internal
                      labels, not a compliance certification.
                    </p>
                  ) : null}
                </details>
              </div>
            ) : (
              <p className="text-muted mt-2 text-sm">
                No saved impact scores or assessment basis. Use Classify asset
                to document an assessment.
              </p>
            )}
          </section>
          <div className="grid gap-5 lg:grid-cols-2">
            <Collection
              heading="Dependencies"
              empty="No dependencies linked."
              items={asset.dependencies.map((item) => ({
                key: item.id,
                heading: `${item.asset.assetCode} — ${item.asset.name}`,
                detail: `${item.type ? title(item.type) : "Dependency"} · Status: ${title(item.asset.status)}`,
              }))}
            />
            <Collection
              heading="Security controls"
              empty="No controls linked."
              items={asset.controls.map((item) => ({
                key: item.id,
                heading: `${item.code} — ${item.name}`,
                detail: title(item.implementationStatus),
              }))}
            />
            <Collection
              heading="Event sources"
              empty="No event sources linked."
              items={asset.eventSources.map((item) => ({
                key: item.id,
                heading: item.name,
                detail: `${item.sourceType} · ${title(item.status)}`,
              }))}
            />
            <Collection
              heading="Related risks"
              empty="No risks linked."
              items={asset.risks.map((item) => ({
                key: item.id,
                heading: `${item.code} — ${item.title}`,
                detail: title(item.status),
              }))}
            />
            <Collection
              heading="Related incidents"
              empty="No incidents linked."
              items={asset.incidents.map((item) => ({
                key: item.id,
                heading: `${item.code} — ${item.title}`,
                detail: `${title(item.severity)} · ${title(item.status)}`,
              }))}
            />
          </div>
          <section
            className="border-border border-t pt-4"
            aria-label="Record information"
          >
            <h3 className="font-semibold">Record information</h3>
            <dl className="mt-3 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
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
            {asset.status === "archived" ? (
              <div className="mt-4">
                <h4 className="text-sm font-medium">Archive reason</h4>
                <p className="mt-1 text-sm leading-6 [overflow-wrap:anywhere] whitespace-pre-wrap">
                  {asset.archiveReason ?? "Not recorded"}
                </p>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
      <div className="border-border mt-6 flex justify-end border-t pt-4">
        <Button variant="secondary" onClick={() => ref.current?.close()}>
          Close
        </Button>
      </div>
    </Dialog>
  );
}
function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted text-xs font-medium">{label}</dt>
      <dd className="mt-1 text-sm font-medium [overflow-wrap:anywhere]">
        {value}
      </dd>
    </div>
  );
}
function Collection({
  heading,
  empty,
  items,
}: {
  heading: string;
  empty: string;
  items: Array<{ key: string; heading: string; detail: string }>;
}) {
  return (
    <section className="border-border min-w-0 rounded-lg border">
      <div className="border-border flex items-center justify-between gap-3 border-b px-4 py-3">
        <h3 className="text-sm font-semibold">{heading}</h3>
        <span
          className="text-muted text-xs tabular-nums"
          aria-label={`${items.length} ${heading.toLowerCase()}`}
        >
          {items.length}
        </span>
      </div>
      <div className="px-4">
        {items.length ? (
          <ul className="divide-border divide-y">
            {items.map((item) => (
              <li key={item.key} className="py-3 [overflow-wrap:anywhere]">
                <p className="text-sm leading-6 font-medium">{item.heading}</p>
                <p className="text-muted mt-1 text-xs leading-5">
                  {item.detail}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted py-4 text-sm">{empty}</p>
        )}
      </div>
    </section>
  );
}
