import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MyCertificatesManager } from "./my-certificates-manager";

const mocks = vi.hoisted(() => ({ session: vi.fn(), query: vi.fn() }));
vi.mock("@/features/authentication-account", () => ({ useSessionUser: mocks.session }));
vi.mock("../hooks/use-my-certificates", () => ({
  useMyCertificates: mocks.query,
}));

describe("MyCertificatesManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.session.mockReturnValue({
      isPending: false,
      isError: false,
      data: { permissions: ["training-certificates.read-own"] },
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
            campaignTitle: "Autumn",
            courseTitle: "Phishing",
          },
        ],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      },
    });
  });
  afterEach(cleanup);

  it("shows issued certificates and details without pretending a PDF exists", () => {
    render(<MyCertificatesManager />);
    expect(screen.getByText("SEC-TR-123")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "View details" }));
    expect(screen.getByText("Officer")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /download/i }),
    ).not.toBeInTheDocument();
  });

  it("submits search instead of filtering on each keystroke", () => {
    render(<MyCertificatesManager />);
    fireEvent.change(
      screen.getByRole("textbox", { name: "Search certificates" }),
      { target: { value: "Phishing" } },
    );
    expect(mocks.query).toHaveBeenLastCalledWith(1, "", true);
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    expect(mocks.query).toHaveBeenLastCalledWith(1, "Phishing", true);
  });

  it("does not query when permission is missing", () => {
    mocks.session.mockReturnValue({
      isPending: false,
      isError: false,
      data: { permissions: [] },
    });
    render(<MyCertificatesManager />);
    expect(mocks.query).toHaveBeenLastCalledWith(1, "", false);
    expect(screen.getByText(/do not have permission/)).toBeInTheDocument();
  });
});
