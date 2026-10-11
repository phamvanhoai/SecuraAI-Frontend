import { expect, it } from "vitest";
import { canRecordIncidentAction } from "./incident-workflow";
import { updateIncidentProgressFormSchema } from "./report-incident-schema";
it("allows current and retrospective actions but not future or closed work", () => {
  expect(canRecordIncidentAction("open", "containment")).toBe(false);
  expect(canRecordIncidentAction("containment", "recovery")).toBe(false);
  expect(canRecordIncidentAction("containment", "containment")).toBe(true);
  expect(canRecordIncidentAction("recovery", "containment")).toBe(true);
  expect(canRecordIncidentAction("closed", "containment")).toBe(false);
  expect(canRecordIncidentAction("unknown", "recovery")).toBe(false);
});
it("requires confirmation and a bounded note for phase transitions", () => {
  const input = {
    status: "recovery",
    note: "Eradication is complete and the host is clean.",
    confirmed: true,
  };
  expect(updateIncidentProgressFormSchema.safeParse(input).success).toBe(true);
  expect(
    updateIncidentProgressFormSchema.safeParse({ ...input, confirmed: false })
      .success,
  ).toBe(false);
  expect(
    updateIncidentProgressFormSchema.safeParse({ ...input, status: "closed" })
      .success,
  ).toBe(false);
  expect(
    updateIncidentProgressFormSchema.safeParse({ ...input, note: "short" })
      .success,
  ).toBe(false);
});
