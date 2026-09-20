"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ClipboardList,
  Ellipsis,
  Eye,
  Pencil,
  Plus,
  Send,
  Search,
  Trash2,
} from "lucide-react";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { TrainingCompletionManager } from "./training-completion-manager";
import {
  useDeferredValue,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
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
import { Select } from "@/components/ui/select";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useSessionUser } from "@/features/auth";
import {
  useAssignCourse,
  useAssignmentOptions,
  useCourseDraft,
  useCourses,
  useCreateCourse,
  useLatestCourseAssignment,
  useUpdateCourseDraft,
} from "../hooks/use-courses";
import {
  assignCourseSchema,
  createCourseSchema,
  type AssignCourseInput,
  type Course,
  type CourseStatusFilter,
  type CreateCourseInput,
} from "../schemas/course-schema";

const defaultQuestion = () => ({
  type: "single_choice" as const,
  text: "",
  options: [
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ],
});

const defaults: CreateCourseInput = {
  title: "",
  description: "",
  content: "",
  status: "draft",
  assessment: {
    title: "Post-training assessment",
    passingScore: 80,
    maxAttempts: 3,
    questions: [defaultQuestion()],
  },
};

export function TrainingCoursesManager({
  onAssessments,
  headerActions,
}: {
  onAssessments?: () => void;
  headerActions?: ReactNode;
}) {
  const session = useSessionUser();
  const canRead =
    session.data?.permissions.includes("training-courses.read") ?? false;
  const canCreate =
    session.data?.permissions.includes("training-courses.create") ?? false;
  const canUpdate =
    session.data?.permissions.some((permission) =>
      ["training-courses.update", "training-courses.create"].includes(
        permission,
      ),
    ) ?? false;
  const canAssign =
    session.data?.permissions.includes("training-courses.assign") ?? false;
  const canTrack =
    session.data?.permissions.includes("training-completion.read") ?? false;
  const [courseToTrack, setCourseToTrack] = useState<Course>();
  const [page, setPage] = useState(1);
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [draftStatus, setDraftStatus] = useState<CourseStatusFilter>("all");
  const [status, setStatus] = useState<CourseStatusFilter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState<Course>();
  const [assignmentDialog, setAssignmentDialog] = useState<{
    course: Course;
    mode: "create" | "edit";
  }>();
  const courses = useCourses(page, query, status, canRead);
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
    ...(canUpdate || canAssign || canTrack
      ? [
          {
            key: "actions",
            header: "Actions",
            cell: (course: Course) => (
              <DropdownMenu
                label={
                  <span>
                    <span className="sr-only">Actions for {course.title}</span>
                    <Ellipsis
                      aria-hidden="true"
                      className="size-5"
                      strokeWidth={1.8}
                    />
                  </span>
                }
              >
                {canUpdate && course.status === "draft" ? (
                  <button
                    type="button"
                    className="hover:bg-neutral-soft focus-visible:outline-brand flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors focus-visible:outline-2"
                    onClick={() => setCourseToEdit(course)}
                  >
                    <Pencil
                      aria-hidden="true"
                      className="size-4"
                      strokeWidth={1.8}
                    />
                    Edit draft
                  </button>
                ) : null}
                {canAssign ? (
                  <>
                    <button
                      type="button"
                      className="hover:bg-neutral-soft focus-visible:outline-brand flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors focus-visible:outline-2"
                      onClick={() =>
                        setAssignmentDialog({ course, mode: "create" })
                      }
                    >
                      <Send
                        aria-hidden="true"
                        className="size-4"
                        strokeWidth={1.8}
                      />
                      Create assignment campaign
                    </button>
                    <button
                      type="button"
                      className="hover:bg-neutral-soft focus-visible:outline-brand flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors focus-visible:outline-2"
                      onClick={() =>
                        setAssignmentDialog({ course, mode: "edit" })
                      }
                    >
                      <ClipboardList
                        aria-hidden="true"
                        className="size-4"
                        strokeWidth={1.8}
                      />
                      Edit latest campaign
                    </button>
                  </>
                ) : null}
                {canTrack ? (
                  <button
                    type="button"
                    className="hover:bg-neutral-soft focus-visible:outline-brand flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors focus-visible:outline-2"
                    onClick={() => setCourseToTrack(course)}
                  >
                    <Eye
                      aria-hidden="true"
                      className="size-4"
                      strokeWidth={1.8}
                    />
                    View training progress
                  </button>
                ) : null}
              </DropdownMenu>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      {courseToTrack ? (
        <TrainingCompletionManager
          key={courseToTrack.id}
          course={courseToTrack}
          headerActions={headerActions}
          onViewCourses={() => setCourseToTrack(undefined)}
        />
      ) : null}
      <div hidden={Boolean(courseToTrack)} className="space-y-5">
        <ProductPageHeader
          title="Security awareness courses"
          description="Manage courses, assign employees, and review training progress and completion certificates from each course's actions."
          showSampleNotice={false}
          {...(onAssessments
            ? {
                secondaryAction: "My assessments",
                secondaryActionIcon: (
                  <ClipboardList
                    aria-hidden="true"
                    className="size-4"
                    strokeWidth={1.8}
                  />
                ),
                onSecondaryAction: onAssessments,
              }
            : {})}
          {...(canCreate
            ? {
                primaryAction: "Create course",
                onPrimaryAction: () => setFormOpen(true),
              }
            : {})}
        />
        {headerActions}
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
              setStatus(draftStatus);
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
                type="search"
                maxLength={100}
                placeholder="Search courses"
                value={draftQuery}
                onChange={(event) => setDraftQuery(event.target.value)}
              />
            </label>
            <Select
              aria-label="Filter course status"
              className="w-full sm:w-44"
              value={draftStatus}
              onChange={(event) =>
                setDraftStatus(event.target.value as CourseStatusFilter)
              }
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </Select>
            <Button type="submit">Search</Button>
          </form>
          <div className="p-4">
            {session.isPending || (canRead && courses.isPending) ? (
              <TableSkeleton
                headers={[
                  "Course",
                  "Status",
                  "Created",
                  ...(canUpdate || canAssign || canTrack ? ["Actions"] : []),
                ]}
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
                  : "Try a different search or status filter."}
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
        <CourseDialog open={formOpen} onClose={() => setFormOpen(false)} />
        {courseToEdit ? (
          <CourseDialog
            course={courseToEdit}
            open
            onClose={() => setCourseToEdit(undefined)}
          />
        ) : null}
        <AssignCourseDialog
          course={assignmentDialog?.course}
          mode={assignmentDialog?.mode ?? "create"}
          onClose={() => setAssignmentDialog(undefined)}
        />
      </div>
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
  mode,
  onClose,
}: {
  course: Course | undefined;
  mode: "create" | "edit";
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
  const currentAssignment = useLatestCourseAssignment(
    mode === "edit" ? course?.id : undefined,
  );
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
      if (mode === "edit" && currentAssignment.isPending) return;
      const assignment = mode === "edit" ? currentAssignment.data : null;
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
  }, [
    course,
    currentAssignment.data,
    currentAssignment.isPending,
    mode,
    reset,
  ]);

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
    if (
      mode === "edit" &&
      currentAssignment.data &&
      !input.changeReason?.trim()
    ) {
      setMessage("Enter a reason for changing this assignment.");
      return;
    }
    try {
      const result = await mutation.mutateAsync({
        courseId: course.id,
        input,
        createNewCampaign: mode === "create",
      });
      onClose();
      toast.success(
        mode === "edit" ? "Campaign updated" : "Campaign created",
        mode === "edit"
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
          ? `${mode === "edit" ? "Edit latest campaign for" : "Create assignment campaign for"} ${course.title}`
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
        <p className="text-muted text-sm leading-6">
          {mode === "create"
            ? "Create a separate training cycle. Employees assigned here start with fresh progress; results from earlier campaigns remain in history."
            : "Update the latest campaign only. Existing progress, completed results, and certificates are preserved."}
        </p>
        {mode === "edit" && currentAssignment.isError ? (
          <Alert>
            Unable to load the existing assignment. Close this form and try
            again before saving.
          </Alert>
        ) : null}
        {mode === "edit" &&
        !currentAssignment.isPending &&
        !currentAssignment.data ? (
          <Alert>
            No assignment campaign exists for this course yet. Create a campaign
            first.
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
        {mode === "edit" && currentAssignment.data ? (
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
              (mode === "edit" && !currentAssignment.data) ||
              (mode === "edit" && currentAssignment.isError)
            }
          >
            {mutation.isPending
              ? "Saving…"
              : mode === "edit"
                ? "Save campaign"
                : "Create campaign"}
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

function CourseDialog({
  open,
  onClose,
  course,
}: {
  open: boolean;
  onClose: () => void;
  course?: Course;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const createMutation = useCreateCourse();
  const updateMutation = useUpdateCourseDraft();
  const courseDraft = useCourseDraft(course?.id);
  const toast = useToast();
  const [message, setMessage] = useState<string>();
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<CreateCourseInput>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: defaults,
  });
  const assessment = useWatch({ control, name: "assessment" });
  const courseStatus = useWatch({ control, name: "status" });
  const questions = useFieldArray({
    control,
    name: "assessment.questions",
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      if (!course) reset(defaults);
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [course, open, reset]);

  useEffect(() => {
    if (!courseDraft.data) return;
    reset({
      title: courseDraft.data.title,
      description: courseDraft.data.description ?? "",
      content: courseDraft.data.content ?? "",
      status: "draft",
      assessment: courseDraft.data.assessment ?? undefined,
    });
  }, [courseDraft.data, reset]);

  const close = (force = false) => {
    if (createMutation.isPending || updateMutation.isPending) return;
    if (isDirty && !force && !window.confirm("Discard unsaved course changes?"))
      return;
    reset(defaults);
    setMessage(undefined);
    onClose();
  };
  const submit = async (values: CreateCourseInput) => {
    setMessage(undefined);
    try {
      if (course) {
        await updateMutation.mutateAsync({
          courseId: course.id,
          input: {
            title: values.title,
            description: values.description,
            content: values.content,
            ...(values.assessment ? { assessment: values.assessment } : {}),
          },
        });
      } else {
        await createMutation.mutateAsync(values);
      }
      close(true);
      toast.success(
        course ? "Course draft updated" : "Course created",
        course
          ? "Your draft content and assessment changes were saved."
          : values.status === "published"
            ? "The course is published and ready to assign."
            : "The draft is ready for further preparation.",
      );
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : course
            ? "Unable to update the course draft."
            : "Unable to create course.",
      );
    }
  };

  return (
    <Dialog
      title={
        course
          ? `Edit draft: ${course.title}`
          : "Create security awareness course"
      }
      dialogRef={dialogRef}
      onClose={() => undefined}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      className="max-h-[calc(100dvh-2rem)] w-[min(40rem,calc(100%-2rem))] overflow-y-auto"
    >
      {course && courseDraft.isPending ? (
        <div
          aria-label="Loading course draft"
          className="bg-neutral-soft h-96 animate-pulse rounded-xl"
        />
      ) : course && courseDraft.isError ? (
        <div className="space-y-4">
          <Alert role="alert">
            Unable to load this draft. Close the dialog and try again.
          </Alert>
          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={() => close()}>
              Close
            </Button>
          </div>
        </div>
      ) : (
        <form className="space-y-4" noValidate onSubmit={handleSubmit(submit)}>
          <p className="text-muted text-sm" aria-live="polite">
            {course
              ? "Only draft courses can be edited. Published course history remains unchanged."
              : courseStatus === "published"
                ? "Publishing makes this course ready to assign and requires a valid post-training assessment."
                : "Save a draft while you prepare the training material and assessment."}
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
            label="Learning objectives and training material"
            error={errors.content?.message}
          >
            <Textarea
              id="course-content"
              maxLength={50000}
              rows={8}
              aria-invalid={Boolean(errors.content)}
              aria-describedby="course-content-guidance"
              placeholder="Describe the learning objectives and training material."
              {...register("content")}
            />
            <p
              className="text-muted text-xs leading-5"
              id="course-content-guidance"
            >
              Start with measurable learning objectives, then provide the
              guidance and resource URLs employees need.
            </p>
          </FormField>
          {!course ? (
            <FormField
              id="course-status"
              label="Status"
              error={errors.status?.message}
            >
              <Select id="course-status" {...register("status")}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </Select>
            </FormField>
          ) : null}
          <section className="border-border space-y-4 rounded-xl border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">Post-training assessment</h3>
                <p className="text-muted mt-1 text-sm leading-6">
                  Add a scored assessment so employees can complete the course.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setValue(
                    "assessment",
                    assessment
                      ? undefined
                      : {
                          title: "Post-training assessment",
                          passingScore: 80,
                          maxAttempts: 3,
                          questions: [defaultQuestion()],
                        },
                    { shouldValidate: true },
                  )
                }
              >
                {assessment ? "Remove assessment" : "Add assessment"}
              </Button>
            </div>
            {!assessment && errors.assessment ? (
              <p className="text-danger text-sm" role="alert">
                A published course requires a post-training assessment.
              </p>
            ) : null}
            {assessment ? (
              <>
                <FormField
                  id="assessment-title"
                  label="Assessment title"
                  error={errors.assessment?.title?.message}
                >
                  <Input
                    id="assessment-title"
                    maxLength={255}
                    aria-invalid={Boolean(errors.assessment?.title)}
                    {...register("assessment.title")}
                  />
                </FormField>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    id="assessment-passing-score"
                    label="Passing score (%)"
                    error={errors.assessment?.passingScore?.message}
                  >
                    <Input
                      id="assessment-passing-score"
                      type="number"
                      min={0}
                      max={100}
                      {...register("assessment.passingScore", {
                        valueAsNumber: true,
                      })}
                    />
                  </FormField>
                  <FormField
                    id="assessment-max-attempts"
                    label="Maximum attempts"
                    error={errors.assessment?.maxAttempts?.message}
                  >
                    <Input
                      id="assessment-max-attempts"
                      type="number"
                      min={1}
                      max={10}
                      {...register("assessment.maxAttempts", {
                        valueAsNumber: true,
                      })}
                    />
                  </FormField>
                </div>
                <div className="space-y-4">
                  {questions.fields.map((question, questionIndex) => (
                    <fieldset
                      className="border-border space-y-3 rounded-lg border p-4"
                      key={question.id}
                    >
                      <legend className="px-1 text-sm font-semibold">
                        Question {questionIndex + 1}
                      </legend>
                      <FormField
                        id={`assessment-question-${questionIndex}`}
                        label="Question"
                        error={
                          errors.assessment?.questions?.[questionIndex]?.text
                            ?.message
                        }
                      >
                        <Input
                          id={`assessment-question-${questionIndex}`}
                          maxLength={2000}
                          {...register(
                            `assessment.questions.${questionIndex}.text`,
                          )}
                        />
                      </FormField>
                      <FormField
                        id={`assessment-question-type-${questionIndex}`}
                        label="Answer type"
                        error={
                          errors.assessment?.questions?.[questionIndex]?.type
                            ?.message
                        }
                      >
                        <Select
                          id={`assessment-question-type-${questionIndex}`}
                          {...register(
                            `assessment.questions.${questionIndex}.type`,
                            {
                              onChange: (event) => {
                                if (event.target.value !== "single_choice")
                                  return;
                                const selectedIndex = assessment.questions[
                                  questionIndex
                                ]?.options.findIndex(
                                  (option) => option.isCorrect,
                                );
                                assessment.questions[
                                  questionIndex
                                ]?.options.forEach((_, index) =>
                                  setValue(
                                    `assessment.questions.${questionIndex}.options.${index}.isCorrect`,
                                    index === selectedIndex,
                                    { shouldValidate: true },
                                  ),
                                );
                              },
                            },
                          )}
                        >
                          <option value="single_choice">Single answer</option>
                          <option value="multiple_choice">
                            Multiple answers
                          </option>
                        </Select>
                      </FormField>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium">Answers</p>
                          <p className="text-muted mt-1 text-xs">
                            {assessment.questions[questionIndex]?.type ===
                            "multiple_choice"
                              ? "Select every correct answer (at least two)."
                              : "Select one correct answer for this question."}
                          </p>
                        </div>
                        <div
                          aria-hidden="true"
                          className="text-muted grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2 px-1 text-xs font-medium"
                        >
                          <span className="text-center">Correct</span>
                          <span>Answer</span>
                        </div>
                        {assessment.questions[questionIndex]?.options.map(
                          (option, optionIndex) => (
                            <div
                              className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-2"
                              key={`${question.id}-${optionIndex}`}
                            >
                              <label className="flex min-h-10 cursor-pointer items-center justify-center">
                                <input
                                  type={
                                    assessment.questions[questionIndex]
                                      ?.type === "multiple_choice"
                                      ? "checkbox"
                                      : "radio"
                                  }
                                  name={`correct-answer-${questionIndex}`}
                                  checked={option.isCorrect}
                                  onChange={(event) => {
                                    if (
                                      assessment.questions[questionIndex]
                                        ?.type === "multiple_choice"
                                    ) {
                                      setValue(
                                        `assessment.questions.${questionIndex}.options.${optionIndex}.isCorrect`,
                                        event.target.checked,
                                        { shouldValidate: true },
                                      );
                                      return;
                                    }
                                    assessment.questions[
                                      questionIndex
                                    ]?.options.forEach((_, index) =>
                                      setValue(
                                        `assessment.questions.${questionIndex}.options.${index}.isCorrect`,
                                        index === optionIndex,
                                        { shouldValidate: true },
                                      ),
                                    );
                                  }}
                                  aria-label={`Answer ${optionIndex + 1} is correct`}
                                />
                              </label>
                              <Input
                                aria-label={`Answer ${optionIndex + 1}`}
                                maxLength={1000}
                                {...register(
                                  `assessment.questions.${questionIndex}.options.${optionIndex}.text`,
                                )}
                              />
                            </div>
                          ),
                        )}
                        {errors.assessment?.questions?.[questionIndex]?.options
                          ?.message ? (
                          <p className="text-danger text-sm" role="alert">
                            {
                              errors.assessment.questions[questionIndex].options
                                .message
                            }
                          </p>
                        ) : null}
                      </div>
                      {questions.fields.length > 1 ? (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => questions.remove(questionIndex)}
                        >
                          <Trash2 aria-hidden="true" className="size-4" />
                          Remove question
                        </Button>
                      ) : null}
                    </fieldset>
                  ))}
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={questions.fields.length >= 50}
                    onClick={() => questions.append(defaultQuestion())}
                  >
                    <Plus aria-hidden="true" className="size-4" />
                    Add question
                  </Button>
                </div>
              </>
            ) : null}
          </section>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={createMutation.isPending || updateMutation.isPending}
              onClick={() => close()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving…"
                : course
                  ? "Save draft"
                  : courseStatus === "published"
                    ? "Publish course"
                    : "Create draft"}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
