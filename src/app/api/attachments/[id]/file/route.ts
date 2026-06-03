import { NextRequest, NextResponse } from "next/server"
import { GetObjectCommand } from "@aws-sdk/client-s3"
import { eq } from "drizzle-orm"
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers"
import { db } from "@/lib/db"
import { attachments } from "@/lib/db/schema"
import { getR2Client } from "@/lib/r2"
import { getAccessibleReport } from "@/lib/report-access"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser()
  if (!user) return unauthorizedResponse()

  const { id } = await params
  const [attachment] = await db
    .select({
      id: attachments.id,
      storagePath: attachments.storagePath,
      filename: attachments.filename,
      mimeType: attachments.mimeType,
      reportId: attachments.reportId,
    })
    .from(attachments)
    .where(eq(attachments.id, id))
    .limit(1)

  if (!attachment || !(await getAccessibleReport(attachment.reportId, user.id))) {
    return NextResponse.json({ error: "Attachment not found" }, { status: 404 })
  }

  const client = getR2Client()
  if (!client) {
    return NextResponse.json({ error: "Storage service not configured" }, { status: 503 })
  }

  const object = await client.send(
    new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || "8d-reports",
      Key: attachment.storagePath,
    }),
  )

  const bytes = await object.Body?.transformToByteArray()
  if (!bytes) {
    return NextResponse.json({ error: "Attachment file is empty" }, { status: 404 })
  }

  const contentType = attachment.mimeType || object.ContentType || "application/octet-stream"
  const safeFilename = attachment.filename.replace(/["\r\n]/g, "_")

  const body = new Uint8Array(bytes.length)
  body.set(bytes)

  return new NextResponse(body.buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${safeFilename}"`,
      "Cache-Control": "private, max-age=300",
    },
  })
}
