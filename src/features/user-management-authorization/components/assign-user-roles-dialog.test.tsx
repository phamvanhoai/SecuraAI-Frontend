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

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  toastSuccess: vi.fn(),
  ownsRisk: false,
}));
vi.mock("../hooks/use-assign-user-roles", () => ({
  useAccessAssignmentOptions: () => ({
    data: {
      roles: [
        { code: "EMPLOYEE", name: "Employee" },
        { code: "EXECUTIVE", name: "Executive" },
      ],
      scopeCodes: [
        { code: "RISK_OWNER", name: "Risk Owner" },
        { code: "CONTROL_OWNER", name: "Control Owner" },
        { code: "ASSET_OWNER", name: "Asset Owner" },
        { code: "AUTHORIZED_APPROVER", name: "Authorized Approver" },
      ],
    },
    isPending: false,
    isError: false,
  }),
  useUserAccessAssignment: () => ({
    data: {
      user: {
        id: "00000000-0000-4000-8000-000000000010",
        fullName: "Test User",
        email: "test@example.com",
      },
      role: "EMPLOYEE",
      scopes: mocks.ownsRisk ? [{ scopeCode: "RISK_OWNER" }] : [],
      ownershipSummary: {
        risks: mocks.ownsRisk ? 2 : 0,
        assets: 0,
        securityControls: 0,
      },
    },
    isPending: false,
    isError: false,
    isSuccess: true,
    refetch: vi.fn(),
  }),
  useAssignUserAccess: () => ({
    mutateAsync: mocks.mutateAsync,
    isPending: false,
  }),
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: mocks.toastSuccess }),
}));
import { AssignUserRolesDialog } from "./assign-user-roles-dialog";

beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.setAttribute("open", "");
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.removeAttribute("open");
    },
  });
});
beforeEach(() => {
  mocks.ownsRisk = false;
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Employee responsibilities", () => {
  it("clears the selected responsibility when clicked again", async () => {
    mocks.mutateAsync.mockResolvedValue({ changed: true });
    const user = userEvent.setup();
    render(<AssignUserRolesDialog userId="00000000-0000-4000-8000-000000000010" onClose={vi.fn()} />);
    const checkbox = screen.getByRole("checkbox", { name: /Authorized Approver/ });
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
    await user.click(screen.getByRole("button", { name: "Save assignment" }));
    expect(mocks.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ payload: { role: "EMPLOYEE", scopes: [] } }));
  });
  it("saves business responsibilities while retaining Employee", async () => {
    mocks.mutateAsync.mockResolvedValue({ changed: true });
    const user = userEvent.setup();
    render(
      <AssignUserRolesDialog
        userId="00000000-0000-4000-8000-000000000010"
        onClose={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("checkbox", { name: /Risk Owner/ }));
    await user.click(screen.getByRole("checkbox", { name: /Asset Owner/ }));
    await user.click(screen.getByRole("checkbox", { name: /Authorized Approver/ }));
    await user.click(screen.getByRole("button", { name: "Save assignment" }));
    await waitFor(() =>
      expect(mocks.mutateAsync).toHaveBeenCalledWith({
        userId: "00000000-0000-4000-8000-000000000010",
        payload: {
          role: "EMPLOYEE",
          scopes: [
            { scopeCode: "AUTHORIZED_APPROVER", targetType: "GLOBAL", expiresAt: null },
          ],
        },
      }),
    );
    expect(
      screen.queryByText("Supplemental access scopes"),
    ).not.toBeInTheDocument();
  });
  it("requires transfer before removing responsibilities or changing an owning Employee role", () => {
    mocks.ownsRisk = true;
    render(
      <AssignUserRolesDialog
        userId="00000000-0000-4000-8000-000000000010"
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole("checkbox", { name: /Risk Owner/ })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /Asset Owner/ })).toBeDisabled();
    expect(screen.getByLabelText("Assigned role")).toBeDisabled();
  });
  it("clears responsibilities when selecting another system role", async () => {
    mocks.mutateAsync.mockResolvedValue({ changed: true });
    const user = userEvent.setup();
    render(
      <AssignUserRolesDialog
        userId="00000000-0000-4000-8000-000000000010"
        onClose={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("checkbox", { name: /Control Owner/ }));
    await user.selectOptions(screen.getByLabelText("Assigned role"), "EXECUTIVE");
    await user.click(screen.getByRole("button", { name: "Save assignment" }));
    expect(mocks.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ payload: { role: "EXECUTIVE", scopes: [] } }),
    );
  });
});
