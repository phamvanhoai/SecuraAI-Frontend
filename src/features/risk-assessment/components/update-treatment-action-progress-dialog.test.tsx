import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ApiError } from "@/lib/api/api-error";
import { UpdateTreatmentActionProgressDialog } from "./update-treatment-action-progress-dialog";

const mocks = vi.hoisted(() => ({ mutateAsync: vi.fn(), success: vi.fn() }));
vi.mock("../hooks/use-update-treatment-action-progress", () => ({
  useUpdateTreatmentActionProgress: () => ({ mutateAsync: mocks.mutateAsync, isPending: false }),
}));
vi.mock("@/components/feedback/toast", () => ({ useToast: () => ({ success: mocks.success }) }));
const timestamp = "2026-09-21T12:00:00.000Z";
const action = { id: "22222222-2222-4222-8222-222222222222", title: "Enable MFA", description: null,
  assignee: null, dueDate: null, progressPercent: 100, status: "completed", completedAt: timestamp, createdAt: timestamp, updatedAt: timestamp };
const props = { action, treatmentPlanId: "11111111-1111-4111-8111-111111111111", onClose: vi.fn(), onReload: vi.fn() };
beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: function (this: HTMLDialogElement) { this.setAttribute("open", ""); } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: function (this: HTMLDialogElement) { this.removeAttribute("open"); } });
});
afterEach(() => {
  cleanup(); vi.restoreAllMocks();
  Reflect.deleteProperty(HTMLDialogElement.prototype, "showModal");
  Reflect.deleteProperty(HTMLDialogElement.prototype, "close");
});

describe("action progress dialog", () => {
  it("requires a note for regression and sends the original concurrency version", async () => {
    mocks.mutateAsync.mockResolvedValue({ progressPercent: 60, allActionsCompleted: false });
    render(<UpdateTreatmentActionProgressDialog {...props} />);
    fireEvent.change(screen.getByLabelText("Progress (%)"), { target: { value: "60" } });
    expect(screen.getByRole("button", { name: "Save progress" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Progress note (required)"), { target: { value: "Verification found more work." } });
    fireEvent.click(screen.getByRole("button", { name: "Save progress" }));
    await waitFor(() => expect(props.onClose).toHaveBeenCalled());
    expect(mocks.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ data: {
      expectedUpdatedAt: timestamp, progressPercent: 60, progressNote: "Verification found more work.",
    } }));
  });
  it("blocks resubmission after conflict and offers reload", async () => {
    mocks.mutateAsync.mockRejectedValue(new ApiError("The action changed. Reload it.", 409, "CONFLICT"));
    render(<UpdateTreatmentActionProgressDialog {...props} action={{ ...action, progressPercent: 0, status: "pending", completedAt: null }} />);
    fireEvent.change(screen.getByLabelText("Progress (%)"), { target: { value: "50" } });
    fireEvent.click(screen.getByRole("button", { name: "Save progress" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Reload plan" })).toBeVisible());
    expect(screen.getByLabelText("Progress (%)")).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Reload plan" }));
    expect(props.onReload).toHaveBeenCalledOnce();
  });
  it("does not treat an empty percentage as zero", () => {
    render(<UpdateTreatmentActionProgressDialog {...props} />);
    fireEvent.change(screen.getByLabelText("Progress (%)"), { target: { value: "" } });
    expect(screen.getByRole("button", { name: "Save progress" })).toBeDisabled();
  });
});
