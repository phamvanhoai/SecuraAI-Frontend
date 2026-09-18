"use client";
import {
  BookOpen,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
} from "lucide-react";
import { useState } from "react";
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
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/feedback/toast";
import type { LearningItem } from "../schemas/learning-schema";
import {
  useCompleteLesson,
  useLearningDetail,
  useMyLearning,
} from "../hooks/use-learning";
import { AssessmentDialog } from "./my-assessments-manager";

export function MyLearningManager() {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string>();
  const query = useMyLearning(page);
  const columns: readonly DataTableColumn<LearningItem>[] = [
    {
      key: "course",
      header: "Assigned course",
      cell: (item) => (
        <span>
          <strong className="block">{item.course.title}</strong>
          <span className="text-muted text-xs">{item.campaignTitle}</span>
        </span>
      ),
    },
    {
      key: "due",
      header: "Due date",
      cell: (item) =>
        new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
          new Date(item.dueDate),
        ),
    },
    {
      key: "progress",
      header: "Progress",
      cell: (item) => (
        <span className="tabular-nums">{item.progressPercent}%</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (item) => (
        <StatusBadge tone={item.status === "completed" ? "success" : "neutral"}>
          {item.status.replaceAll("_", " ")}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (item) => (
        <Button className="min-h-10" onClick={() => setSelected(item.id)}>
          <BookOpen aria-hidden="true" className="size-4" />
          {item.status === "completed" ? "Review course" : "Continue learning"}
        </Button>
      ),
    },
  ];
  return (
    <>
      <ProductPageHeader
        title="My assigned training"
        description="Complete required lessons and assessments for each assignment campaign."
        showSampleNotice={false}
      />
      <ProductPanel
        title="Assigned courses"
        description={
          query.data
            ? `${query.data.pagination.total} assigned courses`
            : "Courses assigned to your account"
        }
      >
        <div className="p-4">
          {query.isPending ? (
            <TableSkeleton
              headers={[
                "Assigned course",
                "Due date",
                "Progress",
                "Status",
                "Actions",
              ]}
              label="Loading assigned courses"
              rows={5}
            />
          ) : query.isError ? (
            <Alert>
              Unable to load your assigned courses. Retry when your connection
              is available.
            </Alert>
          ) : query.data?.items.length ? (
            <DataTable
              columns={columns}
              getRowKey={(item) => item.id}
              rows={query.data.items}
            />
          ) : (
            <div className="py-12 text-center">
              <p className="font-medium">No courses assigned</p>
              <p className="text-muted mt-1 text-sm">
                Your assigned training campaigns will appear here.
              </p>
            </div>
          )}
        </div>
        {query.data ? (
          <div className="border-border border-t p-4">
            <Pagination
              page={query.data.pagination.page}
              pageCount={query.data.pagination.totalPages}
              onPageChange={setPage}
            />
          </div>
        ) : null}
      </ProductPanel>
      <LearningDialog
        enrollmentId={selected}
        onClose={() => setSelected(undefined)}
      />
    </>
  );
}

function LearningDialog({
  enrollmentId,
  onClose,
}: {
  enrollmentId: string | undefined;
  onClose: () => void;
}) {
  const detail = useLearningDetail(enrollmentId);
  const complete = useCompleteLesson();
  const toast = useToast();
  const [lessonAssessment, setLessonAssessment] = useState<string>();
  const [finalAssessmentOpen, setFinalAssessmentOpen] = useState(false);
  if (!enrollmentId) return null;
  return (
    <div
      className="bg-background fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="learning-title"
    >
      <div className="mx-auto min-h-dvh max-w-5xl px-4 py-6 sm:px-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold" id="learning-title">
              {detail.data?.course.title ?? "Assigned training"}
            </h1>
            <p className="text-muted mt-1 text-sm">
              {detail.data?.campaignTitle ?? "Loading course content…"}
            </p>
          </div>
          <Button variant="secondary" onClick={onClose}>
            Back to assigned courses
          </Button>
        </div>
        {detail.isPending ? (
          <TableSkeleton
            headers={["Lessons"]}
            label="Loading course lessons"
            rows={4}
          />
        ) : detail.isError ? (
          <Alert>Unable to load this assigned course.</Alert>
        ) : detail.data ? (
          <div className="space-y-5">
            <ProductPanel
              title="Course overview"
              description={
                detail.data.course.description ?? detail.data.course.objectives
              }
            >
              <div className="p-4">
                <div className="mb-2 flex justify-between text-sm">
                  <span>Course progress</span>
                  <strong>{detail.data.progressPercent}%</strong>
                </div>
                <div className="bg-neutral-soft h-2 rounded-full">
                  <div
                    className="bg-brand h-full rounded-full"
                    style={{ width: `${detail.data.progressPercent}%` }}
                  />
                </div>
              </div>
            </ProductPanel>
            <div className="space-y-4">
              {detail.data.course.lessons.map((lesson) => (
                <section
                  className="border-border bg-surface rounded-xl border p-4"
                  key={lesson.id}
                  aria-labelledby={`lesson-${lesson.id}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-muted text-xs">
                        Lesson {lesson.order}
                        {lesson.required ? " · Required" : " · Optional"}
                      </p>
                      <h2
                        className="mt-1 font-semibold"
                        id={`lesson-${lesson.id}`}
                      >
                        {lesson.title}
                      </h2>
                      {lesson.description ? (
                        <p className="text-muted mt-1 text-sm">
                          {lesson.description}
                        </p>
                      ) : null}
                    </div>
                    <StatusBadge
                      tone={
                        lesson.status === "completed" ? "success" : "neutral"
                      }
                    >
                      {lesson.status.replaceAll("_", " ")}
                    </StatusBadge>
                  </div>
                  <div className="mt-4 space-y-3">
                    {lesson.materials.map((material) => (
                      <article
                        className="border-border bg-neutral-soft rounded-lg border p-3"
                        key={material.id}
                      >
                        <div className="flex items-center gap-2 font-medium">
                          <FileText aria-hidden="true" className="size-4" />
                          {material.title}
                        </div>
                        {material.content ? (
                          <p className="mt-2 text-sm whitespace-pre-wrap">
                            {material.content}
                          </p>
                        ) : null}
                        {material.externalUrl ? (
                          <a
                            className="text-brand mt-2 inline-flex min-h-10 items-center gap-2 text-sm underline"
                            href={material.externalUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink
                              aria-hidden="true"
                              className="size-4"
                            />
                            Open external resource
                          </a>
                        ) : null}
                        {material.file ? (
                          <a
                            className="text-brand mt-2 inline-flex min-h-10 items-center gap-2 text-sm underline"
                            href={`/api/training/learning/${enrollmentId}/materials/${material.id}/download`}
                          >
                            <Download aria-hidden="true" className="size-4" />
                            Download {material.file.name}
                          </a>
                        ) : null}
                      </article>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                    {lesson.assessment && !lesson.assessment.passed ? (
                      <Button
                        variant="secondary"
                        onClick={() => setLessonAssessment(lesson.id)}
                      >
                        Take lesson assessment
                      </Button>
                    ) : null}
                    <Button
                      disabled={
                        lesson.status === "completed" || complete.isPending
                      }
                      onClick={async () => {
                        try {
                          const result = await complete.mutateAsync({
                            enrollmentId,
                            lessonId: lesson.id,
                          });
                          toast.success(
                            "Lesson completed",
                            result.courseCompleted
                              ? "You completed this assigned course."
                              : "Your course progress was updated.",
                          );
                        } catch {
                          toast.error(
                            "Cannot complete lesson",
                            "Finish the required lesson assessment, then try again.",
                          );
                        }
                      }}
                    >
                      <CheckCircle2 aria-hidden="true" className="size-4" />
                      {lesson.status === "completed"
                        ? "Completed"
                        : "Mark complete"}
                    </Button>
                  </div>
                </section>
              ))}
            </div>
            {detail.data.course.finalAssessment &&
            !detail.data.course.finalAssessment.passed ? (
              <Alert>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span>
                    Pass the final assessment after completing every required
                    lesson.
                  </span>
                  <Button
                    variant="secondary"
                    disabled={detail.data.course.lessons.some(
                      (lesson) =>
                        lesson.required && lesson.status !== "completed",
                    )}
                    onClick={() => setFinalAssessmentOpen(true)}
                  >
                    Take final assessment
                  </Button>
                </div>
              </Alert>
            ) : null}
          </div>
        ) : null}
      </div>
      <AssessmentDialog
        enrollmentId={lessonAssessment ? enrollmentId : undefined}
        {...(lessonAssessment ? { lessonId: lessonAssessment } : {})}
        onClose={() => setLessonAssessment(undefined)}
      />
      <AssessmentDialog
        enrollmentId={finalAssessmentOpen ? enrollmentId : undefined}
        onClose={() => setFinalAssessmentOpen(false)}
      />
    </div>
  );
}
