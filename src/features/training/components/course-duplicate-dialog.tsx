"use client";

import { useEffect, useRef, useState } from "react";
import { Copy } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { useToast } from "@/components/feedback/toast";
import { useDuplicateCourse } from "../hooks/use-courses";
import type { Course } from "../schemas/course-schema";

export function CourseDuplicateDialog({
  course,
  onClose,
}: {
  course?: Course;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState("");
  const mutation = useDuplicateCourse();
  const toast = useToast();

  useEffect(() => {
    if (!course) return;
    setTitle(`${course.title} (Copy)`.slice(0, 255));
    mutation.reset();
    ref.current?.showModal();
  }, [course]);

  const close = () => {
    ref.current?.close();
    onClose();
  };

  return (
    <Dialog
      dialogRef={ref}
      title="Duplicate security awareness course"
      onCancel={close}
    >
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Create an independent draft from <strong>{course?.title}</strong>.
          Assignments, attempts, progress, and certificates are not copied.
        </p>
        <div>
          <label
            htmlFor="duplicate-course-title"
            className="mb-1 block text-sm font-medium"
          >
            New course title
          </label>
          <Input
            id="duplicate-course-title"
            value={title}
            maxLength={255}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>
        {mutation.isError ? (
          <Alert className="border-danger text-danger">
            Unable to duplicate this course. Check the title and try again.
          </Alert>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!course || title.trim().length < 3 || mutation.isPending}
            onClick={() =>
              course &&
              mutation.mutate(
                { courseId: course.id, title: title.trim() },
                {
                  onSuccess: () => {
                    toast.success(
                      "Course duplicated",
                      "The new draft is ready to edit.",
                    );
                    close();
                  },
                },
              )
            }
          >
            <Copy className="mr-2 size-4" />
            {mutation.isPending ? "Duplicating…" : "Duplicate course"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
