import { proxyControlOwners } from "@/features/control-assessments/server/control-catalog-proxy";
export function GET(request: Request) {
  return proxyControlOwners(request);
}
