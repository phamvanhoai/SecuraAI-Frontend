import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { CoursePublishDialog } from "./course-publish-dialog";

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  reset: vi.fn(),
  success: vi.fn(),
}));
vi.mock("../hooks/use-courses", () => ({
  usePublishCourse: () => ({
    mutateAsync: mocks.mutateAsync,
    reset: mocks.reset,
    isPending: false,
    isError: false,
  }),
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: mocks.success }),
}));

const course = {
  id: "00000000-0000-4000-8000-000000000001",
  title: "Phishing awareness",
  description: null,
  content: "Course content",
  status: "draft" as const,
  createdByUserId: null,
  createdAt: "2026-09-21T00:00:00.000Z",
  updatedAt: "2026-09-21T00:00:00.000Z",
};

describe("CoursePublishDialog", () => {
  beforeAll(() => {
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close = function close() {
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    };
  });
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it("confirms the irreversible draft transition before publishing", async () => {
    mocks.mutateAsync.mockResolvedValue({ ...course, status: "published" });
    render(<CoursePublishDialog course={course} onClose={vi.fn()} />);
    expect(screen.getByRole("dialog")).toHaveAttribute("open");
    expect(screen.getByText(/can no longer be edited/i)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Publish course" }));
    await waitFor(() =>
      expect(mocks.mutateAsync).toHaveBeenCalledWith(course.id),
    );
    expect(mocks.success).toHaveBeenCalledWith(
      "Course published",
      "Phishing awareness is ready to assign.",
    );
  });
});
