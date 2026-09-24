import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { LogSourceDetailDialog } from "./log-source-detail-dialog";

const source = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Core Firewall",
  sourceType: "firewall" as const,
  asset: {
    id: "00000000-0000-4000-8000-000000000002",
    assetCode: "AST-001",
    name: "Gateway",
  },
  integration: null,
  configuration: {
    format: "syslog" as const,
    timezone: "UTC",
    collectRawPayload: true,
    pollingIntervalSeconds: 60,
    fieldMapping: { timestamp: "event_time" },
  },
  status: "active" as const,
  lastReceivedAt: "2026-09-10T08:30:00.000Z",
  createdAt: "2026-09-09T08:30:00.000Z",
  updatedAt: "2026-09-10T08:30:00.000Z",
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

describe("LogSourceDetailDialog", () => {
  it("shows the complete backend-backed source details", () => {
    render(<LogSourceDetailDialog onClose={vi.fn()} source={source} />);

    expect(screen.getByRole("dialog")).toHaveAttribute("open");
    expect(screen.getByText("Core Firewall")).toBeInTheDocument();
    expect(screen.getByText("AST-001 — Gateway")).toBeInTheDocument();
    expect(screen.getByText("60 seconds")).toBeInTheDocument();
    expect(screen.getByText("SYSLOG")).toBeInTheDocument();
  });

  it("closes through the secondary action", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<LogSourceDetailDialog onClose={onClose} source={source} />);

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
