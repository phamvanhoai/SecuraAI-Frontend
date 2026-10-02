import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createMock, updateMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
  updateMock: vi.fn(),
}));

vi.mock("../hooks/use-log-sources", () => ({
  useLogSourceMetrics: () => ({
    data: { total: 0, active: 0, receiving: 0, errors: 0 },
  }),
  useLogSources: () => ({
    data: {
      items: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    },
    isError: false,
    isPending: false,
  }),
  useCreateLogSource: () => ({ isPending: false, mutateAsync: createMock }),
  useUpdateLogSource: () => ({ isPending: false, mutateAsync: updateMock }),
  useDeleteLogSource: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));

vi.mock("../hooks/use-event-sources", () => ({
  useEventSources: () => ({
    data: {
      items: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
    },
    isError: false,
    isPending: false,
  }),
  useEventSource: () => ({
    data: undefined,
    isError: false,
    isPending: false,
  }),
  useCreateEventSource: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useUpdateEventSource: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useTestEventSourceConnection: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useImportEvents: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useBatchDetail: () => ({ isPending: false, isError: false, data: undefined }),
  useBatchInvalidEvents: () => ({ isPending: false, isError: false, data: undefined }),
  useSourceBatches: () => ({ isPending: false, isError: false, data: undefined }),
}));

vi.mock("../hooks/use-normalized-events", () => ({
  useNormalizedEventMetrics: () => ({
    data: {
      totalEvents: 0,
      totalMapped: 0,
      totalUnmapped: 0,
      eventsLast24Hours: 0,
      byFamily: { AUTHENTICATION: 0, VPN_SSO: 0, APPLICATION_ACCESS: 0 },
    },
    isPending: false,
  }),
  useNormalizedEvents: () => ({
    data: {
      items: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    },
    isPending: false,
    error: null,
  }),
  useNormalizedEventDetail: () => ({
    data: undefined,
    isPending: false,
    error: null,
  }),
}));

vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

import { LogSourcesManager } from "./log-sources-manager";

describe("LogSourcesManager", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows required errors beside fields before calling the API", async () => {
    const user = userEvent.setup();
    render(<LogSourcesManager />);
    await user.click(
      screen.getByRole("button", { name: /Legacy log sources/i }),
    );
    await user.click(
      screen.getByRole("button", { name: "Configure log source" }),
    );
    await user.click(screen.getByRole("button", { name: "Save" }));

    const name = screen.getByLabelText("Name");
    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(name).toHaveAttribute("aria-describedby", "log-source-name-error");
    expect(createMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });
});
