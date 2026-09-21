import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TrainingSectionNavigation } from "./training-section-navigation";

afterEach(cleanup);

describe("TrainingSectionNavigation", () => {
  it("uses the training tab pattern and exposes the active destination", () => {
    render(
      <TrainingSectionNavigation
        active="department-report"
        primaryLabel="Training progress"
      />,
    );

    expect(
      screen.getByRole("navigation", { name: "Training sections" }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Training progress" }),
    ).toHaveAttribute("href", "/training");
    expect(
      screen.getByRole("link", { name: "Department report" }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("switches sections in place when a selection handler is provided", () => {
    const selections: string[] = [];
    render(
      <TrainingSectionNavigation
        active="training"
        onSelect={(section) => selections.push(section)}
        primaryLabel="Courses"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Department report" }));
    expect(selections).toEqual(["department-report"]);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("keeps the primary training tab visible without department report access", () => {
    render(
      <TrainingSectionNavigation
        active="training"
        primaryLabel="Courses"
        showDepartmentReport={false}
      />,
    );

    expect(screen.getByRole("link", { name: "Courses" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Department report" }),
    ).not.toBeInTheDocument();
  });

  it("shows issued certificates only when access is provided", () => {
    const { rerender } = render(
      <TrainingSectionNavigation
        active="training"
        primaryLabel="Courses"
        showDepartmentReport={false}
      />,
    );
    expect(
      screen.queryByRole("link", { name: "Issued certificates" }),
    ).not.toBeInTheDocument();
    rerender(
      <TrainingSectionNavigation
        active="certificates"
        primaryLabel="Courses"
        showDepartmentReport={false}
        showIssuedCertificates
      />,
    );
    expect(
      screen.getByRole("link", { name: "Issued certificates" }),
    ).toHaveAttribute("aria-current", "page");
  });
});
