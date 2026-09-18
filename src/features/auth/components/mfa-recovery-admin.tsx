"use client";

import { Check, X } from "lucide-react";
import { useRef, useState } from "react";
import { Pagination } from "@/components/data-display/pagination";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { DashboardLoadingSkeleton } from "@/components/feedback/loading-skeletons";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSessionUser } from "../hooks/use-session-user";
import {
  useDecideMfaRecoveryRequest,
  useMfaRecoveryRequests,
} from "../hooks/use-mfa-recovery";
import type {
  MfaRecoveryRequest,
  MfaRecoveryStatus,
} from "../schemas/mfa-recovery-schema";

const labels = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
} as const;

export function MfaRecoveryAdmin() {
  const session = useSessionUser();
  const allowed =
    session.data?.permissions.includes("mfa-recovery.manage") ?? false;
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<MfaRecoveryStatus>("pending");
  const requests = useMfaRecoveryRequests(
    { page, limit: 20, status },
    session.isSuccess && allowed,
  );
  const decision = useDecideMfaRecoveryRequest();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<{
    request: MfaRecoveryRequest;
    decision: "approve" | "reject";
  }>();
  const [reason, setReason] = useState("");
  const toast = useToast();

  if (session.isPending) return <DashboardLoadingSkeleton variant="table" />;
  if (!allowed)
    return (
      <EmptyState
        title="Access denied"
        description="Your account does not have the mfa-recovery.manage permission."
      />
    );
  if (requests.isPending) return <DashboardLoadingSkeleton variant="table" />;
  if (requests.isError)
    return (
      <EmptyState
        title="Unable to load recovery requests"
        description={
          requests.error instanceof Error
            ? requests.error.message
            : "Please try again."
        }
      />
    );

  const visibleRequests = requests.data.items.filter(
    (item) =>
      item.user?.id !== session.data?.id &&
      item.user?.email.trim().toLowerCase() !==
        session.data?.email.trim().toLowerCase(),
  );

  const openDecision = (
    request: MfaRecoveryRequest,
    nextDecision: "approve" | "reject",
  ) => {
    setSelected({ request, decision: nextDecision });
    setReason("");
    dialogRef.current?.showModal();
  };
  const columns: readonly DataTableColumn<MfaRecoveryRequest>[] = [
    {
      key: "user",
      header: "User",
      cell: (item) => (
        <div>
          <span className="block font-medium">
            {item.user?.fullName ?? "Unknown user"}
          </span>
          <span className="text-muted text-xs">
            {item.user?.email ?? "Unavailable"}
          </span>
        </div>
      ),
    },
    {
      key: "submitted",
      header: "Submitted",
      cell: (item) => item.submittedAt.toLocaleString(),
    },
    { key: "status", header: "Status", cell: (item) => labels[item.status] },
    {
      key: "decision",
      header: "Decision",
      cell: (item) =>
        item.decision
          ? `${item.decision.reviewer?.fullName ?? "Administrator"}: ${item.decision.reason}`
          : "—",
    },
    {
      key: "actions",
      header: "Actions",
      cell: (item) =>
        item.status === "pending" ? (
          <div className="flex gap-2">
            <Button type="button" onClick={() => openDecision(item, "approve")}>
              <Check className="size-4" aria-hidden="true" />
              Approve
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => openDecision(item, "reject")}
            >
              <X className="size-4" aria-hidden="true" />
              Reject
            </Button>
          </div>
        ) : (
          "—"
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="max-w-52">
        <label
          className="mb-1 block text-sm font-medium"
          htmlFor="recovery-status"
        >
          Status
        </label>
        <Select
          id="recovery-status"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as MfaRecoveryStatus);
            setPage(1);
          }}
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>
      </div>
      {visibleRequests.length === 0 ? (
        <EmptyState
          title={`No ${labels[status].toLowerCase()} requests`}
          description="There are no requests from other users on this page. Your own recovery requests must be reviewed by another administrator."
        />
      ) : (
        <DataTable<MfaRecoveryRequest>
          columns={columns}
          rows={visibleRequests}
          getRowKey={(item) => item.id}
        />
      )}
      <Pagination
        page={requests.data.pagination.page}
        pageCount={requests.data.pagination.totalPages}
        onPageChange={setPage}
      />
      <Dialog
        dialogRef={dialogRef}
        title={
          selected?.decision === "approve"
            ? "Approve MFA recovery"
            : "Reject MFA recovery"
        }
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!selected || reason.trim().length < 10) return;
            decision.mutate(
              {
                id: selected.request.id,
                decision: selected.decision,
                reason: reason.trim(),
              },
              {
                onSuccess: () => {
                  dialogRef.current?.close();
                  toast.success(
                    selected.decision === "approve"
                      ? "Recovery approved"
                      : "Recovery rejected",
                    "The user will be notified by email.",
                  );
                },
                onError: (error) =>
                  toast.error(
                    "Unable to process request",
                    error instanceof Error
                      ? error.message
                      : "Please try again.",
                  ),
              },
            );
          }}
        >
          <Alert>
            {selected?.decision === "approve"
              ? "Approval removes the user's existing MFA setup and revokes their refresh sessions."
              : "Rejection keeps the user's existing MFA protection enabled."}
          </Alert>
          <div>
            <label
              className="mb-1 block text-sm font-medium"
              htmlFor="decision-reason"
            >
              Reason
            </label>
            <Textarea
              id="decision-reason"
              required
              minLength={10}
              maxLength={2000}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
            <p className="text-muted mt-1 text-xs">
              Enter at least 10 characters. This decision is recorded in the
              audit log.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => dialogRef.current?.close()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={selected?.decision === "reject" ? "danger" : "primary"}
              disabled={decision.isPending || reason.trim().length < 10}
            >
              {decision.isPending
                ? "Processing..."
                : selected?.decision === "approve"
                  ? "Approve request"
                  : "Reject request"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
