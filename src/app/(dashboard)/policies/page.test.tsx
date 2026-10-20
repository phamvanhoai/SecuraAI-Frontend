import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/policy-compliance-control", () => ({
  PoliciesManager: () => <div>Policy management workspace</div>,
}));

import PoliciesPage from "./page";

describe("PoliciesPage", () => {
  it("renders the policy management feature", () => {
    render(<PoliciesPage />);

    expect(screen.getByText("Policy management workspace")).toBeInTheDocument();
  });
});
