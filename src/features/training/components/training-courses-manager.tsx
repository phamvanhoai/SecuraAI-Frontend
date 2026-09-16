"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Send, Search } from "lucide-react";
import { useDeferredValue, useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useSessionUser } from "@/features/auth";
import {
  useAssignCourse,
  useAssignmentOptions,
  useCourses,
  useCreateCourse,
  useLatestCourseAssignment,
} from "../hooks/use-courses";
import {
  assignCourseSchema,
  createCourseSchema,
  type AssignCourseInput,
  type Course,
  type CreateCourseInput,
} from "../schemas/course-schema";

const defaults: CreateCourseInput = { title: "", description: "", content: "" };

export function TrainingCoursesManager({
  onTrackCompletion,
}: {
  onTrackCompletion?: () => void;
}) {
  const session = useSessionUser();
  const canRead =
    session.data?.permissions.includes("training-courses.read") ?? false;
  const canCreate =
    session.data?.permissions.includes("training-courses.create") ?? false;
  const canAssign =
    session.data?.permissions.includes("training-courses.assign") ?? false;
  const [page, setPage] = useState(1);
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [courseToAssign, setCourseToAssign] = useState<Course>();
  const courses = useCourses(page, query, canRead);
  const columns: readonly DataTableColumn<Course>[] = [
    {
      key: "title",
      header: "Course",
      cell: (course) => (
        <span>
          <strong className="block">{course.title}</strong>
          <span className="text-muted text-xs">
            {course.description || "No description"}
          </span>
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (course) => (
        <StatusBadge
          tone={course.status === "published" ? "success" : "neutral"}
        >
          {course.status}
        </StatusBadge>
      ),
    },
    {
      key: "created",
      header: "Created",
      cell: (course) =>
        new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
          new Date(course.createdAt),
        ),
    },
    ...(canAssign
      ? [
          {
            key: "actions",
            header: "Actions",
            cell: (course: Course) => (
              <Button
                className="min-h-10 px-3"
                variant="secondary"
                onClick={() => setCourseToAssign(course)}
              >
                <Send aria-hidden="true" className="size-4" strokeWidth={1.8} />
                Assign
              </Button>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <ProductPageHeader
        title="Security awareness courses"
        description="Create draft training content for security awareness programs. Publishing and assignment are separate workflows."
        showSampleNotice={false}
        {...(onTrackCompletion
          ? {
              additionalActions: (
                <Button variant="secondary" onClick={onTrackCompletion}>
                  Track completion
                </Button>
              ),
            }
          : {})}
        {...(canCreate
          ? {
              primaryAction: "Create course",
              onPrimaryAction: () => setFormOpen(true),
            }
          : {})}
      />
      <ProductPanel
        title="Courses"
        description={
          courses.data
            ? `${courses.data.pagination.total} courses found`
            : "Courses returned by the backend"
        }
      >
        <form
          className="border-border flex flex-wrap gap-2 border-b p-4"
          onSubmit={(event) => {
            event.preventDefault();
            setQuery(draftQuery.trim());
            setPage(1);
          }}
        >
          <label className="relative block w-full max-w-md">
            <span className="sr-only">Search courses</span>
            <Search
              aria-hidden="true"
              className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
            />
            <Input
              className="pl-9"
              maxLength={100}
              placeholder="Search courses"
              value={draftQuery}
              onChange={(event) => setDraftQuery(event.target.value)}
            />
          </label>
          <Button type="submit">Search</Button>
        </form>
        <div className="p-4">
          {session.isPending || (canRead && courses.isPending) ? (
            <TableSkeleton
              headers={["Course", "Status", "Created"]}
              label="Loading courses"
              rows={5}
            />
          ) : !canRead ? (
            <Alert>You do not have permission to view courses.</Alert>
          ) : courses.isError ? (
            <Alert>
              Unable to load courses. Check your connection and try again.
            </Alert>
          ) : courses.data?.items.length === 0 ? (
            <p className="text-muted py-10 text-center text-sm">
              No courses found.{" "}
              {canCreate
                ? "Create a draft to get started."
                : "Try a different search."}
            </p>
          ) : courses.data ? (
            <DataTable
              columns={columns}
              getRowKey={(course) => course.id}
              rows={courses.data.items}
            />
          ) : null}
        </div>
        {courses.data ? (
          <div className="border-border border-t p-4">
            <Pagination
              page={courses.data.pagination.page}
              pageCount={courses.data.pagination.totalPages}
              onPageChange={setPage}
            />
          </div>
        ) : null}
      </ProductPanel>
      <CreateCourseDialog open={formOpen} onClose={() => setFormOpen(false)} />
      <AssignCourseDialog
        course={courseToAssign}
        onClose={() => setCourseToAssign(undefined)}
      />
    </>
  );
}

function localDate(offsetDays = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function AssignCourseDialog({
  course,
  onClose,
}: {
  course: Course | undefined;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [userSearch, setUserSearch] = useState("");
  const [departmentSearch, setDepartmentSearch] = useState("");
  const deferredUserSearch = useDeferredValue(userSearch.trim());
  const deferredDepartmentSearch = useDeferredValue(departmentSearch.trim());
  const options = useAssignmentOptions(
    deferredUserSearch,
    deferredDepartmentSearch,
    Boolean(course),
  );
  const mutation = useAssignCourse();
  const currentAssignment = useLatestCourseAssignment(course?.id);
  const toast = useToast();
  const [message, setMessage] = useState<string>();
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AssignCourseInput>({
    resolver: zodResolver(assignCourseSchema),
    defaultValues: {
      title: "",
      startDate: localDate(),
      dueDate: localDate(14),
      userIds: [],
      departmentIds: [],
      changeReason: "",
    },
  });
  const userIds = useWatch({ control, name: "userIds" });
  const departmentIds = useWatch({ control, name: "departmentIds" });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (course && dialog && !dialog.open) {
      if (currentAssignment.isPending) return;
      const assignment = currentAssignment.data;
      reset({
        title: assignment?.title ?? `${course.title} campaign`,
        startDate: assignment?.startDate.slice(0, 10) ?? localDate(),
        dueDate: assignment?.dueDate.slice(0, 10) ?? localDate(14),
        userIds: assignment?.userIds ?? [],
        departmentIds: assignment?.departmentIds ?? [],
        changeReason: "",
      });
      dialog.showModal();
    } else if (!course && dialog?.open) dialog.close();
  }, [course, currentAssignment.data, currentAssignment.isPending, reset]);

  const close = () => {
    if (!mutation.isPending) {
      setMessage(undefined);
      setUserSearch("");
      setDepartmentSearch("");
      onClose();
    }
  };
  const toggle = (
    field: "userIds" | "departmentIds",
    id: string,
    selected: boolean,
  ) => {
    const current = field === "userIds" ? userIds : departmentIds;
    setValue(
      field,
      selected ? current.filter((value) => value !== id) : [...current, id],
      { shouldValidate: true },
    );
  };
  const submit = async (input: AssignCourseInput) => {
    if (!course) return;
    setMessage(undefined);
    if (currentAssignment.data && !input.changeReason?.trim()) {
      setMessage("Enter a reason for changing this assignment.");
      return;
    }
    try {
      const result = await mutation.mutateAsync({ courseId: course.id, input });
      onClose();
      toast.success(
        currentAssignment.data ? "Assignment updated" : "Course assigned",
        currentAssignment.data
          ? `${result.removedCount} removed; ${result.retainedStartedCount} started and ${result.retainedCompletedCount} completed enrollments retained. Use Withdraw in Track completion to stop assessment access.`
          : `${result.enrollmentCount} employee${result.enrollmentCount === 1 ? "" : "s"} enrolled.`,
      );
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to assign this course.",
      );
    }
  };

  return (
    <Dialog
      title={
        course
          ? `${currentAssignment.data ? "Manage" : "Assign"} ${course.title}`
          : "Assign training course"
      }
      dialogRef={dialogRef}
      onClose={close}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      className="max-h-[calc(100dvh-2rem)] w-[min(44rem,calc(100%-2rem))] overflow-y-auto"
    >
      <form className="space-y-5" noValidate onSubmit={handleSubmit(submit)}>
        {currentAssignment.isError ? (
          <Alert>
            Unable to load the existing assignment. Close this form and try
            again before saving.
          </Alert>
        ) : null}
        {message ? (
          <Alert
            className="border-danger/25 bg-danger-soft text-danger"
            role="alert"
          >
            {message}
          </Alert>
        ) : null}
        <FormField
          id="campaign-title"
          label="Campaign title"
          error={errors.title?.message}
        >
          <Input
            id="campaign-title"
            maxLength={255}
            aria-invalid={Boolean(errors.title)}
            {...register("title")}
          />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="campaign-start"
            label="Start date"
            error={errors.startDate?.message}
          >
            <Input
              id="campaign-start"
              type="date"
              aria-invalid={Boolean(errors.startDate)}
              {...register("startDate")}
            />
          </FormField>
          <FormField
            id="campaign-due"
            label="Due date"
            error={errors.dueDate?.message}
          >
            <Input
              id="campaign-due"
              type="date"
              aria-invalid={Boolean(errors.dueDate)}
              {...register("dueDate")}
            />
          </FormField>
        </div>
        {currentAssignment.data ? (
          <FormField
            id="assignment-change-reason"
            label="Reason for change"
            error={errors.changeReason?.message}
          >
            <Textarea
              id="assignment-change-reason"
              maxLength={500}
              rows={3}
              placeholder="Explain why targets or dates are changing"
              {...register("changeReason")}
            />
          </FormField>
        ) : null}
        {options.isPending ? (
          <div
            aria-label="Loading assignment targets"
            className="bg-neutral-soft h-48 animate-pulse rounded-xl"
          />
        ) : options.isError ? (
          <Alert>Unable to load active employees and departments.</Alert>
        ) : options.data ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <TargetList
                title="Departments"
                empty="No matching active departments"
                search={departmentSearch}
                searchLabel="Search departments"
                hasMore={options.data.hasMore.departments}
                items={options.data.departments.map((item) => ({
                  id: item.id,
                  label: item.name,
                  detail: item.code,
                }))}
                selected={departmentIds}
                onClear={() =>
                  setValue("departmentIds", [], { shouldValidate: true })
                }
                onSearchChange={setDepartmentSearch}
                onToggle={(id) =>
                  toggle("departmentIds", id, departmentIds.includes(id))
                }
              />
              <TargetList
                title="Employees"
                empty="No matching active employees"
                search={userSearch}
                searchLabel="Search employees by name, email, or code"
                hasMore={options.data.hasMore.users}
                items={options.data.users.map((item) => ({
                  id: item.id,
                  label: item.name,
                  detail: item.email,
                }))}
                selected={userIds}
                onClear={() =>
                  setValue("userIds", [], { shouldValidate: true })
                }
                onSearchChange={setUserSearch}
                onToggle={(id) => toggle("userIds", id, userIds.includes(id))}
              />
            </div>
            {errors.userIds?.message ? (
              <p className="text-danger text-sm" role="alert">
                {errors.userIds.message}
              </p>
            ) : null}
          </>
        ) : null}
        <div className="border-border flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            disabled={mutation.isPending}
            onClick={close}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              mutation.isPending ||
              options.isPending ||
              options.isError ||
              currentAssignment.isError
            }
          >
            {mutation.isPending
              ? "Saving…"
              : currentAssignment.data
                ? "Save assignment"
                : "Assign course"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function TargetList({
  title,
  empty,
  items,
  selected,
  search,
  searchLabel,
  hasMore,
  onSearchChange,
  onClear,
  onToggle,
}: {
  title: string;
  empty: string;
  items: readonly { id: string; label: string; detail: string }[];
  selected: readonly string[];
  search: string;
  searchLabel: string;
  hasMore: boolean;
  onSearchChange: (value: string) => void;
  onClear: () => void;
  onToggle: (id: string) => void;
}) {
  return (
    <fieldset className="min-w-0 space-y-2">
      <legend className="sr-only">{title}</legend>
      <div className="flex min-h-6 items-center justify-between gap-2">
        <span className="font-medium">{title}</span>
        <span className="text-muted text-xs">{selected.length} selected</span>
      </div>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="text-muted pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          strokeWidth={1.8}
        />
        <Input
          className="pl-9"
          aria-label={searchLabel}
          placeholder={searchLabel}
          maxLength={100}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
      <div className="border-border max-h-56 overflow-y-auto rounded-lg border p-2">
        {items.length === 0 ? (
          <p className="text-muted p-3 text-sm">{empty}</p>
        ) : (
          items.map((item) => (
            <label
              key={item.id}
              className="hover:bg-neutral-soft flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2"
            >
              <Checkbox
                checked={selected.includes(item.id)}
                onChange={() => onToggle(item.id)}
              />
              <span className="min-w-0">
                <strong className="block truncate text-sm" title={item.label}>
                  {item.label}
                </strong>
                <span
                  className="text-muted block truncate text-xs"
                  title={item.detail}
                >
                  {item.detail}
                </span>
              </span>
            </label>
          ))
        )}
      </div>
      <div className="flex min-h-6 items-center justify-between gap-2">
        <span className="text-muted text-xs">
          {hasMore
            ? "More matches available—refine your search."
            : "All matching results shown."}
        </span>
        {selected.length ? (
          <button
            type="button"
            className="text-brand text-xs font-medium hover:underline"
            onClick={onClear}
          >
            Clear selected
          </button>
        ) : null}
      </div>
    </fieldset>
  );
}

function CreateCourseDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mutation = useCreateCourse();
  const toast = useToast();
  const [message, setMessage] = useState<string>();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCourseInput>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const close = () => {
    reset(defaults);
    setMessage(undefined);
    onClose();
  };
  const submit = async (values: CreateCourseInput) => {
    setMessage(undefined);
    try {
      await mutation.mutateAsync(values);
      close();
      toast.success(
        "Course created",
        "The draft is ready for further preparation.",
      );
    } catch (error: unknown) {
      setMessage(
        error instanceof Error ? error.message : "Unable to create course.",
      );
    }
  };

  return (
    <Dialog
      title="Create security awareness course"
      dialogRef={dialogRef}
      onClose={close}
      className="max-h-[calc(100dvh-2rem)] w-[min(40rem,calc(100%-2rem))] overflow-y-auto"
    >
      <form className="space-y-4" noValidate onSubmit={handleSubmit(submit)}>
        <p className="text-muted text-sm">
          The course will be saved as a draft.
        </p>
        {message ? (
          <Alert className="border-danger/25 bg-danger-soft text-danger">
            {message}
          </Alert>
        ) : null}
        <FormField
          id="course-title"
          label="Title"
          error={errors.title?.message}
        >
          <Input
            id="course-title"
            maxLength={255}
            aria-invalid={Boolean(errors.title)}
            {...register("title")}
          />
        </FormField>
        <FormField
          id="course-description"
          label="Description (optional)"
          error={errors.description?.message}
        >
          <Textarea
            id="course-description"
            maxLength={2000}
            rows={3}
            {...register("description")}
          />
        </FormField>
        <FormField
          id="course-content"
          label="Course content"
          error={errors.content?.message}
        >
          <Textarea
            id="course-content"
            maxLength={50000}
            rows={8}
            aria-invalid={Boolean(errors.content)}
            {...register("content")}
          />
        </FormField>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Creating…" : "Create draft"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
