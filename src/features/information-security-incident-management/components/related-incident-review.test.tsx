import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import {
  RelatedIncidentReview,
  relatedIncidentErrorSchema,
} from "./related-incident-review";
afterEach(cleanup);
const item = {
  id: "00000000-0000-4000-8000-000000000010",
  incidentCode: "INC-001",
  title: "Ransomware PC-KT-01",
  status: "open",
  detectedAt: "2026-11-26T00:00:00Z",
  reason: "Shared title terms and nearby detection times.",
};
it("opens the existing record and requires a meaningful reason to create separately", async () => {
  const user = userEvent.setup();
  const onView = vi.fn();
  const onConfirm = vi.fn();
  const onBack = vi.fn();
  render(
    <RelatedIncidentReview
      items={[item]}
      pending={false}
      onView={onView}
      onConfirm={onConfirm}
      onBack={onBack}
    />,
  );
  expect(
    screen.getByRole("button", { name: "Create separately" }),
  ).toBeDisabled();
  await user.click(
    screen.getByRole("button", { name: "View existing incident" }),
  );
  expect(onView).toHaveBeenCalledWith(item.id);
  await user.type(
    screen.getByLabelText("Why is this a separate incident?"),
    "Different attack campaign.",
  );
  await user.click(screen.getByRole("button", { name: "Create separately" }));
  expect(onConfirm).toHaveBeenCalledWith("Different attack campaign.");
  await user.click(screen.getByRole("button", { name: "Back to form" }));
  expect(onBack).toHaveBeenCalled();
});
it("disables resubmission while saving", () => {
  render(
    <RelatedIncidentReview
      items={[item]}
      pending
      onView={vi.fn()}
      onConfirm={vi.fn()}
      onBack={vi.fn()}
    />,
  );
  expect(screen.getByRole("button", { name: "Creating…" })).toBeDisabled();
});
it("recognizes only the published review error contract", () => {
  expect(
    relatedIncidentErrorSchema.safeParse({
      error: {
        code: "INCIDENT_RELATED_REVIEW_REQUIRED",
        details: { items: [item] },
      },
    }).success,
  ).toBe(true);
  expect(
    relatedIncidentErrorSchema.safeParse({ error: { code: "FORBIDDEN" } })
      .success,
  ).toBe(false);
});
