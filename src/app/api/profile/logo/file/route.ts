import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getR2KeyFromPublicUrl, getR2ObjectBuffer } from "@/lib/r2";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const [row] = await db
    .select({ logoUrl: users.logoUrl })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  const key = getR2KeyFromPublicUrl(row?.logoUrl);
  if (!key) {
    return NextResponse.json({ error: "Logo not found" }, { status: 404 });
  }

  const object = await getR2ObjectBuffer(key);
  if (!object) {
    return NextResponse.json({ error: "Logo file not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(object.buffer), {
    headers: {
      "Content-Type": object.contentType || "image/png",
      "Content-Disposition": "inline; filename=\"company-logo\"",
      "Cache-Control": "private, max-age=300",
    },
  });
}
