import { NextResponse } from "next/server";
import { z } from "zod";
import { forwardUsersRequest } from "../../route";

async function backendPath(context: { params: Promise<{ userId: string }> }): Promise<string | null> {
  const parsed = z.uuid().safeParse((await context.params).userId);
  return parsed.success ? `users/${encodeURIComponent(parsed.data)}/access-assignment` : null;
}

function invalid(): Response {
  return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid user identifier" } }, { status: 422 });
}

export async function GET(request: Request, context: { params: Promise<{ userId: string }> }): Promise<Response> {
  const path = await backendPath(context);
  return path ? forwardUsersRequest(request, path, { method: "GET" }) : invalid();
}

export async function PUT(request: Request, context: { params: Promise<{ userId: string }> }): Promise<Response> {
  const path = await backendPath(context);
  return path ? forwardUsersRequest(request, path, { method: "PUT", headers: { "Content-Type": "application/json" }, body: await request.text() }) : invalid();
}
