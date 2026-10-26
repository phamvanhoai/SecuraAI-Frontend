import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ query: vi.fn(), retry: vi.fn() }));
vi.mock("../hooks/use-asset-classification-history", () => ({
  useAssetClassificationHistory: mocks.query,
}));
import { AssetClassificationHistory } from "./asset-classification-history";
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
describe("classification history", () => {
  it("shows loading and retry without fabricating history", async () => {
    mocks.query.mockReturnValue({ isPending: true });
    const view = render(<AssetClassificationHistory assetId="asset" />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading classification history",
    );
    mocks.query.mockReturnValue({
      isPending: false,
      isError: true,
      refetch: mocks.retry,
    });
    view.rerender(<AssetClassificationHistory assetId="asset" />);
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(mocks.retry).toHaveBeenCalled();
  });
  it("renders the saved before/after basis and paginates", async () => {
    const after = {
      confidentialityImpact: 1,
      integrityImpact: 1,
      availabilityImpact: 5,
      businessImpact: 2,
      criticality: "critical",
      dataClassification: "public",
      rationale: "An outage stops essential service.",
      dataClassificationBasis: "Only approved public data.",
      methodVersion: "SECURAAI-ASSET-IMPACT-v1",
      dataClassificationMethodVersion: "SECURAAI-DATA-CLASSIFICATION-v1",
    };
    mocks.query.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        items: [
          {
            id: "event",
            actor: { fullName: "Demo officer" },
            occurredAt: "2026-10-26T12:00:00Z",
            before: {
              ...after,
              criticality: "low",
              availabilityImpact: 1,
              rationale: "Previous explanation.",
            },
            after,
          },
        ],
        pagination: { total: 11, totalPages: 2 },
      },
    });
    render(<AssetClassificationHistory assetId="asset" />);
    await userEvent.click(screen.getByText("View changes"));
    expect(screen.getByText("Previous explanation.")).toBeVisible();
    expect(
      screen.getByText("An outage stops essential service."),
    ).toBeVisible();
    expect(
      screen.getByRole("region", { name: "New classification" }),
    ).toHaveTextContent("Availability impact5");
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(mocks.query).toHaveBeenLastCalledWith("asset", 2);
  });
  it("distinguishes first classification from a populated before snapshot", async () => {
    mocks.query.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        items: [
          {
            id: "first",
            actor: null,
            occurredAt: "2026-10-26T12:00:00Z",
            before: null,
            after: null,
          },
        ],
        pagination: { total: 1, totalPages: 1 },
      },
    });
    render(<AssetClassificationHistory assetId="asset" />);
    expect(
      screen.getByRole("heading", { name: "Asset classified" }),
    ).toBeVisible();
    expect(screen.getByText(/Unknown actor/)).toBeVisible();
  });
});
