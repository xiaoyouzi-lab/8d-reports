import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { checkRateLimit } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

const handlers = toNextJsHandler(auth);

const RATE_LIMITED_PATHNAMES = ["/api/auth/sign-in/email", "/api/auth/sign-up/email"];

function withRateLimit(handler: (req: NextRequest) => Promise<Response>) {
  return async (req: NextRequest) => {
    const pathname = req.nextUrl.pathname;
    if (!RATE_LIMITED_PATHNAMES.includes(pathname)) {
      return handler(req);
    }

    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
    const { allowed } = checkRateLimit(ip);

    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    return handler(req);
  };
}

const wrapped: Record<string, (req: NextRequest) => Promise<Response>> = {};
for (const method of ["GET", "POST", "PUT", "DELETE", "PATCH"] as const) {
  if (method in handlers) {
    wrapped[method] = withRateLimit(
      handlers[method as keyof typeof handlers] as (req: NextRequest) => Promise<Response>
    );
  }
}

export const { GET, POST, PUT, DELETE, PATCH } = wrapped;
