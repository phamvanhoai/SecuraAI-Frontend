"use client";
import { Bell, RefreshCw, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-table";
import { Pagination } from "@/components/data-display/pagination";
import {
  ProductPanel,
  StatusBadge,
} from "@/components/data-display/static-product";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useSessionUser } from "@/features/auth";
import {
  useComplianceReminders,
  useMarkComplianceReminderRead,
} from "../hooks/use-compliance-reminders";
import type {
  ComplianceReminder,
  ComplianceReminderFilter,
} from "../schemas/compliance-reminder-schema";

export function ComplianceRemindersManager() {
  const session = useSessionUser();
  const permissions = session.data?.permissions ?? [];
  const enabled = permissions.some((permission) =>
    [
      "compliance.assess-controls",
      "compliance.evidence.upload",
      "policies.acknowledge",
    ].includes(permission),
  );
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ComplianceReminderFilter>("all");
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const reminders = useComplianceReminders(
    page,
    status,
    search,
    enabled,
    session.data?.id,
  );
  const markRead = useMarkComplianceReminderRead();
  const toast = useToast();
  async function read(id: string) {
    try {
      await markRead.mutateAsync(id);
      toast.success("Reminder marked as read");
    } catch {
      toast.error("Unable to update reminder", "Please try again.");
    }
  }
  const columns: readonly DataTableColumn<ComplianceReminder>[] = [
    {
      key: "reminder",
      header: "Reminder",
      cell: (item) => (
        <div className="max-w-2xl">
          <strong className="block">{item.title}</strong>
          <p className="text-muted mt-1 break-words">{item.message}</p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      cell: (item) =>
        item.kind === "control_review" ? "Control review" : "Evidence expiry",
    },
    {
      key: "received",
      header: "Received",
      cell: (item) => (
        <span className="whitespace-nowrap">
          {new Intl.DateTimeFormat("vi-VN", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(item.createdAt))}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (item) => (
        <StatusBadge tone={item.isRead ? "neutral" : "info"}>
          {item.isRead ? "Read" : "Unread"}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (item) => (
        <div className="flex items-center gap-2">
          <Link
            className="text-brand rounded-lg px-2 py-2 font-medium hover:underline focus-visible:outline-2"
            href="/compliance"
          >
            Open
          </Link>
          {!item.isRead ? (
            <Button
              variant="secondary"
              disabled={markRead.isPending}
              onClick={() => void read(item.notificationId)}
            >
              Mark as read
            </Button>
          ) : null}
        </div>
      ),
    },
  ];
  if (!enabled) return null;
  return (
    <ProductPanel
      title="Compliance reminders"
      description="Automatically sent before control review and evidence-validity deadlines."
    >
      <div className="border-border flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-end">
        <form
          className="flex min-w-0 flex-1 gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setSearch(draft.trim());
          }}
        >
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search compliance reminders</span>
            <Search
              aria-hidden="true"
              className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
            />
            <Input
              className="w-full pl-9"
              maxLength={100}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Search compliance reminders"
            />
          </label>
          <Button type="submit">Search</Button>
        </form>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Show
          <Select
            className="w-full font-normal lg:w-48"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value === "unread" ? "unread" : "all");
              setPage(1);
            }}
          >
            <option value="all">All reminders</option>
            <option value="unread">Unread reminders</option>
          </Select>
        </label>
        <Button
          variant="secondary"
          disabled={reminders.isFetching}
          onClick={() => void reminders.refetch()}
        >
          <RefreshCw aria-hidden="true" className="size-4" />
          Refresh
        </Button>
      </div>
      <div className="p-4">
        {reminders.isPending ? (
          <TableSkeleton
            headers={["Reminder", "Type", "Received", "Status", "Actions"]}
            rows={5}
            label="Loading compliance reminders"
          />
        ) : reminders.isError ? (
          <Alert>
            Unable to load your reminders. Check your connection and select
            Refresh to try again.
          </Alert>
        ) : reminders.data?.items.length ? (
          <DataTable
            columns={columns}
            rows={reminders.data.items}
            getRowKey={(item) => item.notificationId}
          />
        ) : (
          <div className="py-12 text-center">
            <Bell
              aria-hidden="true"
              className="text-muted mx-auto mb-3 size-6"
            />
            <p className="font-medium">
              {search
                ? "No reminders match your search"
                : status === "unread"
                  ? "No unread reminders"
                  : "No compliance reminders"}
            </p>
            <p className="text-muted mt-1 text-sm">
              {search
                ? "Try another keyword or clear the search. You can also select All reminders."
                : "Reminders appear automatically when a compliance deadline approaches."}
            </p>
            {search ? (
              <Button
                className="mt-3"
                variant="secondary"
                onClick={() => {
                  setDraft("");
                  setSearch("");
                  setPage(1);
                }}
              >
                Clear search
              </Button>
            ) : null}
          </div>
        )}
      </div>
      <div className="border-border border-t p-4">
        <Pagination
          page={page}
          pageCount={reminders.data?.pagination.totalPages ?? 1}
          onPageChange={setPage}
        />
      </div>
    </ProductPanel>
  );
}
