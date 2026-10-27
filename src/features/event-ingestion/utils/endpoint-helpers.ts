export function normalizeEndpointUrl(url?: string | null | undefined): string {
  if (!url) return "";
  return url.trim().toLowerCase().replace(/\/+$/, "");
}

export function findDuplicateEndpointSource<
  T extends { id: string; name: string; endpoint?: string | null | undefined }
>(
  endpoint: string,
  sources: T[] | undefined,
  currentSourceId?: string
): T | null {
  const normalized = normalizeEndpointUrl(endpoint);
  if (!normalized || normalized === "/" || !sources || sources.length === 0) {
    return null;
  }
  return (
    sources.find((s) => {
      if (currentSourceId && s.id === currentSourceId) return false;
      const otherNormalized = normalizeEndpointUrl(s.endpoint);
      return Boolean(otherNormalized && otherNormalized === normalized);
    }) ?? null
  );
}
