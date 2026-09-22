"use client";
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Download,
  ExternalLink,
  FileText,
} from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
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
  useUpdateMaterialProgress,
} from "../hooks/use-learning";
import { AssessmentDialog } from "./my-assessments-manager";

export function MyLearningManager({
  canViewCertificates = false,
}: { canViewCertificates?: boolean } = {}) {
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
        additionalActions={
          canViewCertificates ? (
            <Link
              className="border-border bg-surface hover:bg-neutral-soft focus-visible:outline-brand inline-flex min-h-10 items-center gap-2 rounded-lg border px-3.5 text-sm font-medium focus-visible:outline-2"
              href="/training/my-certificates"
            >
              <Award aria-hidden="true" className="size-4" />
              My certificates
            </Link>
          ) : undefined
        }
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
  const updateMaterial = useUpdateMaterialProgress();
  const toast = useToast();
  const [lessonAssessment, setLessonAssessment] = useState<string>();
  const [finalAssessmentOpen, setFinalAssessmentOpen] = useState(false);
  const [activeLessonId, setActiveLessonId] = useState<string>();
  const [activeMaterialId, setActiveMaterialId] = useState<string>();
  const [watchedMaterialIds, setWatchedMaterialIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [completedMaterialIds, setCompletedMaterialIds] = useState<Set<string>>(
    () => new Set(),
  );
  const lessonProgress = detail.data?.progressPercent ?? 0;
  useEffect(() => {
    if (!detail.data) return;
    setCompletedMaterialIds(
      new Set(
        detail.data.course.lessons.flatMap((lesson) =>
          lesson.materials
            .filter((material) => material.progress?.status === "completed")
            .map((material) => material.id),
        ),
      ),
    );
    setWatchedMaterialIds(
      new Set(
        detail.data.course.lessons.flatMap((lesson) =>
          lesson.materials
            .filter(
              (material) =>
                material.type === "video" &&
                material.progress?.status === "completed",
            )
            .map((material) => material.id),
        ),
      ),
    );
    setActiveLessonId((current) =>
      current &&
      detail.data.course.lessons.some((lesson) => lesson.id === current)
        ? current
        : (detail.data.course.lessons.find(
            (lesson) => lesson.status !== "completed",
          )?.id ?? detail.data.course.lessons[0]?.id),
    );
  }, [detail.data]);
  useEffect(() => {
    const lesson = detail.data?.course.lessons.find(
      (item) => item.id === activeLessonId,
    );
    setActiveMaterialId((current) =>
      current && lesson?.materials.some((item) => item.id === current)
        ? current
        : lesson?.materials[0]?.id,
    );
  }, [activeLessonId, detail.data]);
  if (!enrollmentId) return null;
  return (
    <div
      className="bg-background fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="learning-title"
    >
      <div className="mx-auto min-h-dvh w-full max-w-[96rem] px-4 py-6 sm:px-6 lg:px-10">
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
                  <strong>{lessonProgress}%</strong>
                </div>
                <div className="bg-neutral-soft h-2 rounded-full">
                  <div
                    className="bg-brand h-full rounded-full"
                    style={{ width: `${lessonProgress}%` }}
                  />
                </div>
              </div>
            </ProductPanel>
            <div className="border-border bg-surface relative min-h-[46rem] rounded-xl border lg:block">
              {detail.data.course.lessons.map((lesson, lessonIndex) => (
                <details
                  className="group contents"
                  key={lesson.id}
                  open={lesson.id === activeLessonId}
                >
                  <summary
                    className={`border-border hover:bg-surface focus-visible:outline-brand focus-visible:outline-inset flex min-h-16 cursor-pointer list-none items-start justify-between gap-2 border-b p-3 text-sm focus-visible:outline-2 lg:w-[20rem] lg:border-r [&::-webkit-details-marker]:hidden ${lesson.id === activeLessonId ? "border-l-brand bg-brand-soft border-l-4" : "bg-neutral-soft"}`}
                    onClick={(event) => {
                      event.preventDefault();
                      setActiveLessonId(lesson.id);
                    }}
                  >
                    <div className="flex min-w-0 items-start gap-2">
                      <span className="bg-neutral-soft grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold">
                        {lesson.status === "completed" ? (
                          <CheckCircle2
                            aria-label="Lesson completed"
                            className="text-success size-5"
                          />
                        ) : (
                          lessonIndex + 1
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="text-muted text-xs">
                          Lesson {lesson.order}
                          {lesson.required ? " · Required" : " · Optional"}
                        </p>
                        <h2
                          className="mt-1 line-clamp-3 leading-5 font-semibold"
                          id={`lesson-${lesson.id}`}
                        >
                          {lesson.title}
                        </h2>
                        {lesson.description ? (
                          <p className="text-muted mt-1 line-clamp-2 text-xs">
                            {lesson.description}
                          </p>
                        ) : null}
                        {lesson.id === activeLessonId ? (
                          <div className="mt-3 space-y-1 border-t border-slate-200 pt-2">
                            {lesson.materials.map((material, materialIndex) => (
                              <button
                                className={`flex w-full items-center gap-1.5 truncate rounded px-2 py-1 text-left text-xs disabled:cursor-not-allowed disabled:opacity-50 ${material.id === activeMaterialId ? "bg-brand-soft text-brand font-medium" : "text-muted hover:bg-surface"}`}
                                key={material.id}
                                type="button"
                                disabled={lesson.materials
                                  .slice(0, materialIndex)
                                  .some(
                                    (previous) =>
                                      !completedMaterialIds.has(previous.id),
                                  )}
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  setActiveMaterialId(material.id);
                                }}
                              >
                                {lesson.status === "completed" ||
                                completedMaterialIds.has(material.id) ? (
                                  <CheckCircle2
                                    aria-label="Completed"
                                    className="text-success size-3.5 shrink-0"
                                  />
                                ) : null}
                                {material.type === "video"
                                  ? "Video"
                                  : material.file?.mimeType ===
                                      "application/pdf"
                                    ? "PDF"
                                    : material.type === "quiz"
                                      ? "Quiz"
                                      : "Reading"}{" "}
                                · {material.title}
                              </button>
                            ))}
                            {lesson.assessment ? (
                              <button
                                className={`flex w-full items-center gap-1.5 truncate rounded px-2 py-1 text-left text-xs ${activeMaterialId === `assessment:${lesson.id}` ? "bg-brand-soft text-brand font-medium" : "text-muted hover:bg-surface"}`}
                                type="button"
                                disabled={lesson.materials.some(
                                  (material) =>
                                    !completedMaterialIds.has(material.id),
                                )}
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  setActiveMaterialId(
                                    `assessment:${lesson.id}`,
                                  );
                                }}
                              >
                                {lesson.assessment.passed ? (
                                  <CheckCircle2
                                    aria-label="Completed"
                                    className="text-success size-3.5 shrink-0"
                                  />
                                ) : null}
                                Quiz · {lesson.assessment.title}
                              </button>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <span className="flex shrink-0 items-center gap-2">
                      <StatusBadge
                        tone={
                          lesson.status === "completed" ? "success" : "neutral"
                        }
                      >
                        {lesson.status === "completed"
                          ? "Completed · Review"
                          : lesson.id === activeLessonId
                            ? "Current lesson"
                            : "Not started"}
                      </StatusBadge>
                      <ChevronDown
                        aria-hidden="true"
                        className="text-muted size-4 transition-transform group-open:rotate-180"
                      />
                    </span>
                  </summary>
                  <div
                    className={`border-border min-w-0 border-b p-6 lg:absolute lg:inset-y-0 lg:right-0 lg:w-[calc(100%-20rem)] lg:overflow-y-auto ${lesson.id === activeLessonId ? "block" : "hidden"}`}
                  >
                    <div className="mt-4 space-y-3">
                      {activeMaterialId === `assessment:${lesson.id}` &&
                      lesson.assessment ? (
                        <article className="border-border bg-neutral-soft rounded-lg border p-5">
                          <div className="flex items-center gap-2 font-semibold">
                            <CheckCircle2
                              aria-hidden="true"
                              className="size-5"
                            />
                            {lesson.assessment.title}
                          </div>
                          <p className="text-muted mt-2 text-sm">
                            Complete this quiz to finish the lesson. Your
                            previous result remains available for review.
                          </p>
                          <Button
                            className="mt-4"
                            variant="secondary"
                            onClick={() => setLessonAssessment(lesson.id)}
                          >
                            {lesson.assessment.passed
                              ? "Review assessment"
                              : "Take lesson assessment"}
                          </Button>
                        </article>
                      ) : null}
                      {lesson.materials
                        .filter((material) => material.id === activeMaterialId)
                        .map((material) => (
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
                              material.type === "video" ? (
                                <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-950">
                                  <iframe
                                    className="aspect-video w-full"
                                    src={material.externalUrl}
                                    title={material.title}
                                    loading="lazy"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                  />
                                  <a
                                    className="text-brand inline-flex min-h-10 items-center gap-2 px-3 text-sm underline"
                                    href={material.externalUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    <ExternalLink
                                      aria-hidden="true"
                                      className="size-4"
                                    />
                                    Open video in a new tab
                                  </a>
                                  <button
                                    className="text-brand inline-flex min-h-10 px-3 text-sm font-medium"
                                    type="button"
                                    onClick={() =>
                                      setWatchedMaterialIds((current) =>
                                        new Set(current).add(material.id),
                                      )
                                    }
                                  >
                                    I finished watching this video
                                  </button>
                                </div>
                              ) : (
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
                              )
                            ) : null}
                            {material.file ? (
                              <a
                                className="text-brand mt-2 inline-flex min-h-10 items-center gap-2 text-sm underline"
                                href={`/api/training/learning/${enrollmentId}/materials/${material.id}/download`}
                              >
                                <Download
                                  aria-hidden="true"
                                  className="size-4"
                                />
                                Download {material.file.name}
                              </a>
                            ) : null}
                          </article>
                        ))}
                    </div>
                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                      {lesson.assessment &&
                      activeMaterialId === `assessment:${lesson.id}` &&
                      !lesson.assessment.passed ? (
                        <>
                          <p className="text-muted mr-auto self-center text-xs">
                            Complete the lesson assessment before marking this
                            lesson complete.
                          </p>
                          <Button
                            variant="secondary"
                            onClick={() => setLessonAssessment(lesson.id)}
                          >
                            Take lesson assessment
                          </Button>
                        </>
                      ) : null}
                      {activeMaterialId !== `assessment:${lesson.id}` ? (
                        <Button
                          disabled={
                            lesson.status === "completed" ||
                            complete.isPending ||
                            updateMaterial.isPending ||
                            Boolean(
                              lesson.materials.find(
                                (material) => material.id === activeMaterialId,
                              )?.type === "video" &&
                              activeMaterialId &&
                              !watchedMaterialIds.has(activeMaterialId),
                            ) ||
                            Boolean(
                              activeMaterialId &&
                              completedMaterialIds.has(activeMaterialId) &&
                              !(
                                lesson.materials.every((material) =>
                                  completedMaterialIds.has(material.id),
                                ) &&
                                (!lesson.assessment || lesson.assessment.passed)
                              ),
                            )
                          }
                          onClick={async () => {
                            if (
                              activeMaterialId &&
                              !completedMaterialIds.has(activeMaterialId)
                            ) {
                              await updateMaterial.mutateAsync({
                                enrollmentId,
                                materialId: activeMaterialId,
                                status: "completed",
                              });
                              setCompletedMaterialIds((current) =>
                                new Set(current).add(activeMaterialId),
                              );
                              const materialIndex = lesson.materials.findIndex(
                                (material) => material.id === activeMaterialId,
                              );
                              const nextMaterial =
                                lesson.materials[materialIndex + 1];
                              if (nextMaterial) {
                                setActiveMaterialId(nextMaterial.id);
                              }
                              toast.success(
                                "Section completed",
                                nextMaterial
                                  ? "Continue with the next section."
                                  : "Complete the lesson assessment to finish this lesson.",
                              );
                              return;
                            }
                            const allSectionsCompleted = lesson.materials.every(
                              (material) =>
                                completedMaterialIds.has(material.id),
                            );
                            if (
                              !allSectionsCompleted ||
                              (lesson.assessment && !lesson.assessment.passed)
                            ) {
                              toast.info(
                                "Lesson is not ready",
                                "Complete every section and pass the lesson assessment first.",
                              );
                              return;
                            }
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
                            : activeMaterialId &&
                                completedMaterialIds.has(activeMaterialId)
                              ? lesson.materials.every((material) =>
                                  completedMaterialIds.has(material.id),
                                ) &&
                                (!lesson.assessment || lesson.assessment.passed)
                                ? "Finish lesson"
                                : "Section completed"
                              : "Mark section complete"}
                        </Button>
                      ) : null}
                    </div>
                    <div className="border-border mt-4 flex items-center justify-between border-t pt-4">
                      <Button
                        variant="secondary"
                        disabled={
                          lesson.materials.findIndex(
                            (material) => material.id === activeMaterialId,
                          ) <= 0 && lessonIndex === 0
                        }
                        onClick={() => {
                          if (activeMaterialId === `assessment:${lesson.id}`) {
                            setActiveMaterialId(lesson.materials.at(-1)?.id);
                            return;
                          }
                          const materialIndex = lesson.materials.findIndex(
                            (material) => material.id === activeMaterialId,
                          );
                          if (materialIndex > 0) {
                            setActiveMaterialId(
                              lesson.materials[materialIndex - 1]?.id,
                            );
                            return;
                          }
                          const previousLesson =
                            detail.data.course.lessons[lessonIndex - 1];
                          if (previousLesson) {
                            setActiveLessonId(previousLesson.id);
                            setActiveMaterialId(
                              previousLesson.materials.at(-1)?.id,
                            );
                          }
                        }}
                      >
                        Previous section
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={
                          activeMaterialId !== `assessment:${lesson.id}` &&
                          (!activeMaterialId ||
                            !completedMaterialIds.has(activeMaterialId) ||
                            (lesson.materials.findIndex(
                              (material) => material.id === activeMaterialId,
                            ) ===
                              lesson.materials.length - 1 &&
                              !lesson.assessment &&
                              lessonIndex ===
                                detail.data.course.lessons.length - 1))
                        }
                        onClick={() => {
                          if (activeMaterialId === `assessment:${lesson.id}`) {
                            const nextLesson =
                              detail.data.course.lessons[lessonIndex + 1];
                            if (nextLesson) {
                              setActiveLessonId(nextLesson.id);
                              setActiveMaterialId(nextLesson.materials[0]?.id);
                            }
                            return;
                          }
                          const materialIndex = lesson.materials.findIndex(
                            (material) => material.id === activeMaterialId,
                          );
                          if (materialIndex < lesson.materials.length - 1) {
                            setActiveMaterialId(
                              lesson.materials[materialIndex + 1]?.id,
                            );
                            return;
                          }
                          if (lesson.assessment) {
                            setActiveMaterialId(`assessment:${lesson.id}`);
                            return;
                          }
                          const nextLesson =
                            detail.data.course.lessons[lessonIndex + 1];
                          if (nextLesson) {
                            setActiveLessonId(nextLesson.id);
                            setActiveMaterialId(nextLesson.materials[0]?.id);
                          }
                        }}
                      >
                        {activeMaterialId === `assessment:${lesson.id}`
                          ? "Next lesson"
                          : lesson.materials.findIndex(
                                (material) => material.id === activeMaterialId,
                              ) <
                              lesson.materials.length - 1
                            ? "Next section"
                            : lesson.assessment
                              ? "Next section"
                              : "Next lesson"}
                      </Button>
                    </div>
                  </div>
                </details>
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
