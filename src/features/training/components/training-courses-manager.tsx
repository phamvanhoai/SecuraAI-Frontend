"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { DataTable, type DataTableColumn } from "@/components/data-display/data-table";
import { Pagination } from "@/components/data-display/pagination";
import { ProductPageHeader, ProductPanel, StatusBadge } from "@/components/data-display/static-product";
import { useToast } from "@/components/feedback/toast";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useSessionUser } from "@/features/auth";
import { useCourses, useCreateCourse } from "../hooks/use-courses";
import { createCourseSchema, type Course, type CreateCourseInput } from "../schemas/course-schema";

const defaults: CreateCourseInput = { title: "", description: "", content: "" };

export function TrainingCoursesManager() {
  const session = useSessionUser();
  const canRead = session.data?.permissions.includes("training-courses.read") ?? false;
  const canCreate = session.data?.permissions.includes("training-courses.create") ?? false;
  const [page, setPage] = useState(1);
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const courses = useCourses(page, query, canRead);
  const columns: readonly DataTableColumn<Course>[] = [
    { key: "title", header: "Course", cell: (course) => <span><strong className="block">{course.title}</strong><span className="text-muted text-xs">{course.description || "No description"}</span></span> },
    { key: "status", header: "Status", cell: (course) => <StatusBadge tone={course.status === "published" ? "success" : "neutral"}>{course.status}</StatusBadge> },
    { key: "created", header: "Created", cell: (course) => new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(course.createdAt)) },
  ];

  return <>
    <ProductPageHeader
      title="Security awareness courses"
      description="Create draft training content for security awareness programs. Publishing and assignment are separate workflows."
      showSampleNotice={false}
      {...(canCreate ? { primaryAction: "Create course", onPrimaryAction: () => setFormOpen(true) } : {})}
    />
    <ProductPanel title="Courses" description={courses.data ? `${courses.data.pagination.total} courses found` : "Courses returned by the backend"}>
      <form className="border-border flex flex-wrap gap-2 border-b p-4" onSubmit={(event) => { event.preventDefault(); setQuery(draftQuery.trim()); setPage(1); }}>
        <label className="relative block w-full max-w-md">
          <span className="sr-only">Search courses</span>
          <Search aria-hidden="true" className="text-muted absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input className="pl-9" maxLength={100} placeholder="Search courses" value={draftQuery} onChange={(event) => setDraftQuery(event.target.value)} />
        </label>
        <Button type="submit">Search</Button>
      </form>
      <div className="p-4">
        {session.isPending || (canRead && courses.isPending) ? <TableSkeleton headers={["Course", "Status", "Created"]} label="Loading courses" rows={5} />
          : !canRead ? <Alert>You do not have permission to view courses.</Alert>
          : courses.isError ? <Alert>Unable to load courses. Check your connection and try again.</Alert>
          : courses.data?.items.length === 0 ? <p className="text-muted py-10 text-center text-sm">No courses found. {canCreate ? "Create a draft to get started." : "Try a different search."}</p>
          : courses.data ? <DataTable columns={columns} getRowKey={(course) => course.id} rows={courses.data.items} /> : null}
      </div>
      {courses.data ? <div className="border-border border-t p-4"><Pagination page={courses.data.pagination.page} pageCount={courses.data.pagination.totalPages} onPageChange={setPage} /></div> : null}
    </ProductPanel>
    <CreateCourseDialog open={formOpen} onClose={() => setFormOpen(false)} />
  </>;
}

function CreateCourseDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mutation = useCreateCourse();
  const toast = useToast();
  const [message, setMessage] = useState<string>();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateCourseInput>({
    resolver: zodResolver(createCourseSchema), defaultValues: defaults,
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const close = () => { reset(defaults); setMessage(undefined); onClose(); };
  const submit = async (values: CreateCourseInput) => {
    setMessage(undefined);
    try {
      await mutation.mutateAsync(values);
      close();
      toast.success("Course created", "The draft is ready for further preparation.");
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Unable to create course.");
    }
  };

  return <Dialog title="Create security awareness course" dialogRef={dialogRef} onClose={close} className="max-h-[calc(100dvh-2rem)] w-[min(40rem,calc(100%-2rem))] overflow-y-auto">
    <form className="space-y-4" noValidate onSubmit={handleSubmit(submit)}>
      <p className="text-muted text-sm">The course will be saved as a draft.</p>
      {message ? <Alert className="border-danger/25 bg-danger-soft text-danger">{message}</Alert> : null}
      <FormField id="course-title" label="Title" error={errors.title?.message}><Input id="course-title" maxLength={255} aria-invalid={Boolean(errors.title)} {...register("title")} /></FormField>
      <FormField id="course-description" label="Description (optional)" error={errors.description?.message}><Textarea id="course-description" maxLength={2000} rows={3} {...register("description")} /></FormField>
      <FormField id="course-content" label="Course content" error={errors.content?.message}><Textarea id="course-content" maxLength={50000} rows={8} aria-invalid={Boolean(errors.content)} {...register("content")} /></FormField>
      <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={close}>Cancel</Button><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Creating…" : "Create draft"}</Button></div>
    </form>
  </Dialog>;
}
