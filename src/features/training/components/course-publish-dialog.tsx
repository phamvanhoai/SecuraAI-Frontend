"use client";

import { Send } from "lucide-react";
import { useEffect, useRef } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/feedback/toast";
import { usePublishCourse } from "../hooks/use-courses";
import type { Course } from "../schemas/course-schema";

export function CoursePublishDialog({
  course,
  onClose,
}: {
  course: Course | undefined;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mutation = usePublishCourse();
  const toast = useToast();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (course && dialog && !dialog.open) dialog.showModal();
  }, [course]);

  return (
    <Dialog
      dialogRef={dialogRef}
      onClose={() => {
        mutation.reset();
        onClose();
      }}
      title={course ? `Publish ${course.title}` : "Publish course"}
    >
      {course ? (
        <div className="space-y-4">
          <p className="text-muted text-sm leading-6">
            Publishing makes this course available for assignment. The draft can
            no longer be edited after publication.
          </p>
          <div className="border-border bg-neutral-soft rounded-lg border p-4 text-sm">
            <p className="font-medium">Before publishing, confirm that:</p>
            <ul className="text-muted mt-2 list-disc space-y-1 pl-5">
              <li>The course contains at least one lesson.</li>
              <li>Every lesson contains training material.</li>
              <li>Questions and correct answers have been reviewed.</li>
            </ul>
          </div>
          {mutation.isError ? (
            <Alert>
              Unable to publish this course. Complete all lessons and materials,
              then try again.
            </Alert>
          ) : null}
          <div className="border-border flex flex-wrap justify-end gap-2 border-t pt-4">
            <Button
              disabled={mutation.isPending}
              onClick={() => dialogRef.current?.close()}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              disabled={mutation.isPending}
              onClick={async () => {
                try {
                  await mutation.mutateAsync(course.id);
                  toast.success(
                    "Course published",
                    `${course.title} is ready to assign.`,
                  );
                  dialogRef.current?.close();
                } catch {
                  // Persistent recovery guidance is shown above.
                }
              }}
            >
              <Send aria-hidden="true" className="size-4" strokeWidth={1.8} />
              {mutation.isPending ? "Publishing…" : "Publish course"}
            </Button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
