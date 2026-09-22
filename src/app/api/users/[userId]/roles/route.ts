import { NextResponse } from "next/server";
import { z } from "zod";
import { forwardUsersRequest } from "../../route";

export async function POST(
  request: Request,
  context: { params: Promise<{ userId: string }> },
): Promise<Response> {
  const parsed = z.uuid().safeParse((await context.params).userId);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: {
      code: "VALIDATION_ERROR", message: "Invalid user identifier",
    } }, { status: 422 });
  }
  return forwardUsersRequest(request, `admin/users/${encodeURIComponent(parsed.data)}/roles`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: await request.text(),
  });
}
