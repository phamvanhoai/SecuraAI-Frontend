"use client";
import { useEffect, useRef } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
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
      className="max-h-[calc(100dvh-2rem)] w-[min(68rem,calc(100%-2rem))] overflow-y-auto"
    >
      {detail.isPending ? (
        <p className="text-muted py-12 text-center">Loading asset details…</p>
      ) : detail.isError ? (
        <Alert className="border-danger/25 bg-danger-soft text-danger">
          <strong className="block">Unable to load asset details</strong>
          <span>The asset may not exist or you may not have access.</span>
        </Alert>
      ) : asset ? (
        <div className="space-y-6">
          <p className="text-muted text-sm leading-6">
            {asset.description ?? "No description provided."}
          </p>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Fact label="Asset type" value={asset.assetType} />
            <Fact label="Criticality" value={title(asset.criticality)} />
            <Fact
              label="Data classification"
              value={title(asset.dataClassification)}
            />
            <Fact label="Status" value={title(asset.status)} />
            <Fact label="Owner" value={asset.owner?.fullName ?? "Unassigned"} />
            <Fact
              label="Business service"
              value={asset.businessService?.name ?? "Unassigned"}
            />
            <Fact
              label="Created by"
              value={asset.createdBy?.fullName ?? "Unknown"}
            />
            <Fact label="Created at" value={date(asset.createdAt)} />
            <Fact label="Last updated" value={date(asset.updatedAt)} />
            {asset.status === "archived" ? (
              <>
                <Fact label="Archived at" value={asset.archivedAt ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(asset.archivedAt)) : "Not recorded"} />
                <Fact label="Archived by" value={asset.archivedBy?.fullName ?? "Not recorded"} />
              </>
            ) : null}
          </dl>
          {asset.status === "archived" ? (
            <section className="border-border rounded-lg border p-4">
              <h3 className="font-semibold">Archive reason</h3>
              <p className="mt-2 text-sm break-words whitespace-pre-wrap">{asset.archiveReason ?? "Not recorded"}</p>
            </section>
          ) : null}
          <section className="border-border rounded-lg border p-4">
            <h3 className="font-semibold">Latest classification assessment</h3>
            {asset.classification ? (
              <div className="mt-2 space-y-2 text-sm">
                <p>
                  Method: {asset.classification.methodVersion} · Informed by
                  FIPS PUB 199 (2004), Section 3; internal extension, not a FIPS
                  category.
                </p>
                <p>
                  C: {asset.classification.confidentialityImpact} · I:{" "}
                  {asset.classification.integrityImpact} · A:{" "}
                  {asset.classification.availabilityImpact} · Business:{" "}
                  {asset.classification.businessImpact}
                </p>
                <p>
                  Assessed by{" "}
                  {asset.classification.assessedBy?.fullName ?? "Unknown"} ·{" "}
                  {new Intl.DateTimeFormat("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(asset.classification.assessedAt))}
                </p>
                <p className="break-words whitespace-pre-wrap">
                  <strong className="mb-1 block">
                    Criticality assessment basis
                  </strong>
                  {asset.classification.rationale}
                </p>
                <h4 className="font-medium">Data classification basis</h4>
                <p className="break-words whitespace-pre-wrap">
                  {asset.classification.dataClassificationBasis ??
                    "No separate data classification basis recorded. Complete it when classifying again."}
                </p>
                {asset.classification.dataClassificationMethodVersion ? (
                  <p className="text-muted text-xs">
                    {asset.classification.dataClassificationMethodVersion} ·
                    Informed by ISO/IEC 27002:2022, Control 5.12; internal
                    labels, not a compliance certification.
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-muted mt-2 text-sm">
                Initial/legacy classification. No saved impact scores or
                assessment basis. Use Classify asset to document an assessment.
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
        </div>
      ) : null}
      <div className="mt-6 flex justify-end">
        <Button variant="secondary" onClick={() => ref.current?.close()}>
          Close
        </Button>
      </div>
    </Dialog>
  );
}
function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border rounded-lg border p-3">
      <dt className="text-muted text-xs font-medium uppercase">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
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
    <section>
      <h3 className="font-semibold">{heading}</h3>
      <div className="mt-2 space-y-2">
        {items.length ? (
          items.map((item) => (
            <div key={item.key} className="border-border rounded-lg border p-3">
              <strong className="text-sm">{item.heading}</strong>
              <p className="text-muted mt-1 text-xs">{item.detail}</p>
            </div>
          ))
        ) : (
          <p className="text-muted text-sm">{empty}</p>
        )}
      </div>
    </section>
  );
}
