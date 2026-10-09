import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
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
const { query, add, link, success } = vi.hoisted(() => ({
  query: vi.fn(),
  add: vi.fn(),
  link: vi.fn(),
  success: vi.fn(),
}));
vi.mock("../hooks/use-control-evidence", () => ({
  useControlEvidence: query,
  useEvidenceMutations: () => ({
    add: { mutateAsync: add, isPending: false },
    link: { mutateAsync: link, isPending: false },
  }),
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success }),
}));
import { ControlEvidenceDialog } from "./control-evidence-dialog";
const id = "00000000-0000-4000-8000-000000000001";
const item = {
  id,
  name: "MFA test report",
  source: "Authentication test",
  description: "Ten administrative accounts were tested",
  documentUrl: "https://docs.example.test/mfa",
  status: "active",
  usable: true,
  collectedAt: "2020-01-01T00:00:00Z",
  validFrom: null,
  validUntil: null,
  owner: null,
  reviewedAt: null,
  reviewedBy: null,
  createdAt: "2020-01-01T00:00:00Z",
  linkedAt: null,
  linkedBy: null,
};
const data = {
  control: { id, controlCode: "CTRL-MFA", name: "MFA enforcement" },
  canAdd: true,
  canLink: true,
  items: [],
  pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
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
  query.mockReturnValue({
    data,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  });
  add.mockResolvedValue({ evidence: item, created: true });
  link.mockResolvedValue({ evidence: item, linked: true });
});
async function completeAdd() {
  await userEvent.click(screen.getByRole("button", { name: "Add evidence" }));
  await userEvent.type(screen.getByLabelText("Evidence name *"), item.name);
  await userEvent.type(screen.getByLabelText("Source *"), item.source);
  await userEvent.type(
    screen.getByLabelText("Results, scope and supporting context *"),
    item.description,
  );
  await userEvent.type(
    screen.getByLabelText("Supporting document URL (HTTPS) *"),
    item.documentUrl,
  );
  fireEvent.change(screen.getByLabelText("Collected at (UTC+7) *"), {
    target: { value: "2020-01-01T10:20" },
  });
}
describe("Control Evidence dialog", () => {
  it("explains external permission/review boundaries and linked empty state", () => {
    render(<ControlEvidenceDialog controlId={id} onClose={vi.fn()} />);
    expect(
      screen.getByText(/does not upload, verify or grant access/),
    ).toBeVisible();
    expect(screen.getByText("No evidence linked")).toBeVisible();
    expect(query).toHaveBeenCalledWith(id, {
      page: 1,
      limit: 10,
      q: "",
      view: "linked",
    });
  });
  it("validates empty Add fields and focuses the first error", async () => {
    render(<ControlEvidenceDialog controlId={id} onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Add evidence" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Add and link evidence" }),
    );
    expect(screen.getByLabelText("Evidence name *")).toHaveFocus();
    expect(screen.getByLabelText("Evidence name *")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(add).not.toHaveBeenCalled();
  });
  it("adds only metadata and a stable requestId with explicit UTC+7 conversion", async () => {
    render(<ControlEvidenceDialog controlId={id} onClose={vi.fn()} />);
    await completeAdd();
    await userEvent.click(
      screen.getByRole("button", { name: "Add and link evidence" }),
    );
    expect(add).toHaveBeenCalledWith({
      controlId: id,
      body: {
        requestId: expect.stringMatching(/^[a-f0-9-]{36}$/),
        name: item.name,
        source: item.source,
        description: item.description,
        documentUrl: item.documentUrl,
        collectedAt: "2020-01-01T03:20:00.000Z",
        validUntil: null,
      },
    });
    await waitFor(() =>
      expect(
        screen.queryByLabelText("Evidence name *"),
      ).not.toBeInTheDocument(),
    );
    expect(success).toHaveBeenCalled();
    expect(link).not.toHaveBeenCalled();
  });
  it("rejects unsafe URLs and future collection before calling BE", async () => {
    render(<ControlEvidenceDialog controlId={id} onClose={vi.fn()} />);
    await completeAdd();
    await userEvent.clear(
      screen.getByLabelText("Supporting document URL (HTTPS) *"),
    );
    await userEvent.type(
      screen.getByLabelText("Supporting document URL (HTTPS) *"),
      "javascript:alert(1)",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Add and link evidence" }),
    );
    expect(
      screen.getByLabelText("Supporting document URL (HTTPS) *"),
    ).toHaveAttribute("aria-invalid", "true");
    await userEvent.clear(
      screen.getByLabelText("Supporting document URL (HTTPS) *"),
    );
    await userEvent.type(
      screen.getByLabelText("Supporting document URL (HTTPS) *"),
      item.documentUrl,
    );
    fireEvent.change(screen.getByLabelText("Collected at (UTC+7) *"), {
      target: { value: "2099-01-01T10:20" },
    });
    await userEvent.click(
      screen.getByRole("button", { name: "Add and link evidence" }),
    );
    expect(
      screen.getByText("Collection time cannot be in the future"),
    ).toBeVisible();
    expect(add).not.toHaveBeenCalled();
  });
  it("links a candidate with a relevance reason without creating a new Evidence", async () => {
    query.mockReturnValue({
      data: {
        ...data,
        items: [item],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      },
    });
    render(<ControlEvidenceDialog controlId={id} onClose={vi.fn()} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Link existing evidence" }),
    );
    await userEvent.click(
      screen.getByRole("radio", { name: `Select ${item.name}` }),
    );
    await userEvent.type(
      screen.getByLabelText("Why does this evidence support the Control? *"),
      "Tests the administrative MFA requirement",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Link selected evidence" }),
    );
    expect(link).toHaveBeenCalledWith({
      controlId: id,
      body: {
        evidenceId: id,
        reason: "Tests the administrative MFA requirement",
      },
    });
    expect(add).not.toHaveBeenCalled();
  });
  it("requires selection and a reason for Link", async () => {
    render(<ControlEvidenceDialog controlId={id} onClose={vi.fn()} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Link existing evidence" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Link selected evidence" }),
    );
    expect(screen.getByText("Select an evidence item above.")).toHaveFocus();
    expect(link).not.toHaveBeenCalled();
  });
  it("shows unreviewed references honestly and opens documents safely", () => {
    query.mockReturnValue({ data: { ...data, items: [item] } });
    render(<ControlEvidenceDialog controlId={id} onClose={vi.fn()} />);
    expect(screen.getByText(/Not reviewed/)).toBeVisible();
    const document = screen.getByRole("link", {
      name: /Open supporting document/,
    });
    expect(document).toHaveAttribute("href", item.documentUrl);
    expect(document).toHaveAttribute("rel", "noopener noreferrer");
    expect(document).toHaveAttribute("referrerpolicy", "no-referrer");
  });
  it("displays expired linked history without permitting candidate selection", async () => {
    query.mockReturnValue({
      data: {
        ...data,
        items: [
          { ...item, usable: false, status: "expired", documentUrl: null },
        ],
      },
    });
    render(<ControlEvidenceDialog controlId={id} onClose={vi.fn()} />);
    expect(screen.getByText("Not eligible for new assessment")).toBeVisible();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Link existing evidence" }),
    );
    expect(screen.getByRole("radio")).toBeDisabled();
  });
  it("keeps a failed draft and blocks repeat writes when access changes", async () => {
    add.mockRejectedValue(
      new ApiError("Control was reassigned", 403, "FORBIDDEN"),
    );
    render(<ControlEvidenceDialog controlId={id} onClose={vi.fn()} />);
    await completeAdd();
    await userEvent.click(
      screen.getByRole("button", { name: "Add and link evidence" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Close and reopen",
    );
    expect(screen.getByLabelText("Evidence name *")).toHaveValue(item.name);
    expect(
      screen.getByRole("button", { name: "Add and link evidence" }),
    ).toBeDisabled();
  });
  it("confirms discarding unsaved changes on Cancel and Escape", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const close = vi.fn();
    render(<ControlEvidenceDialog controlId={id} onClose={close} />);
    await userEvent.click(screen.getByRole("button", { name: "Add evidence" }));
    await userEvent.type(
      screen.getByLabelText("Evidence name *"),
      "Draft report",
    );
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent(
      screen.getByRole("dialog"),
      new Event("cancel", { cancelable: true }),
    );
    expect(confirm).toHaveBeenCalledTimes(2);
    expect(close).not.toHaveBeenCalled();
    confirm.mockRestore();
  });
  it("renders errors/loading and does not expose actions without response capability", () => {
    query.mockReturnValue({ isPending: true });
    const { rerender } = render(
      <ControlEvidenceDialog controlId={id} onClose={vi.fn()} />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Loading evidence");
    query.mockReturnValue({ isError: true, refetch: vi.fn() });
    rerender(<ControlEvidenceDialog controlId={id} onClose={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
    query.mockReturnValue({ data: { ...data, canAdd: false, canLink: false } });
    rerender(<ControlEvidenceDialog controlId={id} onClose={vi.fn()} />);
    expect(
      screen.queryByRole("button", { name: "Add evidence" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Link existing evidence" }),
    ).not.toBeInTheDocument();
  });
});
