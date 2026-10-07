import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/api-error";
const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  session: vi.fn(),
  services: vi.fn(),
  query: "",
  refetch: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
  useSearchParams: () => new URLSearchParams(mocks.query),
  usePathname: () => "/assets/business-services",
}));
vi.mock("@/features/authentication-account", () => ({
  useSessionUser: mocks.session,
}));
vi.mock("../hooks/use-business-services", () => ({
  useBusinessServices: mocks.services,
}));
vi.mock("./business-service-detail-dialog", () => ({
  BusinessServiceDetailDialog: ({ serviceId }: { serviceId: string }) => (
    <span>Selected {serviceId}</span>
  ),
}));
vi.mock("./deactivate-business-service-dialog", () => ({
  DeactivateBusinessServiceDialog: () => <span>Deactivate dialog opened</span>,
}));
import { BusinessServicesShell } from "./business-services-shell";
const id = "00000000-0000-4000-8000-000000000001";
const data = {
  items: [
    {
      id,
      name: "Customer Support",
      status: "inactive",
      owner: { fullName: "Service Owner", inactive: true },
      linkedAssetsCount: 4,
    },
  ],
  pagination: { page: 1, limit: 10, total: 11, totalPages: 2 },
};
afterEach(cleanup);
describe("Business Services directory", () => {
  it("shows Deactivate only for an eligible capability on Active rows", async () => {
    mocks.session.mockReturnValue({
      isPending: false,
      data: {
        permissions: ["business-services.read", "business-services.deactivate"],
      },
    });
    mocks.services.mockReturnValue({
      isPending: false,
      data: { ...data, items: [{ ...data.items[0], status: "active" }] },
    });
    render(<BusinessServicesShell />);
    await userEvent.click(
      screen.getByRole("button", { name: "Actions for Customer Support" }),
    );
    expect(
      screen.queryByRole("button", { name: "Edit Customer Support" }),
    ).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Deactivate Customer Support" }),
    );
    expect(screen.getByText("Deactivate dialog opened")).toBeInTheDocument();
  });
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.query = "";
    mocks.session.mockReturnValue({
      isPending: false,
      data: { permissions: ["business-services.read"] },
    });
    mocks.services.mockReturnValue({
      data,
      isPending: false,
      isError: false,
      refetch: mocks.refetch,
    });
  });
  it("shows real data, explicit inactive owner and read-only actions", async () => {
    render(<BusinessServicesShell />);
    expect(screen.getByText("Service Owner (Inactive)")).toBeInTheDocument();
    expect(
      screen.getByText("Inactive", { selector: "span" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Business Services" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      screen.queryByRole("button", { name: /Create|Edit|Deactivate/ }),
    ).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Actions for Customer Support" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "View details for Customer Support" }),
    );
    expect(screen.getByText(`Selected ${id}`)).toBeInTheDocument();
  });
  it("submits search/status to BE query via URL and resets page", async () => {
    render(<BusinessServicesShell />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Search"), " support ");
    await user.selectOptions(screen.getByLabelText("Status"), "inactive");
    await user.click(screen.getByRole("button", { name: "Search" }));
    expect(mocks.push).toHaveBeenCalledWith(
      "/assets/business-services?page=1&limit=10&q=support&status=inactive",
    );
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(mocks.push).toHaveBeenCalledWith(
      "/assets/business-services?page=2&limit=10",
    );
  });
  it("clears filters and restores controls on browser navigation", async () => {
    mocks.query = "q=support&status=inactive";
    const { rerender } = render(<BusinessServicesShell />);
    await userEvent.click(
      screen.getByRole("button", { name: "Clear filters" }),
    );
    expect(mocks.push).toHaveBeenCalledWith("/assets/business-services");
    mocks.query = "q=database";
    rerender(<BusinessServicesShell />);
    expect(screen.getByLabelText("Search")).toHaveValue("database");
  });
  it("does not query when capability is absent", () => {
    mocks.session.mockReturnValue({
      isPending: false,
      data: { permissions: ["assets.read"] },
    });
    render(<BusinessServicesShell />);
    expect(
      screen.getByText("You do not have permission to view business services"),
    ).toBeInTheDocument();
    expect(mocks.services).toHaveBeenCalledWith(expect.any(Object), false);
  });
  it("shows matching loading and actionable empty states", () => {
    mocks.services.mockReturnValue({ isPending: true });
    const { rerender } = render(<BusinessServicesShell />);
    expect(screen.queryByText("Customer Support")).not.toBeInTheDocument();
    mocks.services.mockReturnValue({
      data: { ...data, items: [] },
      isPending: false,
    });
    rerender(<BusinessServicesShell />);
    expect(screen.getByText("No business services found")).toBeInTheDocument();
  });
  it("offers retry for connection failures, not stale forbidden access", async () => {
    mocks.services.mockReturnValue({
      isError: true,
      error: new Error(),
      refetch: mocks.refetch,
    });
    const { rerender } = render(<BusinessServicesShell />);
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(mocks.refetch).toHaveBeenCalled();
    mocks.services.mockReturnValue({
      isError: true,
      error: new ApiError("Forbidden", 403, "FORBIDDEN"),
    });
    rerender(<BusinessServicesShell />);
    expect(
      screen.getByText("Business service access denied"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Try again" }),
    ).not.toBeInTheDocument();
  });
  it("rejects invalid URL filters without querying", () => {
    mocks.query = "limit=101";
    render(<BusinessServicesShell />);
    expect(screen.getByText("Invalid filters.")).toBeInTheDocument();
    expect(mocks.services).toHaveBeenCalledWith(expect.any(Object), false);
  });
});
