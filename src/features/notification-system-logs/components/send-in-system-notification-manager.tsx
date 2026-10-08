"use client";

import {
  BellRing,
  Check,
  Info,
  Search,
  Send,
  ShieldCheck,
  UserRound,
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
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useUsers } from "@/features/user-management-authorization";
import { ApiError } from "@/lib/api/api-error";
import { cn } from "@/lib/utils";
import { useSendInSystemNotification } from "../hooks/use-send-in-system-notification";

type AudienceMode = "roles" | "users";
type Priority = "normal" | "important" | "urgent";
type RoleCode = "ADMIN" | "SECURITY_OFFICER" | "EXECUTIVE" | "EMPLOYEE";

const roleOptions: ReadonlyArray<{ code: RoleCode; label: string }> = [
  { code: "ADMIN", label: "Administrators" },
  { code: "SECURITY_OFFICER", label: "Security Officers" },
  { code: "EXECUTIVE", label: "Executives" },
  { code: "EMPLOYEE", label: "Employees" },
];

export function SendInSystemNotificationManager() {
  const toast = useToast();
  const sendNotification = useSendInSystemNotification();
  const [audienceMode, setAudienceMode] = useState<AudienceMode>("roles");
  const [selectedRoles, setSelectedRoles] = useState<RoleCode[]>([
    "SECURITY_OFFICER",
  ]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<Priority>("important");
  const users = useUsers(
    {
      page: 1,
      limit: 20,
      status: "active",
      ...(search ? { q: search } : {}),
    },
    audienceMode === "users",
  );
  const activeUsers = useMemo(() => users.data?.items ?? [], [users.data?.items]);
  const audienceLabel = useMemo(() => {
    if (audienceMode === "roles") {
      if (!selectedRoles.length) return "No recipient groups selected";
      return roleOptions
        .filter((role) => selectedRoles.includes(role.code))
        .map((role) => role.label)
        .join(", ");
    }
    if (!selectedUsers.length) return "No individual recipients selected";
    const visibleNames = activeUsers
      .filter((user) => selectedUsers.includes(user.id))
      .map((user) => user.fullName);
    return visibleNames.length
      ? visibleNames.join(", ")
      : `${selectedUsers.length} selected user${selectedUsers.length === 1 ? "" : "s"}`;
  }, [activeUsers, audienceMode, selectedRoles, selectedUsers]);
  const hasAudience =
    audienceMode === "roles"
      ? selectedRoles.length > 0
      : selectedUsers.length > 0;
  const ready =
    title.trim().length > 0 && message.trim().length > 0 && hasAudience;

  const submit = () => {
    if (!ready || sendNotification.isPending) return;
    sendNotification.mutate(
      {
        title: title.trim(),
        message: message.trim(),
        priority: priority.toUpperCase() as
          | "NORMAL"
          | "IMPORTANT"
          | "URGENT",
        audience:
          audienceMode === "roles"
            ? {
                type: "roles",
                roles: selectedRoles,
              }
            : { type: "users", userIds: selectedUsers },
      },
      {
        onSuccess: (result) => {
          toast.success(
            "Notification sent",
            `Delivered in SecuraAI to ${result.recipientCount} active recipient${result.recipientCount === 1 ? "" : "s"}.`,
          );
          setTitle("");
          setMessage("");
          setSelectedRoles([]);
          setSelectedUsers([]);
        },
        onError: (error) => {
          toast.error(
            "Notification was not sent",
            error instanceof ApiError
              ? error.message
              : "Review the recipients and try again.",
          );
        },
      },
    );
  };

  const toggleRole = (code: RoleCode) => {
    setSelectedRoles((current) =>
      current.includes(code)
        ? current.filter((item) => item !== code)
        : [...current, code],
    );
  };
  const toggleUser = (id: string) => {
    setSelectedUsers((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.75fr)]">
      <ProductPanel
        title="Send in-system notification"
        description="Compose a message and choose who should receive it inside SecuraAI."
      >
        <div className="space-y-6 p-5 sm:p-6">
          <Alert className="border-info/25 bg-info-soft text-info">
            <div className="flex items-start gap-2">
              <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <p>
                Notifications are stored in SecuraAI and delivered to active
                recipients in the selected audience.
              </p>
            </div>
          </Alert>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold">Recipients</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <AudienceCard
                checked={audienceMode === "roles"}
                description="Send to everyone assigned to one or more roles."
                icon={UsersRound}
                label="Role groups"
                onSelect={() => setAudienceMode("roles")}
              />
              <AudienceCard
                checked={audienceMode === "users"}
                description="Select specific active user accounts."
                icon={UserRound}
                label="Individual users"
                onSelect={() => setAudienceMode("users")}
              />
            </div>
          </fieldset>

          {audienceMode === "roles" ? (
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold">
                Select role groups
              </legend>
              <div className="border-border divide-border rounded-xl border">
                {roleOptions.map((role) => (
                  <label
                    className="hover:bg-neutral-soft flex min-h-12 cursor-pointer items-center gap-3 px-4 py-3 transition-colors"
                    key={role.code}
                  >
                    <Checkbox
                      checked={selectedRoles.includes(role.code)}
                      onChange={() => toggleRole(role.code)}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">
                        {role.label}
                      </span>
                      <span className="text-muted block font-mono text-xs">
                        {role.code}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : (
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold">Select users</legend>
              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  setSearch(searchDraft.trim());
                }}
              >
                <Label
                  className="relative min-w-0 flex-1"
                  htmlFor="recipient-search"
                >
                  <span className="sr-only">Search active users</span>
                  <Search
                    aria-hidden="true"
                    className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
                  />
                  <Input
                    className="pl-9"
                    id="recipient-search"
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
                    Loading active users…
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
                      <span className="text-muted text-xs">
                        {user.department?.name ?? "No department"}
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="text-muted p-4 text-sm">
                    No active users found.
                  </p>
                )}
              </div>
            </fieldset>
          )}

          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_13rem]">
            <div className="space-y-2">
              <Label htmlFor="notification-title">Notification title</Label>
              <Input
                id="notification-title"
                maxLength={160}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Enter a concise notification title"
                value={title}
              />
              <p className="text-muted text-xs">
                {title.length}/160 characters
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notification-priority">Priority</Label>
              <Select
                id="notification-priority"
                onChange={(event) =>
                  setPriority(event.target.value as Priority)
                }
                value={priority}
              >
                <option value="normal">Normal</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent</option>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notification-message">Message</Label>
            <Textarea
              className="min-h-36"
              id="notification-message"
              maxLength={2000}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Write the message recipients will see"
              value={message}
            />
            <div className="text-muted flex justify-between gap-4 text-xs">
              <span>
                Keep the message clear and include the required action.
              </span>
              <span className="tabular-nums">{message.length}/2000</span>
            </div>
          </div>

          <div className="border-border flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted text-xs">
              Recipient membership is checked again when the notification is
              sent.
            </p>
            <div className="flex gap-2 sm:justify-end">
              <Button
                onClick={() => {
                  setTitle("");
                  setMessage("");
                  setSelectedRoles([]);
                  setSelectedUsers([]);
                }}
                type="button"
                variant="secondary"
              >
                Clear
              </Button>
              <Button
                disabled={!ready || sendNotification.isPending}
                onClick={submit}
                type="button"
              >
                {sendNotification.isPending
                  ? "Sending notification…"
                  : "Send notification"}
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
          title="Recipient summary"
          description="Confirm the intended audience before delivery."
        >
          <div className="space-y-4 p-5">
            <SummaryRow
              icon={UsersRound}
              label="Audience"
              value={audienceLabel}
            />
            <SummaryRow
              icon={ShieldCheck}
              label="Delivery scope"
              value="In-system only"
            />
            <SummaryRow
              icon={BellRing}
              label="Priority"
              value={priorityLabel(priority)}
            />
          </div>
        </ProductPanel>

        <ProductPanel title="Notification preview">
          <div className="p-5">
            <div className="border-border bg-background rounded-xl border p-4">
              <div className="flex items-start gap-3">
                <span className="bg-brand/10 text-brand grid size-10 shrink-0 place-items-center rounded-lg">
                  <BellRing
                    aria-hidden="true"
                    className="size-5"
                    strokeWidth={1.8}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-semibold break-words">
                      {title.trim() || "Notification title"}
                    </p>
                    <span
                      className={cn(
                        "rounded-md px-2 py-1 text-xs font-medium",
                        priorityTone(priority),
                      )}
                    >
                      {priorityLabel(priority)}
                    </span>
                  </div>
                  <p className="text-muted mt-2 text-sm leading-6 break-words">
                    {message.trim() ||
                      "Your notification message will appear here."}
                  </p>
                  <div className="text-muted mt-4 flex items-center gap-1.5 text-xs">
                    <Check aria-hidden="true" className="size-3.5" />
                    Sent by SecuraAI Administrator
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ProductPanel>
      </aside>
    </div>
  );
}

function AudienceCard({
  checked,
  description,
  icon: Icon,
  label,
  onSelect,
}: {
  checked: boolean;
  description: string;
  icon: typeof UsersRound;
  label: string;
  onSelect: () => void;
}) {
  return (
    <button
      aria-pressed={checked}
      className={cn(
        "focus-visible:outline-brand min-h-24 rounded-xl border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
        checked
          ? "border-brand bg-brand/5"
          : "border-border bg-surface hover:bg-neutral-soft",
      )}
      onClick={onSelect}
      type="button"
    >
      <span className="flex items-center gap-2 font-semibold">
        <Icon
          aria-hidden="true"
          className={cn("size-5", checked ? "text-brand" : "text-muted")}
          strokeWidth={1.8}
        />
        {label}
      </span>
      <span className="text-muted mt-2 block text-sm leading-5">
        {description}
      </span>
    </button>
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

function priorityLabel(priority: Priority): string {
  if (priority === "urgent") return "Urgent";
  if (priority === "important") return "Important";
  return "Normal";
}

function priorityTone(priority: Priority): string {
  if (priority === "urgent") return "bg-danger-soft text-danger";
  if (priority === "important") return "bg-warning-soft text-warning";
  return "bg-neutral-soft text-muted";
}
