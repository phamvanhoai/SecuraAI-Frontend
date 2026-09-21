import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { IssuedCertificatesManager } from "./issued-certificates-manager";

const mocks = vi.hoisted(() => ({ session: vi.fn(), query: vi.fn() }));
vi.mock("@/features/auth", () => ({ useSessionUser: mocks.session }));
vi.mock("../hooks/use-issued-certificates", () => ({
  useIssuedCertificates: mocks.query,
}));

describe("IssuedCertificatesManager", () => {
  beforeAll(() => {
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close = function close() {
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    };
  });
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.session.mockReturnValue({
      isPending: false,
      isError: false,
      data: { permissions: ["training-certificates.read-issued"] },
    });
    mocks.query.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        items: [
          {
            id: "00000000-0000-4000-8000-000000000001",
            number: "SEC-TR-123",
            issuedAt: "2026-09-20T00:00:00.000Z",
            issuedBy: "Officer",
            enrollmentId: "00000000-0000-4000-8000-000000000002",
            completedAt: "2026-09-19T00:00:00.000Z",
            learner: {
              name: "Employee One",
              email: "employee@example.com",
              employeeCode: "E001",
              department: "Operations",
            },
            campaignTitle: "Autumn",
            courseTitle: "Phishing",
          },
        ],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      },
    });
  });
  afterEach(cleanup);

  it("shows records and complete issuance details", () => {
    render(<IssuedCertificatesManager />);
    expect(screen.getByText("Employee One")).toBeVisible();
    expect(screen.getByText("SEC-TR-123")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "View details" }));
    expect(
      screen.getByRole("dialog", { name: "Certificate details" }),
    ).toHaveAttribute("open");
    expect(screen.getByText("Certificate of completion")).toBeVisible();
    expect(screen.getByText("Operations")).toBeVisible();
    expect(screen.getByText("Officer")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /download/i }),
    ).not.toBeInTheDocument();
  });

  it("applies search only after submission", () => {
    render(<IssuedCertificatesManager />);
    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search certificates" }),
      {
        target: { value: "Employee One" },
      },
    );
    expect(mocks.query).toHaveBeenLastCalledWith(1, "", true);
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    expect(mocks.query).toHaveBeenLastCalledWith(1, "Employee One", true);
  });

  it("does not query when permission is missing", () => {
    mocks.session.mockReturnValue({
      isPending: false,
      isError: false,
      data: { permissions: [] },
    });
    render(<IssuedCertificatesManager />);
    expect(mocks.query).toHaveBeenLastCalledWith(1, "", false);
    expect(screen.getByText(/do not have permission/)).toBeVisible();
  });
});
