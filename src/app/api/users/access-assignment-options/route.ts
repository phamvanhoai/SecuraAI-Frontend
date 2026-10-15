import { forwardUsersRequest } from "../route";

export async function GET(request: Request): Promise<Response> {
  return forwardUsersRequest(request, "users/access-assignment-options", { method: "GET" });
}
