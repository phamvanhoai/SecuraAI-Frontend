import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TrainingRemindersManager } from "./training-reminders-manager";

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  query: vi.fn(),
  read: vi.fn(),
  refresh: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));
vi.mock("@/features/auth", () => ({ useSessionUser: mocks.session }));
vi.mock("../hooks/use-reminders", () => ({
  useTrainingReminders: mocks.query,
  useMarkTrainingReminderRead: () => ({
    isPending: false,
    mutateAsync: mocks.read,
  }),
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: mocks.success, error: mocks.error }),
}));
const item = {
  notificationId: "00000000-0000-5000-8000-000000000001",
  enrollmentId: "00000000-0000-4000-8000-000000000002",
  title: "Training deadline approaching",
  message: "Complete Phishing awareness by 2026-09-19",
  isRead: false,
  readAt: null,
  createdAt: "2026-09-16T01:00:00.000Z",
};
describe("TrainingRemindersManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.session.mockReturnValue({
      isPending: false,
      isError: false,
      data: { id: "employee-1", permissions: ["training-assessments.take"] },
    });
    mocks.query.mockReturnValue({
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: mocks.refresh,
      data: {
        items: [item],
        summary: { total: 4, unread: 2 },
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      },
    });
    mocks.read.mockResolvedValue({ ...item, isRead: true });
  });
  afterEach(cleanup);
  it("shows real reminders, links to training and marks own reminder read", async () => {
    render(<TrainingRemindersManager />);
    expect(screen.getByText(item.message)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open training" })).toHaveAttribute(
      "href",
      "/training",
    );
    fireEvent.click(screen.getByRole("button", { name: "Mark as read" }));
    await waitFor(() =>
      expect(mocks.read).toHaveBeenCalledWith(item.notificationId),
    );
    await waitFor(() => expect(mocks.success).toHaveBeenCalled());
  });
  it("applies status only on submit and has no user dispatch action", () => {
    render(<TrainingRemindersManager />);
    fireEvent.change(screen.getByRole("combobox", { name: "Show" }), {
      target: { value: "unread" },
    });
    expect(mocks.query).toHaveBeenLastCalledWith(
      1,
      "all",
      true,
      "employee-1",
      "",
    );
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    expect(mocks.query).toHaveBeenLastCalledWith(
      1,
      "unread",
      true,
      "employee-1",
      "",
    );
    expect(mocks.read).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: /send/i }),
    ).not.toBeInTheDocument();
  });
  it("disables inbox fetching without the required permission", () => {
    mocks.session.mockReturnValue({
      isPending: false,
      isError: false,
      data: { permissions: [] },
    });
    render(<TrainingRemindersManager />);
    expect(mocks.query).toHaveBeenCalledWith(1, "all", false, undefined, "");
    expect(
      screen.queryByRole("button", { name: "Mark as read" }),
    ).not.toBeInTheDocument();
  });
  it("uses matching shared table skeleton headers while loading", () => {
    mocks.query.mockReturnValue({ isPending: true });
    render(<TrainingRemindersManager />);
    expect(
      screen.getByRole("status", {
        name: "Loading training deadline reminders",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("columnheader").map((element) => element.textContent),
    ).toEqual(["Reminder", "Received", "Status", "Actions"]);
  });
  it("shows account-wide totals returned by the backend", () => {
    render(<TrainingRemindersManager />);
    expect(
      screen.getByLabelText("Training reminder summary"),
    ).toHaveTextContent("Reminders4");
    expect(
      screen.getByLabelText("Training reminder summary"),
    ).toHaveTextContent("Unread2");
  });
  it("submits trimmed search to the backend hook instead of filtering the current page", () => {
    render(<TrainingRemindersManager />);
    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search training reminders" }),
      { target: { value: " Phishing " } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    expect(mocks.query).toHaveBeenLastCalledWith(
      1,
      "all",
      true,
      "employee-1",
      "Phishing",
    );
  });
  it("keeps failed updates actionable without exposing internal errors", async () => {
    mocks.read.mockRejectedValue(new Error("secret internal response"));
    render(<TrainingRemindersManager />);
    fireEvent.click(screen.getByRole("button", { name: "Mark as read" }));
    await waitFor(() =>
      expect(mocks.error).toHaveBeenCalledWith(
        "Unable to update reminder",
        expect.any(String),
      ),
    );
    expect(
      screen.queryByText("secret internal response"),
    ).not.toBeInTheDocument();
  });
});
