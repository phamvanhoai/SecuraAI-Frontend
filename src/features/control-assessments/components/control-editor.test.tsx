import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { ApiError } from "@/lib/api/api-error";
const { detail, mutate, success, owners } = vi.hoisted(() => ({
  detail: vi.fn(),
  mutate: vi.fn(),
  success: vi.fn(),
  owners: vi.fn(),
}));
vi.mock("../hooks/use-control-catalog", () => ({
  useCatalogControl: detail,
  useControlOwners: owners,
  useSaveCatalogControl: () => ({ mutateAsync: mutate, isPending: false }),
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success }),
}));
import { ControlEditor } from "./control-editor";
const current = {
  id: "00000000-0000-4000-8000-000000000001",
  controlCode: "CTRL-MFA",
  name: "Administrator MFA",
  description: "Require MFA for privileged access",
  owner: null,
  applicability: "applicable",
  implementationStatus: "planned",
  configurationLocked: false,
  updatedAt: "2026-10-07T00:00:00Z",
  createdAt: "2026-10-07T00:00:00Z",
  revision: "a".repeat(64),
};
beforeAll(() =>
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.setAttribute("open", "");
    },
  }),
);
afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  detail.mockReturnValue({ data: current, isPending: false, isError: false });
  owners.mockReturnValue({
    data: { items: [] },
    isPending: false,
    isError: false,
  });
  mutate.mockResolvedValue(current);
});
describe("ControlEditor", () => {
  it("validates required fields and focuses the first invalid field", async () => {
    detail.mockReturnValue({ data: undefined });
    render(<ControlEditor onClose={vi.fn()} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Create control" }),
    );
    expect(screen.getByLabelText("Control name *")).toHaveFocus();
    expect(screen.getByRole("alert")).toHaveTextContent("highlighted fields");
    expect(mutate).not.toHaveBeenCalled();
  });
  it("creates a reusable control without evidence or risk payloads", async () => {
    detail.mockReturnValue({ data: undefined });
    const close = vi.fn();
    render(<ControlEditor onClose={close} />);
    expect(screen.queryByLabelText("Applicability *")).not.toBeInTheDocument();
    await userEvent.type(
      screen.getByLabelText("Control name *"),
      "Administrator MFA",
    );
    await userEvent.type(
      screen.getByLabelText("Purpose and description *"),
      "Require MFA for privileged access",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Create control" }),
    );
    expect(mutate).toHaveBeenCalledWith({
      mode: "create",
      body: {
        name: "Administrator MFA",
        description: "Require MFA for privileged access",
        ownerUserId: null,
        applicability: "applicable",
        implementationStatus: "not_implemented",
      },
    });
    await waitFor(() => expect(close).toHaveBeenCalledOnce());
  });
  it.each(["under_review", "not_applicable"])("retains legacy %s applicability in Edit", async (applicability) => {
    detail.mockReturnValue({ data: { ...current, applicability }, isPending: false, isError: false });
    render(<ControlEditor controlId={current.id} onClose={vi.fn()} />);
    expect(screen.getByLabelText("Applicability *")).toHaveValue(applicability);
    await userEvent.type(screen.getByLabelText("Control name *"), " updated");
    await userEvent.type(screen.getByLabelText("Reason for change *"), "Correct control metadata");
    await userEvent.click(screen.getByRole("button", { name: "Save control" }));
    expect(mutate).toHaveBeenCalledWith(expect.objectContaining({ mode: "edit", body: expect.objectContaining({ applicability }) }));
  });
  it("keeps the code read-only and blocks no-op Edit", () => {
    render(<ControlEditor controlId={current.id} onClose={vi.fn()} />);
    expect(screen.getByLabelText("Control code")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save control" })).toBeDisabled();
  });
  it("freezes the version despite background refetch, excludes code from Edit", async () => {
    const { rerender } = render(
      <ControlEditor controlId={current.id} onClose={vi.fn()} />,
    );
    await userEvent.type(screen.getByLabelText("Control name *"), " updated");
    await userEvent.type(
      screen.getByLabelText("Reason for change *"),
      "Correct control metadata",
    );
    detail.mockReturnValue({
      data: {
        ...current,
        revision: "b".repeat(64),
        updatedAt: "2026-10-08T00:00:00Z",
      },
      isPending: false,
      isError: false,
    });
    rerender(<ControlEditor controlId={current.id} onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Save control" }));
    expect(mutate).toHaveBeenCalledWith({
      mode: "edit",
      id: current.id,
      body: {
        name: "Administrator MFA updated",
        description: current.description,
        ownerUserId: null,
        applicability: "applicable",
        implementationStatus: "planned",
        reason: "Correct control metadata",
        expectedUpdatedAt: current.updatedAt,
        expectedRevision: current.revision,
      },
    });
  });
  it("locks assessed configuration but permits metadata corrections", () => {
    detail.mockReturnValue({ data: { ...current, configurationLocked: true } });
    render(<ControlEditor controlId={current.id} onClose={vi.fn()} />);
    expect(screen.getByLabelText("Applicability *")).toBeDisabled();
    expect(screen.getByLabelText("Implementation status *")).toBeDisabled();
    expect(screen.getByLabelText("Control name *")).toBeEnabled();
  });
  it("preserves edits after a stale response and disables repeated saves", async () => {
    mutate.mockRejectedValue(new ApiError("Control changed", 409, "CONFLICT"));
    render(<ControlEditor controlId={current.id} onClose={vi.fn()} />);
    await userEvent.type(screen.getByLabelText("Control name *"), " updated");
    await userEvent.type(
      screen.getByLabelText("Reason for change *"),
      "Correct control metadata",
    );
    await userEvent.click(screen.getByRole("button", { name: "Save control" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Close and reopen",
    );
    expect(screen.getByLabelText("Control name *")).toHaveValue(
      "Administrator MFA updated",
    );
    expect(screen.getByRole("button", { name: "Save control" })).toBeDisabled();
  });
  it("does not allow manual control code editing during Create", async () => {
    detail.mockReturnValue({ data: undefined });
    render(<ControlEditor onClose={vi.fn()} />);
    expect(screen.queryByLabelText("Control code")).not.toBeInTheDocument();
  });
  it("confirms discarding changes on Cancel", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const close = vi.fn();
    render(<ControlEditor controlId={current.id} onClose={close} />);
    await userEvent.type(screen.getByLabelText("Control name *"), " updated");
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(confirm).toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
    confirm.mockRestore();
  });
  it("shows a contextual loading/error state rather than an empty edit form", () => {
    detail.mockReturnValue({
      isPending: false,
      isError: true,
      refetch: vi.fn(),
    });
    render(<ControlEditor controlId={current.id} onClose={vi.fn()} />);
    expect(screen.getByText(/Unable to load this control/)).toBeVisible();
    expect(screen.queryByLabelText("Control name *")).not.toBeInTheDocument();
  });
});
