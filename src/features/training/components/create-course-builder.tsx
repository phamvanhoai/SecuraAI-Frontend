"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionUser } from "@/features/auth";
import { useToast } from "@/components/feedback/toast";
import {
  ProductPageHeader,
  ProductPanel,
} from "@/components/data-display/static-product";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { FormField } from "@/components/forms/form-field";
import { ApiError } from "@/lib/api/api-error";
import {
  useCourseDraft,
  useCreateCourse,
  useUpdateCourseDraft,
} from "../hooks/use-courses";
import {
  createCourseSchema,
  type CourseLesson,
  type CourseMaterial,
  type CreateCourseInput,
} from "../schemas/course-schema";
import {
  CourseAssessmentEditor,
  newAssessment,
} from "./course-assessment-editor";

const newLesson = (): CourseLesson => ({
  title: "",
  description: "",
  isRequired: true,
  materials: [{ title: "", type: "text", content: "" }],
});
const initial = (): CreateCourseInput => ({
  title: "",
  description: "",
  content: "",
  status: "draft",
  lessons: [newLesson()],
});

export function CreateCourseBuilder({ courseId }: { courseId?: string } = {}) {
  const session = useSessionUser();
  const router = useRouter();
  const toast = useToast();
  const createMutation = useCreateCourse();
  const updateMutation = useUpdateCourseDraft();
  const draft = useCourseDraft(courseId);
  const isEditing = Boolean(courseId);
  const isPending = createMutation.isPending || updateMutation.isPending;
  const [value, setValue] = useState(initial);
  const [files, setFiles] = useState<Record<string, File>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string>();
  const [dirty, setDirty] = useState(false);
  const loadedDraftId = useRef<string | undefined>(undefined);
  const summary = useRef<HTMLDivElement>(null);
  const lessons = value.lessons ?? [];
  const change = (next: CreateCourseInput) => {
    setValue(next);
    setDirty(true);
  };
  useEffect(() => {
    if (!courseId || !draft.data || loadedDraftId.current === courseId) return;
    loadedDraftId.current = courseId;
    setValue({
      title: draft.data.title,
      description: draft.data.description ?? "",
      content: draft.data.content,
      status: "draft",
      lessons: draft.data.lessons,
      ...(draft.data.assessment ? { assessment: draft.data.assessment } : {}),
    });
    setFiles({});
    setErrors({});
    setDirty(false);
  }, [courseId, draft.data]);
  const patchLesson = (index: number, patch: Partial<CourseLesson>) =>
    change({
      ...value,
      lessons: lessons.map((lesson, i) =>
        i === index ? { ...lesson, ...patch } : lesson,
      ),
    });
  const patchMaterial = (
    lessonIndex: number,
    index: number,
    material: CourseMaterial,
  ) => {
    const lesson = lessons[lessonIndex];
    if (lesson)
      patchLesson(lessonIndex, {
        materials: lesson.materials.map((item, i) =>
          i === index ? material : item,
        ),
      });
  };
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const cancel = () => {
    if (
      !isPending &&
      (!dirty || window.confirm("Discard this unsaved course?"))
    )
      router.push("/training");
  };

  const submit = async () => {
    if (isPending) return;
    if (courseId && !draft.data) return;
    setMessage(undefined);
    const parsed = createCourseSchema.safeParse(value);
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [
            issue.path.join("."),
            issue.message,
          ]),
        ),
      );
      requestAnimationFrame(() => summary.current?.focus());
      return;
    }
    setErrors({});
    const fileErrors: Record<string, string> = {};
    for (const [lessonIndex, lesson] of lessons.entries())
      for (const [materialIndex, material] of lesson.materials.entries()) {
        if (material.uploadKey && !files[material.uploadKey])
          fileErrors[
            `lessons.${lessonIndex}.materials.${materialIndex}.content`
          ] = "Select a file for this material.";
      }
    if (Object.keys(fileErrors).length) {
      setErrors(fileErrors);
      requestAnimationFrame(() => summary.current?.focus());
      return;
    }
    try {
      if (courseId && draft.data)
        await updateMutation.mutateAsync({
          courseId,
          input: {
            title: parsed.data.title,
            description: parsed.data.description,
            content: parsed.data.content,
            lessons: parsed.data.lessons ?? [],
            ...(parsed.data.assessment
              ? { assessment: parsed.data.assessment }
              : {}),
            expectedUpdatedAt: draft.data.updatedAt,
          },
          files,
        });
      else await createMutation.mutateAsync({ ...parsed.data, files });
      setDirty(false);
      toast.success(
        isEditing ? "Course draft updated" : "Course draft created",
        isEditing
          ? "Your lesson, material and assessment changes were saved."
          : "Your lessons and assessments were saved. Publication is a separate step.",
      );
      router.push("/training");
    } catch (error: unknown) {
      setMessage(
        error instanceof ApiError && error.status === 409
          ? "This draft changed or is no longer editable. Your form has been kept. Return to courses and reopen the draft before saving."
          : `Unable to ${isEditing ? "update" : "create"} the course. Check the connection, file types and file sizes, then try again. Your form has been kept.`,
      );
    }
  };

  if (session.isPending)
    return (
      <Skeleton
        className="h-96 w-full"
        aria-label="Loading course permissions"
      />
    );
  if (session.isError)
    return (
      <Alert>
        Unable to load your permissions. Reload the page and try again.
      </Alert>
    );
  if (
    !session.data?.permissions.includes(
      isEditing ? "training-courses.update" : "training-courses.create",
    )
  )
    return (
      <Alert>
        You do not have permission to {isEditing ? "edit" : "create"} training
        courses.
      </Alert>
    );
  if (isEditing && draft.isPending)
    return (
      <Skeleton className="h-96 w-full" aria-label="Loading course draft" />
    );
  if (isEditing && (draft.isError || !draft.data))
    return (
      <Alert>
        Unable to load this draft. It may have been published, assigned, or
        removed.{" "}
        <Button variant="secondary" onClick={() => router.push("/training")}>
          Back to courses
        </Button>
      </Alert>
    );

  return (
    <div className="space-y-6">
      <ProductPageHeader
        title={
          isEditing
            ? "Edit security awareness course draft"
            : "Create security awareness course"
        }
        description={
          isEditing
            ? "Update the draft's ordered lessons, materials and assessments. Published or assigned courses remain immutable."
            : "Prepare a draft with ordered lessons and optional assessments. Files are uploaded only when you create the draft."
        }
      />
      <form
        noValidate
        onBlur={(event) => {
          const id = event.target.id;
          if (!id || isPending) return;
          const checked = createCourseSchema.safeParse(value);
          const issue = checked.success
            ? undefined
            : checked.error.issues.find((item) => item.path.join(".") === id);
          setErrors((current) => {
            const next = { ...current };
            if (issue) next[id] = issue.message;
            else delete next[id];
            return next;
          });
        }}
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        className="space-y-6"
      >
        {Object.keys(errors).length ? (
          <div
            ref={summary}
            tabIndex={-1}
            role="alert"
            className="border-danger/25 bg-danger-soft text-danger rounded-lg border p-4"
          >
            <p className="font-semibold">Review the highlighted fields</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {Object.entries(errors).map(([key, error]) => (
                <li key={key}>
                  <a
                    className="underline"
                    href={`#${key}`}
                    onClick={() => document.getElementById(key)?.focus()}
                  >
                    {key}: {error}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {message ? <Alert role="alert">{message}</Alert> : null}
        <fieldset disabled={isPending} className="space-y-6">
          <ProductPanel
            title="Course information"
            description="This course is saved as a draft, not assigned to employees."
          >
            <div className="space-y-4 p-4">
              <FormField id="title" label="Course title *" error={errors.title}>
                <Input
                  id="title"
                  maxLength={255}
                  value={value.title}
                  onChange={(e) => change({ ...value, title: e.target.value })}
                />
              </FormField>
              <FormField
                id="description"
                label="Description (optional)"
                error={errors.description}
              >
                <Textarea
                  id="description"
                  maxLength={2000}
                  rows={3}
                  value={value.description}
                  onChange={(e) =>
                    change({ ...value, description: e.target.value })
                  }
                />
              </FormField>
              <FormField
                id="content"
                label="Learning objectives *"
                error={errors.content}
              >
                <Textarea
                  id="content"
                  maxLength={50000}
                  rows={4}
                  value={value.content}
                  onChange={(e) =>
                    change({ ...value, content: e.target.value })
                  }
                />
              </FormField>
            </div>
          </ProductPanel>
          <ProductPanel
            title="Lessons"
            description="Employees complete required lessons. Use Move up/down to set the learning order."
          >
            <div className="space-y-4 p-4">
              {lessons.map((lesson, lessonIndex) => {
                const prefix = `lessons.${lessonIndex}`;
                return (
                  <fieldset
                    key={lessonIndex}
                    className="border-border min-w-0 space-y-4 rounded-lg border p-4"
                  >
                    <legend className="px-1 font-semibold">
                      Lesson {lessonIndex + 1}
                    </legend>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={lessonIndex === 0}
                        onClick={() => {
                          const next = [...lessons];
                          const prior = next[lessonIndex - 1];
                          if (prior) {
                            next[lessonIndex - 1] = lesson;
                            next[lessonIndex] = prior;
                            change({ ...value, lessons: next });
                          }
                        }}
                      >
                        Move up
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={lessonIndex === lessons.length - 1}
                        onClick={() => {
                          const next = [...lessons];
                          const following = next[lessonIndex + 1];
                          if (following) {
                            next[lessonIndex + 1] = lesson;
                            next[lessonIndex] = following;
                            change({ ...value, lessons: next });
                          }
                        }}
                      >
                        Move down
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={lessons.length <= 1}
                        onClick={() => {
                          if (
                            window.confirm(
                              "Remove this lesson and its materials?",
                            )
                          )
                            change({
                              ...value,
                              lessons: lessons.filter(
                                (_, i) => i !== lessonIndex,
                              ),
                            });
                        }}
                      >
                        Remove lesson
                      </Button>
                    </div>
                    <FormField
                      id={`${prefix}.title`}
                      label="Lesson title *"
                      error={errors[`${prefix}.title`]}
                    >
                      <Input
                        id={`${prefix}.title`}
                        maxLength={255}
                        value={lesson.title}
                        onChange={(e) =>
                          patchLesson(lessonIndex, { title: e.target.value })
                        }
                      />
                    </FormField>
                    <FormField
                      id={`${prefix}.description`}
                      label="Lesson description (optional)"
                    >
                      <Textarea
                        id={`${prefix}.description`}
                        maxLength={2000}
                        rows={2}
                        value={lesson.description ?? ""}
                        onChange={(e) =>
                          patchLesson(lessonIndex, {
                            description: e.target.value,
                          })
                        }
                      />
                    </FormField>
                    <label className="flex min-h-11 items-center gap-2 text-sm">
                      <Checkbox
                        checked={lesson.isRequired}
                        onChange={(e) =>
                          patchLesson(lessonIndex, {
                            isRequired: e.target.checked,
                          })
                        }
                      />
                      Required for course completion
                    </label>
                    {lesson.materials.map((material, materialIndex) => {
                      const path = `${prefix}.materials.${materialIndex}`;
                      return (
                        <fieldset
                          key={materialIndex}
                          className="border-border min-w-0 space-y-3 border-t pt-4"
                        >
                          <legend className="text-sm font-semibold">
                            Material {materialIndex + 1}
                          </legend>
                          <FormField
                            id={`${path}.title`}
                            label="Material title *"
                            error={errors[`${path}.title`]}
                          >
                            <Input
                              id={`${path}.title`}
                              maxLength={255}
                              value={material.title}
                              onChange={(e) =>
                                patchMaterial(lessonIndex, materialIndex, {
                                  ...material,
                                  title: e.target.value,
                                })
                              }
                            />
                          </FormField>
                          <FormField id={`${path}.type`} label="Material type">
                            <Select
                              id={`${path}.type`}
                              value={material.type}
                              onChange={(e) => {
                                const type = e.target.value;
                                if (
                                  type === "text" ||
                                  type === "video" ||
                                  type === "document" ||
                                  type === "link"
                                )
                                  patchMaterial(lessonIndex, materialIndex, {
                                    title: material.title,
                                    type,
                                    ...(type === "text"
                                      ? { content: "" }
                                      : { externalUrl: "" }),
                                  });
                              }}
                            >
                              <option value="text">Text</option>
                              <option value="video">Video</option>
                              <option value="document">Document (PDF)</option>
                              <option value="link">External link</option>
                            </Select>
                          </FormField>
                          {material.type === "text" ? (
                            <FormField
                              id={`${path}.content`}
                              label="Learning content *"
                              error={errors[`${path}.content`]}
                            >
                              <Textarea
                                id={`${path}.content`}
                                rows={5}
                                maxLength={50000}
                                value={material.content ?? ""}
                                onChange={(e) =>
                                  patchMaterial(lessonIndex, materialIndex, {
                                    ...material,
                                    content: e.target.value,
                                  })
                                }
                              />
                            </FormField>
                          ) : (
                            <>
                              {material.type !== "link" ? (
                                <FormField id={`${path}.source`} label="Source">
                                  <Select
                                    id={`${path}.source`}
                                    value={
                                      material.uploadKey ||
                                      material.existingFileId
                                        ? "file"
                                        : "url"
                                    }
                                    onChange={(e) =>
                                      patchMaterial(
                                        lessonIndex,
                                        materialIndex,
                                        {
                                          title: material.title,
                                          type: material.type,
                                          ...(e.target.value === "file"
                                            ? { uploadKey: crypto.randomUUID() }
                                            : { externalUrl: "" }),
                                        },
                                      )
                                    }
                                  >
                                    <option value="url">HTTPS URL</option>
                                    <option value="file">Upload file</option>
                                  </Select>
                                </FormField>
                              ) : null}
                              {material.existingFileId &&
                              !material.uploadKey ? (
                                <div className="border-border bg-neutral-soft space-y-2 rounded-lg border p-3">
                                  <p className="text-sm font-medium">
                                    {material.existingFile?.name ??
                                      "Existing uploaded file"}
                                  </p>
                                  <p className="text-muted text-xs">
                                    Keep this file, choose HTTPS URL above, or
                                    replace it with a new upload.
                                  </p>
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() =>
                                      patchMaterial(
                                        lessonIndex,
                                        materialIndex,
                                        {
                                          title: material.title,
                                          type: material.type,
                                          uploadKey: crypto.randomUUID(),
                                        },
                                      )
                                    }
                                  >
                                    Replace file
                                  </Button>
                                </div>
                              ) : material.uploadKey ? (
                                <FormField
                                  id={`${path}.content`}
                                  label="Upload file *"
                                  error={errors[`${path}.content`]}
                                >
                                  <Input
                                    key={material.uploadKey}
                                    id={`${path}.content`}
                                    type="file"
                                    accept={
                                      material.type === "video"
                                        ? ".mp4,.webm"
                                        : ".pdf"
                                    }
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      const key = material.uploadKey;
                                      if (!key) return;
                                      if (!file) {
                                        setFiles((current) => {
                                          const next = { ...current };
                                          delete next[key];
                                          return next;
                                        });
                                        return;
                                      }
                                      if (
                                        file.size === 0 ||
                                        file.size > 20 * 1024 * 1024
                                      ) {
                                        setErrors((current) => ({
                                          ...current,
                                          [`${path}.content`]:
                                            "Select a non-empty file up to 20 MB.",
                                        }));
                                        e.target.value = "";
                                        setFiles((current) => {
                                          const next = { ...current };
                                          delete next[key];
                                          return next;
                                        });
                                        return;
                                      }
                                      setFiles((current) => ({
                                        ...current,
                                        [key]: file,
                                      }));
                                      setDirty(true);
                                      setErrors((current) => {
                                        const next = { ...current };
                                        delete next[`${path}.content`];
                                        return next;
                                      });
                                    }}
                                  />
                                  <p className="text-muted text-xs">
                                    {material.type === "video"
                                      ? "MP4 or WebM"
                                      : "PDF"}{" "}
                                    · Maximum 20 MB per file.{" "}
                                    {files[material.uploadKey]?.name}
                                  </p>
                                </FormField>
                              ) : (
                                <FormField
                                  id={`${path}.externalUrl`}
                                  label="HTTPS URL *"
                                  error={
                                    errors[`${path}.externalUrl`] ??
                                    errors[`${path}.content`]
                                  }
                                >
                                  <Input
                                    id={`${path}.externalUrl`}
                                    type="url"
                                    maxLength={2000}
                                    value={material.externalUrl ?? ""}
                                    onChange={(e) =>
                                      patchMaterial(
                                        lessonIndex,
                                        materialIndex,
                                        {
                                          ...material,
                                          externalUrl: e.target.value,
                                        },
                                      )
                                    }
                                  />
                                </FormField>
                              )}
                            </>
                          )}
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={lesson.materials.length <= 1}
                            onClick={() => {
                              if (window.confirm("Remove this material?"))
                                patchLesson(lessonIndex, {
                                  materials: lesson.materials.filter(
                                    (_, i) => i !== materialIndex,
                                  ),
                                });
                            }}
                          >
                            Remove material
                          </Button>
                        </fieldset>
                      );
                    })}
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={lesson.materials.length >= 10}
                      onClick={() =>
                        patchLesson(lessonIndex, {
                          materials: [
                            ...lesson.materials,
                            { title: "", type: "text", content: "" },
                          ],
                        })
                      }
                    >
                      Add material
                    </Button>
                    <details
                      className="border-border border-t pt-3"
                      open={Boolean(lesson.assessment)}
                    >
                      <summary className="cursor-pointer text-sm font-semibold">
                        Lesson assessment (optional)
                      </summary>
                      <div className="mt-4 space-y-4">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() =>
                            patchLesson(lessonIndex, {
                              assessment: lesson.assessment
                                ? undefined
                                : newAssessment(),
                            })
                          }
                        >
                          {lesson.assessment
                            ? "Remove lesson assessment"
                            : "Add lesson assessment"}
                        </Button>
                        {lesson.assessment ? (
                          <CourseAssessmentEditor
                            prefix={`${prefix}.assessment`}
                            errors={errors}
                            value={lesson.assessment}
                            onChange={(assessment) =>
                              patchLesson(lessonIndex, { assessment })
                            }
                          />
                        ) : null}
                      </div>
                    </details>
                  </fieldset>
                );
              })}
              <Button
                type="button"
                variant="secondary"
                disabled={lessons.length >= 50}
                onClick={() =>
                  change({ ...value, lessons: [...lessons, newLesson()] })
                }
              >
                Add lesson
              </Button>
            </div>
          </ProductPanel>
          <ProductPanel
            title="Final assessment"
            description="Optional while preparing a draft. Use the controls to select correct answers."
          >
            <div className="space-y-4 p-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  change({
                    ...value,
                    assessment: value.assessment ? undefined : newAssessment(),
                  })
                }
              >
                {value.assessment
                  ? "Remove final assessment"
                  : "Add final assessment"}
              </Button>
              {value.assessment ? (
                <CourseAssessmentEditor
                  prefix="assessment"
                  errors={errors}
                  value={value.assessment}
                  onChange={(assessment) => change({ ...value, assessment })}
                />
              ) : null}
            </div>
          </ProductPanel>
        </fieldset>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={isPending}
            onClick={cancel}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending || (isEditing && !dirty)}>
            {isPending
              ? isEditing
                ? "Saving draft…"
                : "Creating draft…"
              : isEditing
                ? "Save changes"
                : "Create draft"}
          </Button>
        </div>
      </form>
    </div>
  );
}
