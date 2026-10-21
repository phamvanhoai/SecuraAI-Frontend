import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ exportLogs: vi.fn(), success: vi.fn() }));
vi.mock("../hooks/use-system-log-search", () => ({
  useSystemLogSearch: () => ({
    data: { items: [], pagination: { page: 1, pageCount: 1, total: 2 } },
    isPending: false,
    isError: false,
  }),
}));
vi.mock("../hooks/use-system-log-detail", () => ({
  useSystemLogDetail: () => ({
    data: undefined,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));
vi.mock("../api/export-investigation-logs", () => ({
  exportInvestigationLogs: mocks.exportLogs,
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: mocks.success }),
}));
import { AdvancedSystemLogSearch } from "./advanced-system-log-search";
beforeEach(() => {
  vi.clearAllMocks();
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});
afterEach(cleanup);
describe("Investigation log export errors", () => {
  it("shows selection and purpose validation inside the modal without submitting", async () => {
    const user = userEvent.setup();
    render(<AdvancedSystemLogSearch canExport />);
    await user.click(screen.getByRole("button", { name: "Export logs" }));
    const dialog = screen.getByRole("dialog", {
      name: "Export Investigation Logs",
    });
    await user.click(
      within(dialog).getByRole("button", { name: "Generate export" }),
    );
    expect(
      within(dialog).getByText(/Select at least one log from the table/),
    ).toBeVisible();
    expect(
      within(dialog).getByText(
        /Enter an investigation purpose of at least 10 characters/,
      ),
    ).toBeVisible();
    expect(mocks.exportLogs).not.toHaveBeenCalled();
    await user.click(
      within(dialog).getByRole("radio", { name: /All matching results/ }),
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Generate export" }),
    );
    expect(
      within(dialog).getByRole("textbox", { name: /Investigation purpose/ }),
    ).toHaveFocus();
    expect(
      within(dialog).getByRole("textbox", { name: /Investigation purpose/ }),
    ).toHaveAttribute("aria-invalid", "true");
  });
  it("retains the form and shows request failures inside the modal", async () => {
    mocks.exportLogs.mockRejectedValue(
      new Error("Export service unavailable. Try again."),
    );
    const user = userEvent.setup();
    render(<AdvancedSystemLogSearch canExport />);
    await user.click(screen.getByRole("button", { name: "Export logs" }));
    const dialog = screen.getByRole("dialog", {
      name: "Export Investigation Logs",
    });
    await user.click(
      within(dialog).getByRole("radio", { name: /All matching results/ }),
    );
    await user.type(
      within(dialog).getByRole("textbox", { name: /Investigation purpose/ }),
      "Investigate notification delivery",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Generate export" }),
    );
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Export service unavailable",
    );
    expect(dialog).toHaveAttribute("open");
    expect(
      within(dialog).getByRole("textbox", { name: /Investigation purpose/ }),
    ).toHaveValue("Investigate notification delivery");
  });
});
