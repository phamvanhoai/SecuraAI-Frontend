import { proxyControlWrite } from "@/features/control-assessments/server/control-catalog-proxy";
export function POST(request: Request) {
  return proxyControlWrite(request);
}
