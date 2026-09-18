"use client";

import { Bell, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-table";
import { Pagination } from "@/components/data-display/pagination";
import {
  MetricStrip,
  ProductPageHeader,
  ProductPanel,
  StatusBadge,
} from "@/components/data-display/static-product";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useSessionUser } from "@/features/auth";
import {
  useMarkTrainingReminderRead,
  useTrainingReminders,
} from "../hooks/use-reminders";
import type {
  ReminderFilter,
  TrainingReminder,
} from "../schemas/reminder-schema";

export function TrainingRemindersManager({
  showHeader = true,
}: {
  showHeader?: boolean;
}) {
  const session = useSessionUser();
  const enabled =
    session.data?.permissions.includes("training-assessments.take") ?? false;
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ReminderFilter>("all");
  const [statusDraft, setStatusDraft] = useState<ReminderFilter>("all");
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const reminders = useTrainingReminders(
    page,
    status,
    enabled,
    session.data?.id,
    search,
  );
  const markRead = useMarkTrainingReminderRead();
  const toast = useToast();
  async function read(notificationId: string) {
    try {
      await markRead.mutateAsync(notificationId);
      if (status === "unread") setPage(1);
      toast.success("Reminder marked as read");
    } catch {
      toast.error(
        "Unable to update reminder",
        "Try again. Your reminder has not been removed.",
      );
    }
  }
  const columns: readonly DataTableColumn<TrainingReminder>[] = [
    {
      key: "reminder",
      header: "Reminder",
      cell: (item) => (
        <div className="max-w-2xl">
          <strong className="block">{item.title}</strong>
          <p className="text-muted mt-1 text-sm break-words">{item.message}</p>
        </div>
      ),
    },
    {
      key: "received",
      header: "Received",
      cell: (item) => (
        <span className="whitespace-nowrap">
          {new Intl.DateTimeFormat("en-US", {
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
        <div className="flex flex-wrap items-center gap-2">
          <Link
            className="text-brand rounded-lg px-2 py-2 text-sm font-medium underline-offset-4 hover:underline focus-visible:outline-2"
            href="/training"
          >
            Open training
          </Link>
          {!item.isRead && (
            <Button
              variant="secondary"
              disabled={markRead.isPending}
              onClick={() => void read(item.notificationId)}
            >
              Mark as read
            </Button>
          )}
        </div>
      ),
    },
  ];
  return (
    <>
      {showHeader ? (
        <ProductPageHeader
          title="Notifications"
          description="Deadline reminders for your assigned training courses. Other notification types are not available here yet."
          showSampleNotice={false}
        />
      ) : null}
      {session.isError ? (
        <Alert>
          Unable to check your session. Refresh the page and try again.
        </Alert>
      ) : !session.isPending && !enabled ? (
        <Alert>
          Training deadline reminders are available to accounts with permission
          to take assigned assessments.
        </Alert>
      ) : (
        <>
          <MetricStrip
            ariaLabel="Training reminder summary"
            metrics={[
              {
                label: "Reminders",
                value: String(reminders.data?.summary.total ?? 0),
                detail: "Assigned to your account",
                loading: session.isPending || reminders.isPending,
              },
              {
                label: "Unread",
                value: String(reminders.data?.summary.unread ?? 0),
                detail: "Require your attention",
                tone: reminders.data?.summary.unread ? "warning" : "neutral",
                loading: session.isPending || reminders.isPending,
              },
              {
                label: "Matching",
                value: String(reminders.data?.pagination.total ?? 0),
                detail:
                  search || status !== "all"
                    ? "Current search and filter"
                    : "Current view",
                loading: session.isPending || reminders.isPending,
              },
            ]}
          />
          <ProductPanel
            title="Training deadline reminders"
            description="Automatically sent before the deadline while your assigned training is incomplete."
          >
            <form
              className="border-border flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-end"
              onSubmit={(event) => {
                event.preventDefault();
                setPage(1);
                setSearch(searchDraft.trim());
                setStatus(statusDraft);
              }}
            >
              <div className="flex min-w-0 flex-1 gap-2">
                <label className="relative min-w-0 flex-1">
                  <span className="sr-only">Search training reminders</span>
                  <Search
                    aria-hidden="true"
                    className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
                    strokeWidth={1.8}
                  />
                  <Input
                    className="w-full pl-9"
                    type="search"
                    maxLength={100}
                    placeholder="Search courses or reminders"
                    value={searchDraft}
                    onChange={(event) => setSearchDraft(event.target.value)}
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1 text-sm font-medium">
                Show
                <Select
                  className="w-full font-normal lg:w-48"
                  value={statusDraft}
                  onChange={(event) => {
                    setStatusDraft(
                      event.target.value === "unread" ? "unread" : "all",
                    );
                  }}
                >
                  <option value="all">All reminders</option>
                  <option value="unread">Unread reminders</option>
                </Select>
              </label>
              <Button type="submit" disabled={session.isPending}>
                Search
              </Button>
            </form>
            <div className="p-4">
              {session.isPending || reminders.isPending ? (
                <TableSkeleton
                  headers={["Reminder", "Received", "Status", "Actions"]}
                  rows={5}
                  label="Loading training deadline reminders"
                />
              ) : reminders.isError ? (
                <Alert>
                  Unable to load your reminders. Check your connection and try
                  again.{" "}
                  <Button
                    variant="secondary"
                    onClick={() => void reminders.refetch()}
                  >
                    Retry
                  </Button>
                </Alert>
              ) : !reminders.data?.items.length ? (
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
                        : "No training deadline reminders"}
                  </p>
                  <p className="text-muted mt-1 text-sm">
                    {search
                      ? "Try another keyword or clear the search. You can also select All reminders."
                      : "Reminders appear automatically near the deadline for incomplete assigned training."}
                  </p>
                  {search && (
                    <Button
                      className="mt-3"
                      variant="secondary"
                      onClick={() => {
                        setSearchDraft("");
                        setSearch("");
                        setPage(1);
                      }}
                    >
                      Clear search
                    </Button>
                  )}
                  <Link
                    className="text-brand mt-3 inline-block rounded-lg p-2 text-sm font-medium hover:underline focus-visible:outline-2"
                    href="/training"
                  >
                    View my training
                  </Link>
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  rows={reminders.data.items}
                  getRowKey={(item) => item.notificationId}
                />
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
        </>
      )}
    </>
  );
}
