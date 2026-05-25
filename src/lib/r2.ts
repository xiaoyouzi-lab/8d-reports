import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

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
