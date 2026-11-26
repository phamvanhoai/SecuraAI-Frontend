"use client";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/forms/form-field";

export const relatedIncidentErrorSchema = z.object({
  error: z.object({
    code: z.literal("INCIDENT_RELATED_REVIEW_REQUIRED"),
    details: z.object({
      items: z
        .array(
          z.object({
            id: z.uuid(),
            incidentCode: z.string(),
            title: z.string(),
            status: z.string(),
            detectedAt: z.string().datetime(),
            reason: z.string(),
          }),
        )
        .min(1)
        .max(5),
    }),
  }),
});
export type RelatedIncident = z.infer<
  typeof relatedIncidentErrorSchema
>["error"]["details"]["items"][number];

export function RelatedIncidentReview({
  items,
  pending,
  onView,
  onBack,
  onConfirm,
}: {
  items: RelatedIncident[];
  pending: boolean;
  onView: (id: string) => void;
  onBack: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const heading = useRef<HTMLParagraphElement>(null);
  useEffect(() => heading.current?.focus(), []);
  return (
    <section className="space-y-4" aria-label="Review related incidents">
      <div
        role="status"
        className="border-warning/40 bg-warning/10 rounded-lg border p-3 text-sm"
      >
        <p ref={heading} tabIndex={-1} className="font-semibold">
          Potentially related incidents found
        </p>
        <p>
          Review these incidents before creating a separate record. Similarity
          does not prove duplication.
        </p>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="border-border rounded-lg border p-3 text-sm"
          >
            <p className="font-semibold">
              {item.incidentCode} · {item.status.replaceAll("_", " ")}
            </p>
            <p>{item.title}</p>
            <p className="text-muted">
              Detected:{" "}
              <time dateTime={item.detectedAt}>
                {new Date(item.detectedAt).toLocaleString()}
              </time>
            </p>
            <p className="text-muted">{item.reason}</p>
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => onView(item.id)}
            >
              View existing incident
            </Button>
          </li>
        ))}
      </ul>
      <FormField
        id="separate-incident-reason"
        label="Why is this a separate incident?"
      >
        <Textarea
          id="separate-incident-reason"
          value={reason}
          maxLength={2000}
          onChange={(event) => setReason(event.target.value)}
          disabled={pending}
          aria-describedby="separate-incident-help"
        />
      </FormField>
      <p id="separate-incident-help" className="text-muted text-sm">
        Enter at least 10 characters. Your reason will be recorded in the audit
        log.
      </p>
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
          disabled={pending}
        >
          Back to form
        </Button>
        <Button
          type="button"
          disabled={pending || reason.trim().length < 10}
          onClick={() => onConfirm(reason.trim())}
        >
          {pending ? "Creating…" : "Create separately"}
        </Button>
      </div>
    </section>
  );
}
