import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CreateCourseBuilder } from "./create-course-builder";
const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  submit: vi.fn(),
  update: vi.fn(),
  success: vi.fn(),
  permissions: ["training-courses.create"],
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
  usePathname: () => "/training/create",
}));
vi.mock("@/features/auth", () => ({
  useSessionUser: () => ({
    data: { permissions: mocks.permissions },
    isPending: false,
    isError: false,
  }),
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: mocks.success }),
}));
vi.mock("../hooks/use-courses", () => ({
  useCreateCourse: () => ({ mutateAsync: mocks.submit, isPending: false }),
  useUpdateCourseDraft: () => ({ mutateAsync: mocks.update, isPending: false }),
  useCourseDraft: (courseId: string | undefined) => ({
    data: courseId
      ? {
          id: courseId,
          title: "Existing security course",
          description: "Existing description",
          content: "Existing learning objectives",
          status: "draft",
          updatedAt: "2026-09-19T08:00:00.000Z",
          lessons: [
            {
              title: "Existing lesson",
              description: "",
              isRequired: true,
              materials: [
                {
                  title: "Existing guide",
                  type: "text",
                  content: "Existing material content",
                },
              ],
            },
          ],
          assessment: null,
        }
      : undefined,
    isPending: false,
    isError: false,
  }),
}));
afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.permissions = ["training-courses.create"];
  mocks.submit.mockResolvedValue({});
  mocks.update.mockResolvedValue({});
});
describe("CreateCourseBuilder", () => {
  it("prevents creation without permission", () => {
    mocks.permissions = [];
    render(<CreateCourseBuilder />);
    expect(screen.queryByRole("button", { name: "Create draft" })).toBeNull();
  });
  it("shows validation and does not submit an empty course", async () => {
    render(<CreateCourseBuilder />);
    fireEvent.click(screen.getByRole("button", { name: "Create draft" }));
    await screen.findByText("Review the highlighted fields");
    expect(mocks.submit).not.toHaveBeenCalled();
  });
  it("saves structured lessons as a draft", async () => {
    render(<CreateCourseBuilder />);
    fireEvent.change(screen.getByLabelText("Course title *"), {
      target: { value: "Security basics" },
    });
    fireEvent.change(screen.getByLabelText("Learning objectives *"), {
      target: { value: "Understand how to protect your account." },
    });
    fireEvent.change(screen.getByLabelText("Lesson title *"), {
      target: { value: "Strong passwords" },
    });
    fireEvent.change(screen.getByLabelText("Material title *"), {
      target: { value: "Introduction" },
    });
    fireEvent.change(screen.getByLabelText("Learning content *"), {
      target: { value: "Use unique passwords." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create draft" }));
    await waitFor(() =>
      expect(mocks.submit).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "draft",
          lessons: [expect.objectContaining({ title: "Strong passwords" })],
        }),
      ),
    );
    expect(mocks.push).toHaveBeenCalledWith("/training");
  });
  it("keeps input when submission fails", async () => {
    mocks.submit.mockRejectedValue(new Error("network"));
    render(<CreateCourseBuilder />);
    fireEvent.change(screen.getByLabelText("Course title *"), {
      target: { value: "Security basics" },
    });
    fireEvent.change(screen.getByLabelText("Learning objectives *"), {
      target: { value: "Understand how to protect your account." },
    });
    fireEvent.change(screen.getByLabelText("Lesson title *"), {
      target: { value: "Strong passwords" },
    });
    fireEvent.change(screen.getByLabelText("Material title *"), {
      target: { value: "Introduction" },
    });
    fireEvent.change(screen.getByLabelText("Learning content *"), {
      target: { value: "Use unique passwords." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create draft" }));
    await screen.findByText(/Your form has been kept/);
    expect(screen.getByLabelText("Course title *")).toHaveValue(
      "Security basics",
    );
  });
  it("prefills and updates an existing structured draft", async () => {
    mocks.permissions = ["training-courses.update"];
    render(
      <CreateCourseBuilder courseId="e2ef8324-9ac0-4e7f-b16d-50050274a72e" />,
    );
    expect(await screen.findByLabelText("Course title *")).toHaveValue(
      "Existing security course",
    );
    fireEvent.change(screen.getByLabelText("Course title *"), {
      target: { value: "Updated security course" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(mocks.update).toHaveBeenCalledWith(
        expect.objectContaining({
          courseId: "e2ef8324-9ac0-4e7f-b16d-50050274a72e",
          input: expect.objectContaining({
            title: "Updated security course",
            expectedUpdatedAt: "2026-09-19T08:00:00.000Z",
          }),
        }),
      ),
    );
  });
});
