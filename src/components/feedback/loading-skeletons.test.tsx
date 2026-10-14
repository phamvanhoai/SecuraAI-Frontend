import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  AuthLoadingSkeleton,
  DashboardLoadingSkeleton,
  RootLoadingSkeleton,
} from "./loading-skeletons";

describe.each([
  ["root", RootLoadingSkeleton],
  ["auth", AuthLoadingSkeleton],
  ["dashboard", DashboardLoadingSkeleton],
])("%s loading skeleton", (_name, LoadingSkeleton) => {
  it("announces its loading state", () => {
    const view = render(<LoadingSkeleton />);

    expect(
      within(view.container).getAllByRole("status", { name: "Đang tải nội dung" })[0],
    ).toHaveAttribute("aria-busy", "true");

    view.unmount();
  });
});
