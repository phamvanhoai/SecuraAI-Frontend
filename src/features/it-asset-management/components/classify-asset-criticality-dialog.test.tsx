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

const { mutateAsyncMock, successMock, detailMock } = vi.hoisted(() => ({
  mutateAsyncMock: vi.fn(),
  successMock: vi.fn(),
  detailMock: vi.fn(),
}));

vi.mock("../hooks/use-classify-asset-criticality", () => ({
  useClassifyAssetCriticality: () => ({
    mutateAsync: mutateAsyncMock,
    isPending: false,
  }),
}));
vi.mock("../hooks/use-asset-detail", () => ({
  useAssetDetail: detailMock,
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: successMock }),
}));

import { ClassifyAssetCriticalityDialog } from "./classify-asset-criticality-dialog";

const asset = {
  id: "00000000-0000-4000-8000-000000000001",
  assetCode: "AST-001",
  name: "Database Server",
  assetType: "server",
  criticality: "medium" as const,
  dataClassification: "internal",
  status: "active" as const,
  location: "Server Room",
  department: null,
  owner: null,
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

describe("ClassifyAssetCriticalityDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    detailMock.mockReturnValue({
      data: {
        ...asset,
        classification: null,
        businessService: null,
        dependencies: [],
      },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });
    mutateAsyncMock.mockResolvedValue({
      assetId: asset.id,
      previousCriticality: "medium",
      criticality: "critical",
      previousDataClassification: "internal",
      dataClassification: "restricted",
      dataClassificationBasis:
        "Only approved public information is handled; no sensitive records are stored.",
      rationale:
        "Disclosure of customer records would cause severe business harm.",
      score: 5,
      methodVersion: "SECURAAI-ASSET-IMPACT-v1",
      changed: true,
      classifiedAt: "2026-09-10T10:00:00.000Z",
    });
  });

  it("submits four scores and the data classification", async () => {
    const user = userEvent.setup();
    render(<ClassifyAssetCriticalityDialog asset={asset} onClose={vi.fn()} />);

    await user.clear(screen.getByLabelText("Confidentiality impact"));
    await user.type(screen.getByLabelText("Confidentiality impact"), "5");
    await user.clear(screen.getByLabelText("Integrity impact"));
    await user.type(screen.getByLabelText("Integrity impact"), "4");
    await user.clear(screen.getByLabelText("Availability impact"));
    await user.type(screen.getByLabelText("Availability impact"), "5");
    await user.clear(screen.getByLabelText("Business impact"));
    await user.type(screen.getByLabelText("Business impact"), "4");
    await user.selectOptions(
      screen.getByLabelText("Data classification"),
      "restricted",
    );
    await user.type(
      screen.getByLabelText("Criticality assessment basis"),
      "Disclosure of customer records would cause severe business harm.",
    );
    await user.type(
      screen.getByLabelText("Data classification basis"),
      "Only approved public information is handled; no sensitive records are stored.",
    );
    await user.click(
      screen.getByRole("button", { name: "Save classification" }),
    );

    await waitFor(() =>
      expect(mutateAsyncMock).toHaveBeenCalledWith({
        confidentialityImpact: 5,
        integrityImpact: 4,
        availabilityImpact: 5,
        businessImpact: 4,
        dataClassification: "restricted",
        dataClassificationBasis:
          "Only approved public information is handled; no sensitive records are stored.",
        rationale:
          "Disclosure of customer records would cause severe business harm.",
      }),
    );
    expect(successMock).toHaveBeenCalledWith(
      "Asset classified",
      "AST-001: Critical, restricted data – score 5",
    );
  });

  it("does not allow classification for an archived asset", () => {
    render(
      <ClassifyAssetCriticalityDialog
        asset={{ ...asset, status: "archived" }}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Save classification" }),
    ).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Archived assets cannot be classified.",
    );
  });
  it("does not silently prefill scores for an unassessed asset", () => {
    render(<ClassifyAssetCriticalityDialog asset={asset} onClose={vi.fn()} />);
    expect(screen.getByLabelText("Confidentiality impact")).toHaveValue(null);
    expect(screen.getByText(/Calculated preview:/)).toHaveTextContent(
      "Select all four scores",
    );
  });
  it("loads saved scores and basis without overwriting subsequent edits", async () => {
    const user = userEvent.setup();
    detailMock.mockReturnValue({
      data: {
        ...asset,
        classification: {
          confidentialityImpact: 1,
          integrityImpact: 2,
          availabilityImpact: 5,
          businessImpact: 3,
          dataClassificationBasis:
            "Only approved public information is handled; no sensitive records are stored.",
          rationale: "An outage prevents essential operations.",
        },
        dependencies: [],
        businessService: null,
      },
      isPending: false,
      isError: false,
    });
    render(<ClassifyAssetCriticalityDialog asset={asset} onClose={vi.fn()} />);
    expect(screen.getByLabelText("Availability impact")).toHaveValue(5);
    expect(screen.getByLabelText("Criticality assessment basis")).toHaveValue(
      "An outage prevents essential operations.",
    );
    await user.clear(screen.getByLabelText("Availability impact"));
    await user.type(screen.getByLabelText("Availability impact"), "3");
    expect(screen.getByLabelText("Availability impact")).toHaveValue(3);
    expect(screen.getByText(/Calculated preview:/)).toHaveTextContent(
      "3 — Medium",
    );
  });
  it("blocks save when context cannot be loaded", () => {
    detailMock.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      refetch: vi.fn(),
    });
    render(<ClassifyAssetCriticalityDialog asset={asset} onClose={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: "Save classification" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled();
  });
});
