"use client";
import { useEffect, useRef } from "react";
import { Award, ArrowLeft } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/feedback/toast";
import { useSessionUser } from "@/features/auth";
import {
  useIssueTrainingCertificate,
  useTrainingCertificate,
} from "../hooks/use-certificate";

export function TrainingCertificatePanel({
  enrollmentId,
  onClose,
}: {
  enrollmentId: string;
  onClose: () => void;
}) {
  const query = useTrainingCertificate(enrollmentId);
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, [enrollmentId]);
  const issue = useIssueTrainingCertificate();
  const session = useSessionUser();
  const toast = useToast();
  const canIssue =
    session.data?.permissions.includes("training-certificates.issue") ?? false;
  const data = query.data;
  const certificate = data?.certificate;
  return (
    <section
      className="border-border mb-4 space-y-4 rounded-lg border p-4 [overflow-wrap:anywhere]"
      aria-label="Training completion certificate"
      aria-busy={query.isPending || issue.isPending}
    >
      <h3 ref={headingRef} tabIndex={-1} className="font-semibold outline-none">
        Training completion certificate
      </h3>
      {query.isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : null}
      {query.isError ? (
        <Alert>
          Unable to load the certificate.{" "}
          <Button variant="secondary" onClick={() => void query.refetch()}>
            Retry
          </Button>
        </Alert>
      ) : null}
      {data ? (
        <>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Employee</dt>
              <dd>{data.learnerName}</dd>
            </div>
            <div>
              <dt className="text-muted">Course</dt>
              <dd>{data.courseTitle}</dd>
            </div>
            <div>
              <dt className="text-muted">Campaign</dt>
              <dd>{data.campaignTitle}</dd>
            </div>
            <div>
              <dt className="text-muted">Completed</dt>
              <dd>
                {data.completedAt
                  ? new Date(data.completedAt).toLocaleDateString("en-US")
                  : "Not completed"}
              </dd>
            </div>
            {certificate ? (
              <>
                <div>
                  <dt className="text-muted">Certificate number</dt>
                  <dd className="break-words">{certificate.number}</dd>
                </div>
                <div>
                  <dt className="text-muted">Issued</dt>
                  <dd>
                    {new Date(certificate.issuedAt).toLocaleDateString("en-US")}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Issued by</dt>
                  <dd>{certificate.issuedBy ?? "Not recorded"}</dd>
                </div>
              </>
            ) : null}
          </dl>
          {!certificate ? (
            <p className="text-muted text-sm">
              {data.eligible
                ? "This employee is eligible. Issue a certificate to record completion."
                : "Not eligible: the course must be completed with 100% progress and a passed assessment."}
            </p>
          ) : null}
          {issue.isError ? (
            <Alert>
              Unable to issue the certificate. Refresh the details and try
              again.
            </Alert>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="secondary"
              disabled={issue.isPending}
              onClick={onClose}
            >
              <ArrowLeft
                aria-hidden="true"
                className="size-4"
                strokeWidth={1.8}
              />
              Back to employees
            </Button>
            {canIssue && !certificate ? (
              <Button
                disabled={!data.eligible || issue.isPending || query.isError}
                onClick={async () => {
                  try {
                    await issue.mutateAsync(enrollmentId);
                    toast.success(
                      "Certificate issued",
                      "The completion certificate has been saved.",
                    );
                  } catch {
                    /* Persistent inline error is supplied by the mutation state. */
                  }
                }}
              >
                <Award
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.8}
                />
                {issue.isPending ? "Issuing…" : "Issue certificate"}
              </Button>
            ) : null}
          </div>
        </>
      ) : (
        <Button variant="secondary" onClick={onClose}>
          Back to employees
        </Button>
      )}
    </section>
  );
}
