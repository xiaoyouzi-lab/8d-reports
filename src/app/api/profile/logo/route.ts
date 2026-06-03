import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getPublicUrl, getR2Client } from "@/lib/r2";
import { getUserEntitlements } from "@/lib/subscription";
import { eq } from "drizzle-orm";

const ALLOWED_LOGO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_LOGO_SIZE = 2 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const entitlements = await getUserEntitlements(user.id);
  if (!entitlements.companyLogo) {
    return NextResponse.json(
      { error: "Company logo is a Pro or Team feature" },
      { status: 403 }
    );
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing logo file" }, { status: 400 });
  }

  if (file.size > MAX_LOGO_SIZE) {
    return NextResponse.json({ error: "Logo exceeds 2MB limit" }, { status: 413 });
  }

  if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Logo must be JPG, PNG, or WebP" }, { status: 400 });
  }

  const client = getR2Client();
  if (!client) {
    return NextResponse.json({ error: "Storage service not configured" }, { status: 503 });
  }

  const extension = file.type === "image/png"
    ? "png"
    : file.type === "image/webp"
      ? "webp"
      : "jpg";
  const storagePath = `users/${user.id}/logo-${Date.now()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || "8d-reports",
      Key: storagePath,
      Body: buffer,
      ContentType: file.type,
    })
  );

  const logoUrl = getPublicUrl(storagePath);
  if (!logoUrl) {
    return NextResponse.json({ error: "Logo URL could not be generated" }, { status: 500 });
  }

  await db
    .update(users)
    .set({ logoUrl, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  return NextResponse.json({ logoUrl });
}
