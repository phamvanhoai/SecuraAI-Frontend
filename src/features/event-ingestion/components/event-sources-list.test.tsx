import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mockUseEventSources = vi.fn();

vi.mock("../hooks/use-event-sources", () => ({
  useEventSources: (params?: unknown) => mockUseEventSources(params),
  useEventSource: () => ({ isPending: false, isError: false, data: undefined }),
  useCreateEventSource: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useUpdateEventSource: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useTestEventSourceConnection: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));

vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

import { EventSourcesList } from "./event-sources-list";

const mockItems = [
  {
    id: "3a9bf33a-02db-48e4-a8ad-90517278d7f2",
    name: "Wazuh Production SIEM",
    sourceType: "WAZUH",
    endpoint: "https://wazuh.internal:55000",
    ingestionMethod: "API" as const,
    authenticationType: "BEARER_TOKEN",
    status: "ACTIVE" as const,
    description: "Enterprise security log collection",
    eventFamilies: ["AUTHENTICATION" as const, "VPN_SSO" as const],
    createdBy: "9a9bf33a-02db-48e4-a8ad-90517278d7f2",
    createdAt: "2026-09-20T10:00:00.000Z",
    updatedAt: "2026-09-27T12:00:00.000Z",
  },
];

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
      this.dispatchEvent(new Event("close"));
    },
  });
});

afterEach(cleanup);

describe("EventSourcesList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading skeleton when query is pending", () => {
    mockUseEventSources.mockReturnValue({
      isPending: true,
      isError: false,
      data: undefined,
    });

    render(<EventSourcesList />);
    expect(screen.getByLabelText("Loading event sources")).toBeInTheDocument();
  });

  it("renders error alert when query fails", () => {
    mockUseEventSources.mockReturnValue({
      isPending: false,
      isError: true,
      data: undefined,
    });

    render(<EventSourcesList />);
    expect(
      screen.getByText(/Unable to load event sources/i),
    ).toBeInTheDocument();
  });

  it("renders empty state when no event sources exist", () => {
    mockUseEventSources.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        items: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
      },
    });

    render(<EventSourcesList />);
    expect(screen.getByText("No event sources found")).toBeInTheDocument();
  });

  it("renders list of event sources and handles search", async () => {
    mockUseEventSources.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        items: mockItems,
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      },
    });

    const user = userEvent.setup();
    render(<EventSourcesList />);

    expect(screen.getByText("Wazuh Production SIEM")).toBeInTheDocument();
    expect(screen.getByText("WAZUH")).toBeInTheDocument();
    expect(screen.getAllByText("Active").length).toBeGreaterThan(0);
    expect(screen.getByText("Authentication")).toBeInTheDocument();
    expect(screen.getByText("VPN / SSO")).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText("Search by name or source type");
    await user.type(searchInput, "Wazuh");
    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(mockUseEventSources).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 20,
        q: "Wazuh",
      }),
    );
  });

  it("opens EventSourceDetailDialog when clicking Details button", async () => {
    mockUseEventSources.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        items: mockItems,
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      },
    });

    const user = userEvent.setup();
    render(<EventSourcesList />);

    const detailsButton = screen.getByRole("button", { name: /Details/i });
    await user.click(detailsButton);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("opens ToggleEventSourceStatusDialog when clicking Pause button", async () => {
    mockUseEventSources.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        items: mockItems,
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      },
    });

    const user = userEvent.setup();
    render(<EventSourcesList />);

    const pauseButton = screen.getByRole("button", { name: /Pause/i });
    await user.click(pauseButton);

    expect(screen.getByText("Pause Event Ingestion")).toBeInTheDocument();
  });
});
