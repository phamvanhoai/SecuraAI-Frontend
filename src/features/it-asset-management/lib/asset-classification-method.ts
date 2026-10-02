/** Preview only. Backend calculates and persists the authoritative result. */
export function previewAssetCriticality(values: unknown[]): string | null {
  const scores = values.map(Number);
  if (
    scores.length !== 4 ||
    scores.some((score) => !Number.isInteger(score) || score < 1 || score > 5)
  )
    return null;
  const score = Math.max(...scores);
  return `${score} — ${score === 5 ? "Critical" : score === 4 ? "High" : score >= 2 ? "Medium" : "Low"}`;
}
