"use client";
import { useEffect, useRef } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useCourseContent } from "../hooks/use-courses";
import type { Course } from "../schemas/course-schema";

export function CourseContentDialog({
  course,
  onClose,
}: {
  course: Course | undefined;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const content = useCourseContent(course?.id);
  useEffect(() => {
    if (course && !ref.current?.open) ref.current?.showModal();
    if (!course) ref.current?.close();
  }, [course]);
  return (
    <Dialog
      title={course ? `Course details: ${course.title}` : "Course details"}
      dialogRef={ref}
      onClose={onClose}
      className="max-h-[calc(100dvh-2rem)] w-[min(48rem,calc(100%-2rem))] overflow-y-auto"
    >
      <div className="space-y-4">
        <p className="text-muted text-sm">{course?.description}</p>
        <div>
          <h3 className="font-semibold">Learning objectives</h3>
          <p className="mt-2 text-sm break-words whitespace-pre-wrap">
            {course?.content}
          </p>
        </div>
        {content.isPending ? (
          <Skeleton className="h-64 w-full" aria-label="Loading lessons" />
        ) : content.isError ? (
          <Alert>
            Unable to load lessons.{" "}
            <Button variant="secondary" onClick={() => void content.refetch()}>
              Retry
            </Button>
          </Alert>
        ) : null}
        {content.data?.lessons.map((lesson) => (
          <section
            key={lesson.id}
            className="border-border space-y-3 rounded-lg border p-4"
          >
            <h3 className="font-semibold">
              {lesson.order}. {lesson.title}{" "}
              <span className="text-muted text-xs">
                {lesson.isRequired ? "Required" : "Optional"}
              </span>
            </h3>
            {lesson.description ? (
              <p className="text-sm whitespace-pre-wrap">
                {lesson.description}
              </p>
            ) : null}
            {lesson.materials.map((material) => (
              <div
                key={material.id}
                className="border-border space-y-2 border-t pt-3"
              >
                <h4 className="text-sm font-medium">
                  {material.title}{" "}
                  <span className="text-muted">· {material.type}</span>
                </h4>
                {material.content ? (
                  <p className="text-sm break-words whitespace-pre-wrap">
                    {material.content}
                  </p>
                ) : null}
                {material.externalUrl?.startsWith("https://") ? (
                  <a
                    className="text-brand text-sm break-all underline"
                    href={material.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open resource
                  </a>
                ) : null}
                {material.file ? (
                  <a
                    className="text-brand text-sm underline"
                    href={`/api/training/materials/${material.id}/download`}
                  >
                    Download {material.file.name}
                  </a>
                ) : null}
              </div>
            ))}
            {lesson.assessments.map((assessment, index) => (
              <p key={index} className="text-muted text-sm">
                {assessment.title}: {assessment.questionCount} questions · Pass{" "}
                {assessment.passingScore}% · {assessment.maxAttempts} attempts
              </p>
            ))}
          </section>
        ))}
        {content.data?.lessons.length === 0 ? (
          <p className="text-muted text-sm">
            This legacy course has no separate lessons.
          </p>
        ) : null}
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
