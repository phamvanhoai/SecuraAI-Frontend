"use client";
import { useEffect, useRef, useState } from "react";
import {
  Award,
  ArrowLeft,
  CheckCircle2,
  CircleMinus,
  XCircle,
} from "lucide-react";
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
  const confirmationHeadingRef = useRef<HTMLHeadingElement>(null);
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    headingRef.current?.focus();
  }, [enrollmentId]);
  useEffect(() => {
    if (confirming) confirmationHeadingRef.current?.focus();
  }, [confirming]);
  const issue = useIssueTrainingCertificate();
  const session = useSessionUser();
  const toast = useToast();
  const canIssue =
    session.data?.permissions.includes("training-certificates.issue") ?? false;
  const data = query.data;
  const certificate = data?.certificate;
  const requirements = data
    ? [
        {
          label: "Course completion recorded",
          met: data.requirements.courseCompleted,
          detail: data.requirements.courseCompleted
            ? "The enrollment is completed with a completion date."
            : "The employee must complete all required course work.",
        },
        {
          label: "Progress reached 100%",
          met: data.requirements.progressComplete,
          detail: data.requirements.progressComplete
            ? "All required progress has been recorded."
            : "The enrollment has not reached 100% progress.",
        },
        {
          label: data.requirements.finalAssessmentRequired
            ? "Final assessment passed"
            : "Final assessment not required",
          met:
            !data.requirements.finalAssessmentRequired ||
            data.requirements.finalAssessmentPassed === true,
          neutral: !data.requirements.finalAssessmentRequired,
          detail: data.requirements.finalAssessmentRequired
            ? data.requirements.finalAssessmentPassed
              ? "A passing result belongs to this assignment campaign."
              : "The final assessment for this assignment has not been passed."
            : "This course does not require a final assessment.",
        },
      ]
    : [];
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
            <div className="border-border rounded-lg border p-4">
              <h4 className="text-sm font-semibold">Issuance requirements</h4>
              <ul className="mt-3 space-y-3">
                {requirements.map((requirement) => {
                  const Icon = requirement.neutral
                    ? CircleMinus
                    : requirement.met
                      ? CheckCircle2
                      : XCircle;
                  return (
                    <li className="flex gap-3 text-sm" key={requirement.label}>
                      <Icon
                        aria-hidden="true"
                        className={
                          requirement.neutral
                            ? "text-muted mt-0.5 size-4 shrink-0"
                            : requirement.met
                              ? "text-success mt-0.5 size-4 shrink-0"
                              : "text-danger mt-0.5 size-4 shrink-0"
                        }
                        strokeWidth={1.8}
                      />
                      <span>
                        <span className="font-medium">{requirement.label}</span>
                        <span className="text-muted block">
                          {requirement.detail}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
          {confirming && !certificate ? (
            <div
              aria-labelledby="certificate-confirmation-title"
              className="border-warning/40 bg-warning-soft rounded-lg border p-4"
              role="alertdialog"
            >
              <h4
                className="font-semibold outline-none"
                id="certificate-confirmation-title"
                ref={confirmationHeadingRef}
                tabIndex={-1}
              >
                Confirm certificate issuance
              </h4>
              <p className="text-muted mt-1 text-sm">
                Issue a completion certificate to {data.learnerName} for{" "}
                {data.courseTitle}? The certificate becomes part of the
                employee&apos;s training record and cannot be reissued from this
                screen.
              </p>
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <Button
                  variant="secondary"
                  disabled={issue.isPending}
                  onClick={() => setConfirming(false)}
                >
                  Cancel
                </Button>
                <Button
                  disabled={issue.isPending}
                  onClick={async () => {
                    try {
                      await issue.mutateAsync(enrollmentId);
                      setConfirming(false);
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
                  {issue.isPending ? "Issuing…" : "Confirm issuance"}
                </Button>
              </div>
            </div>
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
              onClick={() => {
                setConfirming(false);
                onClose();
              }}
            >
              <ArrowLeft
                aria-hidden="true"
                className="size-4"
                strokeWidth={1.8}
              />
              Back to employees
            </Button>
            {canIssue && !certificate && !confirming ? (
              <Button
                disabled={!data.eligible || issue.isPending || query.isError}
                onClick={() => setConfirming(true)}
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
