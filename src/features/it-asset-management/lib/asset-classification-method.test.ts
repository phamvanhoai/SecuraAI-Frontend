import { expect, it } from "vitest";
import { previewAssetCriticality } from "./asset-classification-method";
it.each([
  [1, "Low"],
  [2, "Medium"],
  [3, "Medium"],
  [4, "High"],
  [5, "Critical"],
])("previews maximum %s", (score, label) => {
  expect(previewAssetCriticality([1, 1, score, 1])).toBe(`${score} — ${label}`);
});
it.each([
  ["", 1, 1, 1],
  [NaN, 1, 1, 1],
  [6, 1, 1, 1],
  [2.5, 1, 1, 1],
])("does not preview invalid/incomplete scores", (...scores) => {
  expect(previewAssetCriticality(scores)).toBeNull();
});
