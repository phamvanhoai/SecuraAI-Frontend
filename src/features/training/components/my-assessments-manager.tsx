"use client";

import { ArrowLeft, Bell, ClipboardCheck, Eye, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-table";
import { Pagination } from "@/components/data-display/pagination";
import {
  ProductPageHeader,
  ProductPanel,
  StatusBadge,
} from "@/components/data-display/static-product";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { TableSkeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/api-error";
import {
  useAssessmentDetail,
  useMyAssessments,
  useSubmitAssessment,
} from "../hooks/use-assessments";
import type {
  AssignedAssessment,
  AssessmentSubmission,
} from "../schemas/assessment-schema";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(value),
  );

export function MyAssessmentsManager({ onBack }: { onBack?: () => void }) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string>();
  const assessments = useMyAssessments(page, true);
  const columns: readonly DataTableColumn<AssignedAssessment>[] = [
    {
      key: "course",
      header: "Assigned course",
      cell: (item) => (
        <span>
          <strong className="block">{item.courseTitle}</strong>
          <span className="text-muted text-xs">{item.campaignTitle}</span>
        </span>
      ),
    },
    {
      key: "assessment",
      header: "Assessment",
      cell: (item) => item.assessment.title,
    },
    {
      key: "due",
      header: "Due date",
      cell: (item) => formatDate(item.dueDate),
    },
    {
      key: "status",
      header: "Status",
      cell: (item) => {
        const labels = {
          available: "Available",
          upcoming: "Upcoming",
          overdue: "Overdue",
          passed: "Passed",
          attempts_exhausted: "Attempts exhausted",
        } as const;
        return (
          <StatusBadge
            tone={
              item.assessment.availability === "available" ||
              item.assessment.availability === "passed"
                ? "success"
                : item.assessment.availability === "overdue" ||
                    item.assessment.availability === "attempts_exhausted"
                  ? "danger"
                  : "neutral"
            }
          >
            {labels[item.assessment.availability]}
          </StatusBadge>
        );
      },
    },
    {
      key: "result",
      header: "Result",
      cell: (item) =>
        item.assessment.latestScore === null ? (
          <StatusBadge tone="neutral">Not attempted</StatusBadge>
        ) : (
          <StatusBadge tone={item.assessment.passed ? "success" : "warning"}>
            {item.assessment.latestScore}% ·{" "}
            {item.assessment.passed ? "Passed" : "Try again"}
          </StatusBadge>
        ),
    },
    {
      key: "attempts",
      header: "Attempts",
      cell: (item) =>
        `${item.assessment.attemptsUsed} of ${item.assessment.maxAttempts}`,
    },
    {
      key: "actions",
      header: "Actions",
      cell: (item) => {
        const isAvailable = item.assessment.availability === "available";
        const isRetake = isAvailable && item.assessment.attemptsUsed > 0;
        return (
          <Button
            className="min-h-10 px-3"
            variant={isAvailable ? "primary" : "secondary"}
            onClick={() => setSelectedEnrollmentId(item.enrollmentId)}
          >
            {isAvailable ? (
              isRetake ? (
                <RotateCcw
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.8}
                />
              ) : (
                <ClipboardCheck
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.8}
                />
              )
            ) : (
              <Eye aria-hidden="true" className="size-4" strokeWidth={1.8} />
            )}
            {isAvailable
              ? isRetake
                ? "Retake"
                : "Take assessment"
              : "View details"}
          </Button>
        );
      },
    },
  ];

  return (
    <>
      <ProductPageHeader
        title="My training assessments"
        {...(onBack
          ? {
              additionalActions: (
                <Button variant="secondary" onClick={onBack}>
                  <ArrowLeft
                    aria-hidden="true"
                    className="size-4"
                    strokeWidth={1.8}
                  />
                  Back to training
                </Button>
              ),
            }
          : {})}
        secondaryAction="Deadline reminders"
        secondaryActionIcon={<Bell aria-hidden="true" className="size-4" />}
        onSecondaryAction={() => router.push("/notifications")}
        description="Complete the post-training assessment for courses assigned to you. Answers are scored securely after submission."
        showSampleNotice={false}
      />
      <ProductPanel
        title="Assigned assessments"
        description={
          assessments.data
            ? `${assessments.data.pagination.total} assigned assessments`
            : "Assessments assigned to your account"
        }
      >
        <div className="p-4">
          {assessments.isPending ? (
            <TableSkeleton
              headers={[
                "Assigned course",
                "Assessment",
                "Due date",
                "Status",
                "Result",
                "Attempts",
                "Actions",
              ]}
              label="Loading assigned assessments"
              rows={5}
            />
          ) : assessments.isError ? (
            <Alert>
              Unable to load your assessments. Check your connection and try
              again.
            </Alert>
          ) : assessments.data?.items.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-medium">No assessments assigned</p>
              <p className="text-muted mt-1 text-sm">
                An assessment will appear here when a course with a quiz is
                assigned to you.
              </p>
            </div>
          ) : assessments.data ? (
            <DataTable
              columns={columns}
              getRowKey={(item) => item.enrollmentId}
              rows={assessments.data.items}
            />
          ) : null}
        </div>
        {assessments.data ? (
          <div className="border-border border-t p-4">
            <Pagination
              onPageChange={setPage}
              page={assessments.data.pagination.page}
              pageCount={assessments.data.pagination.totalPages}
            />
          </div>
        ) : null}
      </ProductPanel>
      <AssessmentDialog
        enrollmentId={selectedEnrollmentId}
        onClose={() => setSelectedEnrollmentId(undefined)}
      />
    </>
  );
}

function AssessmentDialog({
  enrollmentId,
  onClose,
}: {
  enrollmentId: string | undefined;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const toast = useToast();
  const detail = useAssessmentDetail(enrollmentId);
  const submission = useSubmitAssessment();
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<AssessmentSubmission>();
  const [validationMessage, setValidationMessage] = useState("");
  const [stage, setStage] = useState<"instructions" | "questions" | "confirm">(
    "instructions",
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (enrollmentId && dialog && !dialog.open) dialog.showModal();
  }, [enrollmentId]);

  const close = () => {
    if (
      stage === "questions" &&
      Object.values(answers).some((optionIds) => optionIds.length > 0) &&
      !window.confirm(
        "Exit this assessment? Your selected answers will not be saved.",
      )
    ) {
      return;
    }
    dialogRef.current?.close();
    setAnswers({});
    setResult(undefined);
    setValidationMessage("");
    setStage("instructions");
    submission.reset();
    onClose();
  };

  const submit = async () => {
    if (!enrollmentId || !detail.data) return;
    const questions = detail.data.assessment.questions;
    if (questions.some((question) => !answers[question.id]?.length)) {
      setValidationMessage("Answer every question before submitting.");
      return;
    }
    setValidationMessage("");
    try {
      const nextResult = await submission.mutateAsync({
        enrollmentId,
        answers: questions.flatMap((question) => {
          const optionIds = answers[question.id];
          return optionIds?.length
            ? [{ questionId: question.id, optionIds }]
            : [];
        }),
      });
      setResult(nextResult);
      toast.success(
        "Assessment submitted",
        `Your score is ${nextResult.score}%.`,
      );
    } catch (error: unknown) {
      toast.error(
        "Submission failed",
        error instanceof ApiError
          ? error.message
          : "Your answers were not saved. Review them and try again.",
      );
    }
  };

  return (
    <Dialog
      className="max-h-[calc(100dvh-2rem)] w-[min(46rem,calc(100%-2rem))] overflow-y-auto"
      dialogRef={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClose={() => {
        if (enrollmentId) onClose();
      }}
      title={detail.data?.assessment.title ?? "Post-training assessment"}
    >
      {detail.isPending ? (
        <div
          aria-label="Loading assessment"
          className="space-y-4"
          role="status"
        >
          <div className="bg-neutral-soft h-16 animate-pulse rounded-lg" />
          <div className="bg-neutral-soft h-36 animate-pulse rounded-lg" />
          <div className="bg-neutral-soft h-36 animate-pulse rounded-lg" />
        </div>
      ) : detail.isError ? (
        <>
          <Alert>Unable to load this assessment.</Alert>
          <div className="mt-5 flex justify-end">
            <Button variant="secondary" onClick={close}>
              Close
            </Button>
          </div>
        </>
      ) : result ? (
        <div>
          <div className="border-border bg-neutral-soft rounded-lg border p-5 text-center">
            <p className="text-muted text-sm">Your score</p>
            <p className="mt-1 text-4xl font-semibold">{result.score}%</p>
            <StatusBadge tone={result.passed ? "success" : "warning"}>
              {result.passed ? "Passed" : "Not passed"}
            </StatusBadge>
            <p className="text-muted mt-3 text-sm">
              Passing score: {result.passingScore}% · Attempt{" "}
              {result.attemptsUsed} of {result.maxAttempts}
            </p>
            <p className="text-muted mt-1 text-sm">
              {result.correctCount} of {result.totalQuestions} questions correct
            </p>
          </div>
          <div className="mt-5 flex justify-end">
            <Button onClick={close}>Done</Button>
          </div>
        </div>
      ) : detail.data && stage === "instructions" ? (
        <div>
          <div className="border-border bg-neutral-soft rounded-lg border p-4 text-sm leading-6">
            <strong className="block text-base">
              {detail.data.courseTitle}
            </strong>
            <p className="text-muted mt-1">
              Answer every question. Multiple-choice questions may have more
              than one correct answer.
            </p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-3">
              <div>
                <dt className="text-muted text-xs">Questions</dt>
                <dd className="font-semibold">
                  {detail.data.assessment.questions.length}
                </dd>
              </div>
              <div>
                <dt className="text-muted text-xs">Passing score</dt>
                <dd className="font-semibold">
                  {detail.data.assessment.passingScore}%
                </dd>
              </div>
              <div>
                <dt className="text-muted text-xs">Attempts remaining</dt>
                <dd className="font-semibold">
                  {Math.max(
                    0,
                    detail.data.assessment.maxAttempts -
                      detail.data.assessment.attemptsUsed,
                  )}
                </dd>
              </div>
            </dl>
          </div>
          {detail.data.assessment.attempts.length > 0 ? (
            <section aria-labelledby="attempt-history" className="mt-5">
              <h3 className="text-sm font-semibold" id="attempt-history">
                Attempt history
              </h3>
              <div className="border-border mt-2 overflow-hidden rounded-lg border">
                {detail.data.assessment.attempts.map((attempt, index) => (
                  <div
                    className="border-border flex items-center justify-between border-t px-4 py-3 first:border-t-0"
                    key={attempt.id}
                  >
                    <span className="text-sm">
                      Attempt {detail.data.assessment.attempts.length - index}
                    </span>
                    <span className="text-sm font-semibold">
                      {attempt.score ?? 0}% ·{" "}
                      {attempt.passed ? "Passed" : "Not passed"}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
          {detail.data.assessment.availability !== "available" ? (
            <Alert className="mt-5">
              {detail.data.assessment.availability === "upcoming"
                ? "This assessment is not open yet."
                : null}
              {detail.data.assessment.availability === "overdue"
                ? "The due date for this assessment has passed."
                : null}
              {detail.data.assessment.availability === "passed"
                ? "You have already passed this assessment."
                : null}
              {detail.data.assessment.availability === "attempts_exhausted"
                ? "You have used all available attempts."
                : null}
            </Alert>
          ) : null}
          <div className="mt-6 flex justify-end gap-2">
            <Button onClick={close} variant="secondary">
              Close
            </Button>
            {detail.data.assessment.availability === "available" ? (
              <Button onClick={() => setStage("questions")}>
                Start assessment
              </Button>
            ) : null}
          </div>
        </div>
      ) : detail.data && stage === "confirm" ? (
        <div>
          <Alert>
            You answered all {detail.data.assessment.questions.length}{" "}
            questions. Submitting will use one attempt and cannot be undone.
          </Alert>
          <div className="mt-6 flex justify-end gap-2">
            <Button
              disabled={submission.isPending}
              onClick={() => setStage("questions")}
              variant="secondary"
            >
              Review answers
            </Button>
            <Button
              disabled={submission.isPending}
              onClick={() => void submit()}
            >
              {submission.isPending ? "Submitting…" : "Confirm submission"}
            </Button>
          </div>
        </div>
      ) : detail.data ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const unanswered = detail.data.assessment.questions.some(
              (question) => !answers[question.id]?.length,
            );
            if (unanswered) {
              setValidationMessage("Answer every question before submitting.");
              return;
            }
            setValidationMessage("");
            setStage("confirm");
          }}
        >
          <div className="border-border bg-neutral-soft mb-5 rounded-lg border p-4 text-sm">
            <strong className="block">{detail.data.courseTitle}</strong>
            <span className="text-muted">
              Passing score {detail.data.assessment.passingScore}% ·{" "}
              {detail.data.assessment.maxAttempts -
                detail.data.assessment.attemptsUsed}{" "}
              attempts remaining
            </span>
          </div>
          <div aria-live="polite" className="mb-5">
            <div className="mb-2 flex justify-between gap-3 text-xs">
              <span>Assessment progress</span>
              <span>
                {
                  detail.data.assessment.questions.filter(
                    (question) => answers[question.id]?.length,
                  ).length
                }{" "}
                of {detail.data.assessment.questions.length} answered
              </span>
            </div>
            <div className="bg-neutral-soft h-2 overflow-hidden rounded-full">
              <div
                className="bg-brand h-full transition-[width]"
                style={{
                  width: `${(detail.data.assessment.questions.filter((question) => answers[question.id]?.length).length / detail.data.assessment.questions.length) * 100}%`,
                }}
              />
            </div>
          </div>
          <div className="space-y-5">
            {detail.data.assessment.questions.map((question, index) => (
              <fieldset
                className="border-border rounded-lg border p-4"
                key={question.id}
              >
                <legend className="px-1 text-sm font-semibold">
                  {index + 1}. {question.text}
                </legend>
                <div className="mt-3 space-y-2">
                  {question.options.map((option) => (
                    <label
                      className="border-border hover:bg-neutral-soft flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm"
                      key={option.id}
                    >
                      <input
                        checked={
                          answers[question.id]?.includes(option.id) ?? false
                        }
                        className="accent-brand size-4"
                        name={question.id}
                        onChange={(event) =>
                          setAnswers((current) => {
                            if (question.type !== "multiple_choice") {
                              return { ...current, [question.id]: [option.id] };
                            }
                            const selected = current[question.id] ?? [];
                            return {
                              ...current,
                              [question.id]: event.target.checked
                                ? [...selected, option.id]
                                : selected.filter((id) => id !== option.id),
                            };
                          })
                        }
                        type={
                          question.type === "multiple_choice"
                            ? "checkbox"
                            : "radio"
                        }
                        value={option.id}
                      />
                      {option.text}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
          {validationMessage ? (
            <Alert className="mt-4">{validationMessage}</Alert>
          ) : null}
          <div className="mt-6 flex justify-end gap-2">
            <Button
              disabled={submission.isPending}
              onClick={close}
              variant="secondary"
            >
              Exit assessment
            </Button>
            <Button disabled={submission.isPending} type="submit">
              Review submission
            </Button>
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}
