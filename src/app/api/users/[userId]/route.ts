import { NextResponse } from "next/server";
import { z } from "zod";
import { forwardUsersRequest } from "../route";

const paramsSchema = z.object({ userId: z.uuid() });

export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string }> },
): Promise<Response> {
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid user identifier" },
      },
      { status: 422 },
    );
  }

  return forwardUsersRequest(
    request,
    `admin/users/${encodeURIComponent(parsed.data.userId)}`,
    { method: "GET" },
  );
}
