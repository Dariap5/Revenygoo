import { NextResponse } from "next/server";

import { isApiError } from "@/lib/server/errors";

export function jsonOk<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, { status: 200, ...init });
}

export function jsonCreated<T>(data: T): NextResponse {
  return NextResponse.json(data, { status: 201 });
}

export function jsonError(e: unknown): NextResponse {
  if (isApiError(e)) {
    return NextResponse.json(
      { error: e.message, code: e.code },
      { status: e.status },
    );
  }
  console.error("[api] unhandled error", e);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
