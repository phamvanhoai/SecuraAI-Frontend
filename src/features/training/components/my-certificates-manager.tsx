"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useState, type FormEvent } from "react";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-table";
import { Pagination } from "@/components/data-display/pagination";
import {
  ProductPageHeader,
  ProductPanel,
} from "@/components/data-display/static-product";
import { EmptyState } from "@/components/feedback/empty-state";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useSessionUser } from "@/features/authentication-account";
import { useMyCertificates } from "../hooks/use-my-certificates";
import type { MyCertificate } from "../schemas/my-certificates-schema";

const date = (value: string) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(value),
  );

export function MyCertificatesManager() {
  const session = useSessionUser();
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<MyCertificate>();
  const canRead =
    session.data?.permissions.includes("training-certificates.read-own") ??
    false;
  const query = useMyCertificates(page, q, canRead);
  const columns: readonly DataTableColumn<MyCertificate>[] = [
    {
      key: "course",
      header: "Course",
      cell: (item) => (
        <span>
          <strong className="block">{item.courseTitle}</strong>
          <span className="text-muted text-xs">{item.campaignTitle}</span>
        </span>
      ),
    },
    {
      key: "number",
      header: "Certificate number",
      cell: (item) => (
        <span className="font-medium break-all">{item.number}</span>
      ),
    },
    {
      key: "completed",
      header: "Completed",
      cell: (item) =>
        item.completedAt ? date(item.completedAt) : "Not recorded",
    },
    { key: "issued", header: "Issued", cell: (item) => date(item.issuedAt) },
    {
      key: "actions",
      header: "Actions",
      cell: (item) => (
        <Button variant="secondary" onClick={() => setSelected(item)}>
          View details
        </Button>
      ),
    },
  ];
  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setQ(draft.trim());
    setSelected(undefined);
  }
  if (session.isPending)
    return (
      <TableSkeleton
        headers={[
          "Course",
          "Certificate number",
          "Completed",
          "Issued",
          "Actions",
        ]}
        rows={5}
        label="Loading certificate access"
      />
    );
  if (session.isError)
    return (
      <Alert>
        Unable to load your access.{" "}
        <Button variant="secondary" onClick={() => void session.refetch()}>
          Retry
        </Button>
      </Alert>
    );
  if (!canRead)
    return (
      <Alert>
        You do not have permission to view your training certificates. Contact
        your administrator.
      </Alert>
    );
  return (
    <div className="space-y-5">
      <ProductPageHeader
        title="My training certificates"
        description="View certificates issued for training you completed. Certificates are recorded as metadata; a downloadable PDF is not available."
        showSampleNotice={false}
        additionalActions={
          <Link
            className="border-border bg-surface hover:bg-neutral-soft focus-visible:outline-brand inline-flex min-h-10 items-center rounded-lg border px-3.5 text-sm font-medium focus-visible:outline-2"
            href="/training"
          >
            Back to training
          </Link>
        }
      />
      <ProductPanel
        title="Issued certificates"
        description={
          query.data
            ? `${query.data.pagination.total} certificates`
            : "Certificates issued to your account"
        }
      >
        <form
          className="border-border flex flex-wrap items-end gap-2 border-b p-4"
          onSubmit={search}
        >
          <div className="min-w-0 flex-1 sm:max-w-md">
            <label
              className="mb-1 block text-sm font-medium"
              htmlFor="certificate-search"
            >
              Search certificates
            </label>
            <Input
              id="certificate-search"
              maxLength={100}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Course, campaign or certificate number"
              value={draft}
            />
          </div>
          <Button type="submit">
            <Search aria-hidden="true" className="size-4" />
            Search
          </Button>
        </form>
        <div className="p-4">
          {query.isPending ? (
            <TableSkeleton
              headers={[
                "Course",
                "Certificate number",
                "Completed",
                "Issued",
                "Actions",
              ]}
              rows={5}
              label="Loading certificates"
            />
          ) : query.isError ? (
            <Alert>
              Unable to load your certificates.{" "}
              <Button variant="secondary" onClick={() => void query.refetch()}>
                Retry
              </Button>
            </Alert>
          ) : query.data?.items.length ? (
            <DataTable
              columns={columns}
              getRowKey={(item) => item.id}
              rows={query.data.items}
            />
          ) : (
            <EmptyState
              title={
                q ? "No matching certificates" : "No certificates issued yet"
              }
              description={
                q
                  ? "Try another course, campaign or certificate number."
                  : "A certificate will appear here after a Security Officer issues it for a completed, passed course."
              }
            />
          )}
        </div>
        {query.data && query.data.pagination.total > 0 ? (
          <div className="border-border border-t p-4">
            <Pagination
              page={query.data.pagination.page}
              pageCount={query.data.pagination.totalPages}
              onPageChange={(value) => {
                setPage(value);
                setSelected(undefined);
              }}
            />
          </div>
        ) : null}
      </ProductPanel>
      {selected ? (
        <ProductPanel
          title="Certificate details"
          description={selected.courseTitle}
        >
          <dl className="grid gap-4 p-4 sm:grid-cols-2">
            <div>
              <dt className="text-muted text-sm">Certificate number</dt>
              <dd className="font-medium break-all">{selected.number}</dd>
            </div>
            <div>
              <dt className="text-muted text-sm">Campaign</dt>
              <dd>{selected.campaignTitle}</dd>
            </div>
            <div>
              <dt className="text-muted text-sm">Completed</dt>
              <dd>
                {selected.completedAt
                  ? date(selected.completedAt)
                  : "Not recorded"}
              </dd>
            </div>
            <div>
              <dt className="text-muted text-sm">Issued</dt>
              <dd>{date(selected.issuedAt)}</dd>
            </div>
            <div>
              <dt className="text-muted text-sm">Issued by</dt>
              <dd>{selected.issuedBy ?? "Not recorded"}</dd>
            </div>
          </dl>
          <div className="border-border border-t p-4">
            <Button variant="secondary" onClick={() => setSelected(undefined)}>
              Close details
            </Button>
          </div>
        </ProductPanel>
      ) : null}
    </div>
  );
}
