"use client";

import { Award, Search, ShieldCheck } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
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
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useSessionUser } from "@/features/authentication-account";
import { useIssuedCertificates } from "../hooks/use-issued-certificates";
import type { IssuedCertificate } from "../schemas/issued-certificates-schema";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(value),
  );

export function IssuedCertificatesManager({
  sectionNavigation,
}: {
  sectionNavigation?: ReactNode;
}) {
  const session = useSessionUser();
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<IssuedCertificate>();
  const detailDialogRef = useRef<HTMLDialogElement>(null);
  const canRead =
    session.data?.permissions.includes("training-certificates.read-issued") ??
    false;
  const query = useIssuedCertificates(page, q, canRead);
  useEffect(() => {
    const dialog = detailDialogRef.current;
    if (selected && dialog && !dialog.open) dialog.showModal();
  }, [selected]);
  const columns: readonly DataTableColumn<IssuedCertificate>[] = [
    {
      key: "employee",
      header: "Employee",
      cell: (item) => (
        <span className="min-w-44">
          <strong className="block">{item.learner.name}</strong>
          <span className="text-muted block text-xs">{item.learner.email}</span>
        </span>
      ),
    },
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
      key: "issued",
      header: "Issued",
      cell: (item) => formatDate(item.issuedAt),
    },
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
          "Employee",
          "Course",
          "Certificate number",
          "Issued",
          "Actions",
        ]}
        rows={5}
        label="Loading issued certificate access"
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
        You do not have permission to view issued training certificates. Contact
        your administrator.
      </Alert>
    );

  return (
    <div className="space-y-5">
      <ProductPageHeader
        title="Issued training certificates"
        description="Review certificate records issued to employees after successful training completion."
        showSampleNotice={false}
      />
      {sectionNavigation}
      <ProductPanel
        title="Certificate records"
        description={
          query.data
            ? `${query.data.pagination.total} certificates`
            : "Certificates returned by the backend"
        }
      >
        <form
          className="border-border flex flex-wrap items-end gap-2 border-b p-4"
          onSubmit={search}
        >
          <div className="min-w-0 flex-1 sm:max-w-md">
            <label
              className="mb-1 block text-sm font-medium"
              htmlFor="issued-certificate-search"
            >
              Search certificates
            </label>
            <Input
              id="issued-certificate-search"
              maxLength={100}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Employee, course, campaign or certificate number"
              type="search"
              value={draft}
            />
          </div>
          <Button type="submit">
            <Search aria-hidden="true" className="size-4" strokeWidth={1.8} />
            Search
          </Button>
        </form>
        <div className="p-4">
          {query.isPending ? (
            <TableSkeleton
              headers={[
                "Employee",
                "Course",
                "Certificate number",
                "Issued",
                "Actions",
              ]}
              rows={5}
              label="Loading issued certificates"
            />
          ) : query.isError ? (
            <Alert>
              Unable to load issued certificates.{" "}
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
                  ? "Try another employee, course, campaign or certificate number."
                  : "Issued certificates will appear here after eligible training completion records are certified."
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
      <Dialog
        className="max-h-[calc(100dvh-2rem)] w-[min(48rem,calc(100%-2rem))] overflow-y-auto"
        dialogRef={detailDialogRef}
        onClose={() => setSelected(undefined)}
        title="Certificate details"
      >
        {selected ? (
          <div className="space-y-4">
            <section
              aria-label={`Certificate of completion for ${selected.learner.name}`}
              className="border-brand/35 bg-neutral-soft relative overflow-hidden rounded-xl border p-5 text-center sm:p-8"
            >
              <div className="border-brand/20 pointer-events-none absolute inset-2 rounded-lg border" />
              <div className="relative mx-auto flex max-w-xl flex-col items-center">
                <span className="bg-brand-soft text-brand flex size-11 items-center justify-center rounded-full">
                  <ShieldCheck
                    aria-hidden="true"
                    className="size-6"
                    strokeWidth={1.8}
                  />
                </span>
                <p className="text-muted mt-3 text-xs font-semibold tracking-[0.18em] uppercase">
                  SecuraAI Security Awareness
                </p>
                <h3 className="mt-2 text-xl font-semibold sm:text-2xl">
                  Certificate of completion
                </h3>
                <p className="text-muted mt-4 text-sm">This certifies that</p>
                <p className="mt-1 text-xl font-semibold sm:text-2xl">
                  {selected.learner.name}
                </p>
                <p className="text-muted mt-4 max-w-lg text-sm leading-6">
                  successfully completed the security awareness course
                </p>
                <p className="mt-1 text-lg font-semibold">
                  {selected.courseTitle}
                </p>
                <div className="border-border mt-6 grid w-full gap-3 border-t pt-4 text-left text-sm sm:grid-cols-3">
                  <div>
                    <span className="text-muted block text-xs">Completed</span>
                    <span className="font-medium">
                      {selected.completedAt
                        ? formatDate(selected.completedAt)
                        : "Not recorded"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block text-xs">Issued</span>
                    <span className="font-medium">
                      {formatDate(selected.issuedAt)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block text-xs">
                      Certificate no.
                    </span>
                    <span className="font-medium break-all">
                      {selected.number}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-muted">Employee email</dt>
                <dd className="break-all">{selected.learner.email}</dd>
              </div>
              <div>
                <dt className="text-muted">Employee code</dt>
                <dd>{selected.learner.employeeCode ?? "Not recorded"}</dd>
              </div>
              <div>
                <dt className="text-muted">Department</dt>
                <dd>{selected.learner.department ?? "Not assigned"}</dd>
              </div>
              <div>
                <dt className="text-muted">Campaign</dt>
                <dd>{selected.campaignTitle}</dd>
              </div>
              <div>
                <dt className="text-muted">Issued by</dt>
                <dd>{selected.issuedBy ?? "Not recorded"}</dd>
              </div>
              <div>
                <dt className="text-muted">Record type</dt>
                <dd className="inline-flex items-center gap-1.5">
                  <Award
                    aria-hidden="true"
                    className="text-brand size-4"
                    strokeWidth={1.8}
                  />
                  Certificate metadata
                </dd>
              </div>
            </dl>
            <p className="text-muted text-xs">
              This preview is rendered from the saved certificate record. A
              downloadable image or PDF has not been generated.
            </p>
            <div className="border-border flex justify-end border-t pt-4">
              <Button
                variant="secondary"
                onClick={() => detailDialogRef.current?.close()}
              >
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
