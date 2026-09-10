import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const response = await fetch(
      `${env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "")}/auth/password-reset/request`,
      {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: await request.text(),
        cache: "no-store",
      },
    );
    return new NextResponse(await response.text(), {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") ?? "application/json",
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "SERVICE_UNAVAILABLE", message: "Unable to connect to the password reset service." } },
      { status: 503 },
    );
  }
}