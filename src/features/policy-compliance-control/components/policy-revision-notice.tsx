import { Alert } from "@/components/ui/alert";
import { TriangleAlert } from "lucide-react";
import type { OwnedPolicyDraft } from "../schemas/policy-draft-schema";

export function PolicyRevisionNotice({
  request,
}: {
  request: OwnedPolicyDraft["revisionRequest"];
}) {
  if (!request) return null;
  return (
    <Alert
      role="note"
      aria-label="Latest revision request"
      className="border-warning/40 border-l-warning bg-warning-soft text-foreground space-y-2 border-l-4"
    >
      <h3 className="flex items-start gap-2 text-sm font-semibold">
        <TriangleAlert
          aria-hidden="true"
          className="text-warning mt-0.5 size-4 shrink-0"
          strokeWidth={1.8}
        />
        Latest revision request
      </h3>
      <p className="text-sm leading-6 [overflow-wrap:anywhere] whitespace-pre-wrap">
        {request.reason ?? "No reason was recorded for this revision request."}
      </p>
      <p className="text-foreground text-xs [overflow-wrap:anywhere]">
        Requested by {request.requestedBy.name} ·{" "}
        {new Date(request.requestedAt).toLocaleString()}
      </p>
      <p className="text-foreground text-xs">
        Revise the draft to address this feedback, then submit it for review
        again.
      </p>
    </Alert>
  );
}
