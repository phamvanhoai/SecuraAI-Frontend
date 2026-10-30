import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
vi.mock("@/features/authentication-account", () => ({
  useSessionUser: () => ({ data: { permissions: [] } }),
}));
vi.mock("../hooks/use-model-configurations", () => ({
  useModelConfigurations: () => ({
    isPending: false,
    isError: false,
    data: {
      items: [
        {
          id: "model-1",
          modelName: "secura-organizational-behavior",
          modelType: "BEHAVIORAL_HEURISTIC",
          version: "1.0.0",
          status: "deployed",
        },
      ],
      pagination: { page: 1, total: 1, totalPages: 1 },
      explanationModel: {
        model: "qwen3:4b",
        provider: "Ollama",
        enabled: true,
      },
    },
  }),
}));
vi.mock("./configure-detection-threshold-dialog", () => ({
  ConfigureDetectionThresholdDialog: () => null,
}));
vi.mock("./model-configuration-detail-dialog", () => ({
  ModelConfigurationDetailDialog: () => null,
}));
import { ModelConfigurationsManager } from "./model-configurations-manager";
describe("detection and explanation models", () => {
  it("separates the configured language model from detection and avoids fabricated evaluations or connectivity", () => {
    render(<ModelConfigurationsManager />);
    expect(screen.getByText("Detection configurations")).toBeInTheDocument();
    const model = screen.getByText("secura-organizational-behavior");
    expect(model.closest("td")).toHaveTextContent("qwen3:4b");
    expect(
      screen.queryByRole("heading", { name: "Explanation model" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Connection not checked/)).toBeInTheDocument();
    expect(screen.queryByText("F1 score")).not.toBeInTheDocument();
    expect(screen.queryByText("Average F1")).not.toBeInTheDocument();
  });
});
