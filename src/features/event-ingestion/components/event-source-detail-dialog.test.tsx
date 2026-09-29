import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mockUseEventSource = vi.fn();

vi.mock("../hooks/use-event-sources", () => ({
  useEventSource: (id: string | null) => mockUseEventSource(id),
}));

import { EventSourceDetailDialog } from "./event-source-detail-dialog";

const mockDetailData = {
  id: "3a9bf33a-02db-48e4-a8ad-90517278d7f2",
  name: "Wazuh Production SIEM",
  sourceType: "WAZUH",
  endpoint: "https://wazuh.internal:55000",
  ingestionMethod: "API" as const,
  authenticationType: "API_KEY",
  status: "ACTIVE" as const,
  description: "Enterprise SIEM event collector",
  eventFamilies: ["AUTHENTICATION" as const, "VPN_SSO" as const],
  createdBy: "9a9bf33a-02db-48e4-a8ad-90517278d7f2",
  creator: {
    id: "9a9bf33a-02db-48e4-a8ad-90517278d7f2",
    email: "secops@secura.ai",
    fullName: "Security Operations",
  },
  apiKeys: [
    {
      id: "key-1",
      name: "Wazuh Ingestion Agent Key",
      keyPrefix: "sec_live_wazuh_agent",
      maskedKey: "sec_live_wazuh_agent...****",
      status: "ACTIVE" as const,
      expiresAt: "2027-09-20T10:00:00.000Z",
      lastUsedAt: "2026-09-28T14:00:00.000Z",
      lastUsedIp: "10.0.0.45",
      createdAt: "2026-09-20T10:05:00.000Z",
    },
  ],
  stats: {
    totalIngestedEvents: 25420,
    totalBatches: 310,
    lastIngestedAt: "2026-09-28T14:00:00.000Z",
  },
  createdAt: "2026-09-20T10:00:00.000Z",
  updatedAt: "2026-09-27T12:00:00.000Z",
};

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

describe("EventSourceDetailDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps dialog closed when sourceId is null", () => {
    mockUseEventSource.mockReturnValue({
      isPending: false,
      isError: false,
      data: undefined,
    });

    render(<EventSourceDetailDialog onClose={vi.fn()} sourceId={null} />);
    expect(screen.getByRole("dialog", { hidden: true })).not.toHaveAttribute("open");
  });

  it("renders error message when query fails", () => {
    mockUseEventSource.mockReturnValue({
      isPending: false,
      isError: true,
      data: undefined,
    });

    render(
      <EventSourceDetailDialog
        onClose={vi.fn()}
        sourceId="3a9bf33a-02db-48e4-a8ad-90517278d7f2"
      />,
    );

    expect(
      screen.getByText(/Unable to load event source details/i),
    ).toBeInTheDocument();
  });

  it("renders comprehensive configuration details with masked credentials and stats", () => {
    mockUseEventSource.mockReturnValue({
      isPending: false,
      isError: false,
      data: mockDetailData,
    });

    render(
      <EventSourceDetailDialog
        onClose={vi.fn()}
        sourceId="3a9bf33a-02db-48e4-a8ad-90517278d7f2"
      />,
    );

    expect(screen.getByText("Wazuh Production SIEM")).toBeInTheDocument();
    expect(screen.getByText("WAZUH")).toBeInTheDocument();
    expect(screen.getAllByText("Active").length).toBeGreaterThan(0);
    expect(screen.getByText("https://wazuh.internal:55000")).toBeInTheDocument();
    expect(screen.getByText("API")).toBeInTheDocument();
    expect(screen.getByText("API_KEY")).toBeInTheDocument();
    expect(screen.getByText("Enterprise SIEM event collector")).toBeInTheDocument();

    expect(screen.getByText("Authentication")).toBeInTheDocument();
    expect(screen.getByText("VPN / SSO")).toBeInTheDocument();

    expect(screen.getByText("Wazuh Ingestion Agent Key")).toBeInTheDocument();
    expect(screen.getByText("sec_live_wazuh_agent...****")).toBeInTheDocument();
    expect(screen.getByText("IP: 10.0.0.45")).toBeInTheDocument();

    expect(screen.getByText("25,420")).toBeInTheDocument();
    expect(screen.getByText("310")).toBeInTheDocument();

    expect(screen.getByText("Security Operations")).toBeInTheDocument();
  });
});
