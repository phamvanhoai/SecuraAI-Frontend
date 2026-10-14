import { Clock3, Cpu, UserRound } from "lucide-react";
import type { AuthSessionUser } from "@/features/authentication-account";
import type { AiAlert } from "../schemas/ai-alert-schema";

export function FeedbackRecordContext({
  alert,
  analyst,
}: {
  alert: AiAlert;
  analyst: AuthSessionUser | null | undefined;
}) {
  const items = [
    {
      label: "Analyst",
      value: analyst?.fullName ?? "Signed-in analyst",
      detail: analyst?.email,
      icon: UserRound,
    },
    {
      label: "Recorded time",
      value: "Automatically on submit",
      detail: undefined,
      icon: Clock3,
    },
    {
      label: "Model version",
      value: alert.model.name,
      detail: `v${alert.model.version}`,
      icon: Cpu,
    },
  ] as const;

  return (
    <section
      aria-labelledby="feedback-record-heading"
      className="border-border bg-neutral-soft/50 rounded-lg border p-4"
    >
      <h3 id="feedback-record-heading" className="text-sm font-semibold">
        Feedback record
      </h3>
      <p className="text-muted mt-1 text-xs leading-5">
        Analyst, time, and model version are recorded automatically with your
        reason.
      </p>
      <dl className="mt-3 grid gap-3 sm:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div className="min-w-0" key={item.label}>
              <dt className="text-muted flex items-center gap-1.5 text-xs font-medium">
                <Icon aria-hidden="true" className="size-3.5 shrink-0" />
                {item.label}
              </dt>
              <dd
                className="mt-1 truncate text-sm font-medium"
                title={item.value}
              >
                {item.value}
              </dd>
              {item.detail ? (
                <dd className="text-muted truncate text-xs" title={item.detail}>
                  {item.detail}
                </dd>
              ) : null}
            </div>
          );
        })}
      </dl>
    </section>
  );
}
