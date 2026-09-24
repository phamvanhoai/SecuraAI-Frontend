import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PolicyControlMappingManager } from "./policy-control-mapping-manager";

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  useMappings: vi.fn(),
  useFrameworks: vi.fn(),
  useControls: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("@/features/authentication-account", () => ({ useSessionUser: mocks.session }));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: vi.fn() }),
}));
vi.mock("../hooks/use-policy-control-mappings", () => ({
  usePolicyControlMappings: mocks.useMappings,
  useComplianceFrameworks: mocks.useFrameworks,
  useFrameworkControls: mocks.useControls,
  useReplacePolicyControlMappings: () => ({
    isPending: false,
    mutateAsync: mocks.replace,
  }),
}));

afterEach(cleanup);

describe("PolicyControlMappingManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    HTMLDialogElement.prototype.showModal = function showModal(): void {
      this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close = function close(): void {
      this.removeAttribute("open");
    };
    mocks.session.mockReturnValue({
      data: { permissions: ["compliance.map-controls"] },
      isPending: false,
    });
    mocks.useMappings.mockReturnValue({
      data: {
        items: [
          {
            policyId: "00000000-0000-4000-8000-000000000001",
            policyCode: "ISP-001",
            title: "Access control policy",
            versionId: "00000000-0000-4000-8000-000000000002",
            versionNumber: "1.0",
            publishedAt: "2026-09-16T00:00:00.000Z",
            mappings: [],
          },
        ],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      },
      isPending: false,
      isError: false,
    });
    mocks.useFrameworks.mockReturnValue({
      data: [
        {
          id: "00000000-0000-4000-8000-000000000003",
          code: "ISO27001",
          name: "ISO/IEC 27001",
          version: "2022",
          description: null,
          controlCount: 1,
        },
      ],
      isError: false,
    });
    mocks.useControls.mockReturnValue({
      data: {
        items: [
          {
            id: "00000000-0000-4000-8000-000000000004",
            code: "A.5.15",
            title: "Access control",
            description: null,
            parentControlId: null,
          },
        ],
        pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
      },
      isPending: false,
      isError: false,
    });
    mocks.replace.mockResolvedValue({});
  });

  it("maps a published policy version to a framework control", async () => {
    const user = userEvent.setup();
    render(<PolicyControlMappingManager />);
    await user.click(screen.getByRole("button", { name: "Map controls" }));
    await user.click(screen.getByRole("checkbox", { name: /A.5.15/ }));
    await user.click(screen.getByRole("button", { name: "Save mappings" }));
    expect(mocks.replace).toHaveBeenCalledWith({
      policyId: "00000000-0000-4000-8000-000000000001",
      versionId: "00000000-0000-4000-8000-000000000002",
      frameworkId: "00000000-0000-4000-8000-000000000003",
      body: {
        mappings: [
          {
            controlId: "00000000-0000-4000-8000-000000000004",
            notes: null,
          },
        ],
      },
    });
  });
});
