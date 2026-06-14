import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

export function getR2Client(): S3Client | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) return null;

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export async function generatePresignedUploadUrl(
  key: string,
  contentType: string
): Promise<string | null> {
  const client = getR2Client();
  if (!client) return null;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME || "8d-reports",
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn: 300 });
}

export async function getPresignedDownloadUrl(key: string): Promise<string | null> {
  const client = getR2Client();
  if (!client) return null;

  const command = new HeadObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME || "8d-reports",
    Key: key,
  });

  try {
    await client.send(command);
    return getPublicUrl(key);
  } catch {
    return null;
  }
}

export function getPublicUrl(key: string): string | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const bucket = process.env.R2_BUCKET_NAME || "8d-reports";
  if (!accountId) return null;
  return `https://${bucket}.${accountId}.r2.cloudflarestorage.com/${key}`;
}

export function getR2KeyFromPublicUrl(url?: string | null): string | null {
  if (!url) return null;
  const accountId = process.env.R2_ACCOUNT_ID;
  const bucket = process.env.R2_BUCKET_NAME || "8d-reports";
  if (!accountId) return null;

  try {
    const parsed = new URL(url);
    if (parsed.hostname !== `${bucket}.${accountId}.r2.cloudflarestorage.com`) return null;
    const key = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
    return key || null;
  } catch {
    return null;
  }
}

export async function getR2ObjectBuffer(key: string): Promise<{ buffer: Buffer; contentType?: string | null } | null> {
  const client = getR2Client();
  if (!client) return null;

  try {
    const object = await client.send(
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME || "8d-reports",
        Key: key,
      })
    );
    const bytes = await object.Body?.transformToByteArray();
    if (!bytes) return null;
    return { buffer: Buffer.from(bytes), contentType: object.ContentType };
  } catch {
    return null;
  }
}

export async function deleteR2Object(key: string): Promise<boolean> {
  const client = getR2Client();
  if (!client) return false;

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME || "8d-reports",
        Key: key,
      })
    );
    return true;
  } catch {
    return false;
  }
}
