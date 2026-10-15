"use client";

import {
  CheckCircle2,
  Clock3,
  Info,
  Mail,
  Search,
  Send,
  UsersRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { ProductPanel } from "@/components/data-display/static-product";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUsers } from "@/features/user-management-authorization";
import { ApiError } from "@/lib/api/api-error";
import { useSendEmailNotification } from "../hooks/use-send-email-notification";

export function SendEmailNotificationManager() {
  const toast = useToast();
  const sendEmail = useSendEmailNotification();
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const users = useUsers({
    page: 1,
    limit: 20,
    status: "active",
    ...(search ? { q: search } : {}),
  });
  const activeUsers = useMemo(() => users.data?.items ?? [], [users.data?.items]);
  const selectedVisibleUsers = useMemo(
    () => activeUsers.filter((user) => selectedUsers.includes(user.id)),
    [activeUsers, selectedUsers],
  );
  const ready =
    selectedUsers.length > 0 &&
    subject.trim().length > 0 &&
    message.trim().length > 0;

  const toggleUser = (id: string) => {
    setSelectedUsers((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const submit = () => {
    if (!ready || sendEmail.isPending) return;
    sendEmail.mutate(
      { subject: subject.trim(), message: message.trim(), userIds: selectedUsers },
      {
        onSuccess: (result) => {
          if (result.sentCount === 0) {
            toast.error(
              "Email delivery failed",
              "No emails were sent. Verify the recipient address and SMTP configuration, then try again.",
            );
          } else if (result.failedCount > 0) {
            toast.warning(
              "Email delivery partially completed",
              `${result.sentCount} sent and ${result.failedCount} failed. Delivery statuses were recorded.`,
            );
          } else {
            toast.success(
              "Email notification sent",
              `Sent to ${result.sentCount} recipient${result.sentCount === 1 ? "" : "s"}.`,
            );
          }
          setSelectedUsers([]);
          setSubject("");
          setMessage("");
        },
        onError: (error) => {
          toast.error(
            "Email notification was not sent",
            error instanceof ApiError
              ? error.message
              : "Review the recipients and try again.",
          );
        },
      },
    );
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.75fr)]">
      <ProductPanel
        title="Send email notification"
        description="Compose an email and select active SecuraAI users as recipients."
      >
        <div className="space-y-6 p-5 sm:p-6">
          <Alert className="border-info/25 bg-info-soft text-info">
            <div className="flex items-start gap-2">
              <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <p>
                Email is sent through the configured SecuraAI SMTP service.
                Delivery status is recorded separately for every recipient.
              </p>
            </div>
          </Alert>

          <fieldset className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <legend className="text-sm font-semibold">
                Email recipients
              </legend>
              <span className="text-muted text-xs tabular-nums">
                {selectedUsers.length} selected
              </span>
            </div>
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                setSearch(searchDraft.trim());
              }}
            >
              <Label
                className="relative min-w-0 flex-1"
                htmlFor="email-recipient-search"
              >
                <span className="sr-only">Search active users</span>
                <Search
                  aria-hidden="true"
                  className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
                />
                <Input
                  className="pl-9"
                  id="email-recipient-search"
                  maxLength={100}
                  onChange={(event) => setSearchDraft(event.target.value)}
                  placeholder="Search by name or email"
                  value={searchDraft}
                />
              </Label>
              <Button type="submit" variant="secondary">
                Search
              </Button>
            </form>
            <div className="border-border max-h-64 overflow-y-auto rounded-xl border">
              {users.isPending ? (
                <p className="text-muted p-4 text-sm">
                  Loading active users...
                </p>
              ) : users.isError ? (
                <p className="text-danger p-4 text-sm">
                  Unable to load active users. Check the backend connection.
                </p>
              ) : activeUsers.length ? (
                activeUsers.map((user) => (
                  <label
                    className="border-border hover:bg-neutral-soft flex min-h-12 cursor-pointer items-center gap-3 border-b px-4 py-3 last:border-b-0"
                    key={user.id}
                  >
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleUser(user.id)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {user.fullName}
                      </span>
                      <span className="text-muted block truncate text-xs">
                        {user.email}
                      </span>
                    </span>
                    <span className="text-muted hidden text-xs sm:block">
                      {user.department?.name ?? "No department"}
                    </span>
                  </label>
                ))
              ) : (
                <p className="text-muted p-4 text-sm">No active users found.</p>
              )}
            </div>
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor="email-subject">Subject</Label>
            <Input
              id="email-subject"
              maxLength={160}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Enter a concise email subject"
              value={subject}
            />
            <p className="text-muted text-xs">
              {subject.length}/160 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-message">Email message</Label>
            <Textarea
              className="min-h-44"
              id="email-message"
              maxLength={4000}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Write the email recipients will receive"
              value={message}
            />
            <div className="text-muted flex justify-between gap-4 text-xs">
              <span>
                Do not include credentials or sensitive incident details.
              </span>
              <span className="tabular-nums">{message.length}/4000</span>
            </div>
          </div>

          <div className="border-border flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted text-xs">
              Up to 20 active users can receive one email at a time.
            </p>
            <div className="flex gap-2 sm:justify-end">
              <Button
                onClick={() => {
                  setSelectedUsers([]);
                  setSubject("");
                  setMessage("");
                }}
                type="button"
                variant="secondary"
              >
                Clear
              </Button>
              <Button
                disabled={!ready || sendEmail.isPending}
                onClick={submit}
                type="button"
              >
                {sendEmail.isPending ? "Sending email…" : "Send email"}
                <Send
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.8}
                />
              </Button>
            </div>
          </div>
        </div>
      </ProductPanel>

      <aside className="space-y-5">
        <ProductPanel
          title="Delivery summary"
          description="Review recipients and current delivery state."
        >
          <div className="space-y-4 p-5">
            <SummaryRow
              icon={UsersRound}
              label="Recipients"
              value={`${selectedUsers.length} active user${selectedUsers.length === 1 ? "" : "s"}`}
            />
            <SummaryRow icon={Mail} label="Channel" value="Email" />
            <SummaryRow
              icon={Clock3}
              label="Delivery status"
              value="Not sent"
            />
          </div>
        </ProductPanel>

        <ProductPanel title="Email preview">
          <div className="p-5">
            <div className="border-border bg-background overflow-hidden rounded-xl border">
              <div className="bg-neutral-soft border-border border-b px-4 py-3">
                <p className="text-muted text-xs font-medium tracking-wide uppercase">
                  To
                </p>
                <p className="mt-1 truncate text-sm">
                  {selectedVisibleUsers.length
                    ? selectedVisibleUsers.map((user) => user.email).join(", ")
                    : selectedUsers.length
                      ? `${selectedUsers.length} selected recipients`
                      : "No recipients selected"}
                </p>
              </div>
              <div className="space-y-4 p-4">
                <div className="flex items-center gap-2">
                  <span className="bg-brand/10 text-brand grid size-9 place-items-center rounded-lg">
                    <Mail
                      aria-hidden="true"
                      className="size-4"
                      strokeWidth={1.8}
                    />
                  </span>
                  <span className="text-sm font-semibold">
                    SecuraAI notification
                  </span>
                </div>
                <div>
                  <p className="font-semibold break-words">
                    {subject.trim() || "Email subject"}
                  </p>
                  <p className="text-muted mt-3 text-sm leading-6 break-words whitespace-pre-wrap">
                    {message.trim() || "Your email message will appear here."}
                  </p>
                </div>
                <div className="border-border text-muted flex items-center gap-1.5 border-t pt-3 text-xs">
                  <CheckCircle2 aria-hidden="true" className="size-3.5" />
                  Prepared by a SecuraAI Administrator
                </div>
              </div>
            </div>
          </div>
        </ProductPanel>
      </aside>
    </div>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UsersRound;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon
        aria-hidden="true"
        className="text-muted mt-0.5 size-4 shrink-0"
        strokeWidth={1.8}
      />
      <div className="min-w-0">
        <p className="text-muted text-xs font-medium tracking-wide uppercase">
          {label}
        </p>
        <p className="mt-1 text-sm font-medium break-words">{value}</p>
      </div>
    </div>
  );
}
