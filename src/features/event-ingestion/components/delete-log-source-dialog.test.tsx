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
import { ApiError } from "@/lib/api/api-error";

const { mutateAsyncMock, successMock } = vi.hoisted(() => ({
  mutateAsyncMock: vi.fn(),
  successMock: vi.fn(),
}));

vi.mock("../hooks/use-log-sources", () => ({
  useDeleteLogSource: () => ({
    isPending: false,
    mutateAsync: mutateAsyncMock,
  }),
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: successMock }),
}));

import { DeleteLogSourceDialog } from "./delete-log-source-dialog";

const source = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Core Firewall",
  sourceType: "firewall" as const,
  asset: null,
  integration: null,
  configuration: {
    format: "syslog" as const,
    timezone: "UTC",
    collectRawPayload: true,
  },
  status: "active" as const,
  lastReceivedAt: null,
  createdAt: "2026-09-10T00:00:00.000Z",
  updatedAt: "2026-09-10T00:00:00.000Z",
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

describe("DeleteLogSourceDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutateAsyncMock.mockResolvedValue(undefined);
  });

  it("requires the exact source name before deleting", async () => {
    const user = userEvent.setup();
    render(<DeleteLogSourceDialog onClose={vi.fn()} source={source} />);
    const button = screen.getByRole("button", { name: "Delete log source" });
    expect(button).toBeDisabled();

    await user.type(screen.getByLabelText(/Enter Core Firewall/), source.name);
    expect(button).toBeEnabled();
    await user.click(button);

    await waitFor(() =>
      expect(mutateAsyncMock).toHaveBeenCalledWith(source.id),
    );
    expect(successMock).toHaveBeenCalledWith("Log source deleted", source.name);
  });

  it("explains dependency conflicts and keeps the dialog open", async () => {
    const user = userEvent.setup();
    mutateAsyncMock.mockRejectedValue(
      new ApiError("Conflict", 409, "CONFLICT"),
    );
    render(<DeleteLogSourceDialog onClose={vi.fn()} source={source} />);
    await user.type(screen.getByLabelText(/Enter Core Firewall/), source.name);
    await user.click(screen.getByRole("button", { name: "Delete log source" }));

    expect(
      await screen.findByText(/Deactivate it instead/),
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveAttribute("open");
  });
});
