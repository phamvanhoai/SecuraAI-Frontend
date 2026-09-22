import { forwardUsersRequest } from "../route";

export async function GET(request: Request): Promise<Response> {
  return forwardUsersRequest(request, "admin/users/assignable-roles", { method: "GET" });
}
