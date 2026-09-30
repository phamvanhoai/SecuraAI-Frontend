import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mockTestConnection = vi.fn();

vi.mock("../hooks/use-event-sources", () => ({
  useTestEventSourceConnection: () => ({
    isPending: false,
    mutateAsync: mockTestConnection,
  }),
}));

import { TestEventSourceDialog } from "./test-event-source-dialog";

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

describe("TestEventSourceDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the dialog with initial values and inputs", () => {
    render(
      <TestEventSourceDialog
        initialEndpoint="https://192.168.56.101:55000"
        initialUsername="wazuh-wui"
        isOpen={true}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Test Event Source Connection" }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("https://192.168.56.101:55000")).toBeInTheDocument();
    expect(screen.getByDisplayValue("wazuh-wui")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Run Connection Test" }),
    ).toBeInTheDocument();
  });

  it("executes connection test and renders successful diagnostics", async () => {
    mockTestConnection.mockResolvedValue({
      connected: true,
      statusCode: 200,
      latencyMs: 135,
      message: "Wazuh API connected and authenticated successfully",
      provider: "wazuh",
      details: {
        title: "Wazuh REST API",
        apiVersion: "v4.8.0",
        hostname: "wazuh-manager-01",
      },
      verifySslWarning: false,
    });

    const user = userEvent.setup();
    render(
      <TestEventSourceDialog
        initialEndpoint="https://192.168.56.101:55000"
        isOpen={true}
        onClose={vi.fn()}
      />,
    );

    const testButton = screen.getByRole("button", { name: "Run Connection Test" });
    await user.click(testButton);

    expect(mockTestConnection).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "https://192.168.56.101:55000",
        username: "wazuh-wui",
        verifySsl: false,
        timeoutMs: 10000,
      }),
    );

    expect(await screen.findByText("Connection Successful")).toBeInTheDocument();
    expect(screen.getByText("135 ms")).toBeInTheDocument();
    expect(screen.getByText("HTTP 200")).toBeInTheDocument();
    expect(screen.getByText("v4.8.0")).toBeInTheDocument();
    expect(screen.getByText("wazuh-manager-01")).toBeInTheDocument();
  });

  it("displays failure diagnostics when connection fails", async () => {
    mockTestConnection.mockResolvedValue({
      connected: false,
      statusCode: 401,
      latencyMs: 80,
      message: "Authentication failed: Invalid Wazuh username or password",
      provider: "wazuh",
      details: null,
      verifySslWarning: false,
    });

    const user = userEvent.setup();
    render(
      <TestEventSourceDialog
        initialEndpoint="https://192.168.56.101:55000"
        isOpen={true}
        onClose={vi.fn()}
      />,
    );

    const testButton = screen.getByRole("button", { name: "Run Connection Test" });
    await user.click(testButton);

    expect(await screen.findByText("Connection Failed")).toBeInTheDocument();
    expect(
      screen.getByText("Authentication failed: Invalid Wazuh username or password"),
    ).toBeInTheDocument();
    expect(screen.getByText("HTTP 401")).toBeInTheDocument();
  });
});
