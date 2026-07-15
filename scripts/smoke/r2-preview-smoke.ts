import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import "dotenv/config";
import { cleanupOrphanedR2Object } from "../../src/lib/r2";

const action = process.argv[2] || "validate";
const bucket = process.env.R2_PREVIEW_BUCKET || "";
const productionBucket = process.env.R2_BUCKET_NAME || "";
const accountId = process.env.R2_ACCOUNT_ID || "";
const accessKeyId = process.env.R2_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "";
const endpoint = process.env.R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");
const resultPath = process.env.R2_PREVIEW_RESULT_PATH || "output/rc2/r2-preview-smoke.json";

assert.match(bucket, /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/, "R2_PREVIEW_BUCKET must be an explicit valid bucket name.");
assert.notEqual(bucket, productionBucket, "Preview smoke refuses to use the configured application bucket.");
assert.ok(endpoint && accessKeyId && secretAccessKey, "R2 Preview credentials are required.");

function client(credentials = { accessKeyId, secretAccessKey }) {
  return new S3Client({ region: "auto", endpoint, credentials });
}

const r2 = client();

async function exists(key: string) {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (action === "provision") {
    await r2.send(new CreateBucketCommand({ Bucket: bucket }));
    console.log(JSON.stringify({ bucket, provisioned: true }));
    return;
  }
  if (action === "destroy") {
    await r2.send(new DeleteBucketCommand({ Bucket: bucket }));
    console.log(JSON.stringify({ bucket, destroyed: true }));
    return;
  }
  assert.equal(action, "validate", "Use provision, validate, or destroy.");
  const prefix = `rc2-preview/${Date.now()}-${crypto.randomUUID()}`;
  const lifecycleKey = `${prefix}/lifecycle.txt`;
  const orphanKey = `${prefix}/database-failure.txt`;
  const body = Buffer.from("RC-2 isolated Cloudflare R2 preview evidence\n", "utf8");
  const checks: Record<string, boolean> = {};

  await r2.send(new PutObjectCommand({ Bucket: bucket, Key: lifecycleKey, Body: body, ContentType: "text/plain" }));
  checks.upload = await exists(lifecycleKey);
  const downloaded = await r2.send(new GetObjectCommand({ Bucket: bucket, Key: lifecycleKey }));
  checks.download = Buffer.from(await downloaded.Body!.transformToByteArray()).equals(body);

  const unauthorized = client({ accessKeyId: `invalid-${crypto.randomUUID()}`, secretAccessKey: crypto.randomUUID() });
  try {
    await unauthorized.send(new GetObjectCommand({ Bucket: bucket, Key: lifecycleKey }));
    checks.privateAccessDenied = false;
  } catch {
    checks.privateAccessDenied = true;
  }

  await r2.send(new PutObjectCommand({ Bucket: bucket, Key: orphanKey, Body: body, ContentType: "text/plain" }));
  assert.equal(await exists(orphanKey), true, "Failure-recovery fixture must exist before compensation.");
  const cleanup = await cleanupOrphanedR2Object(
    orphanKey,
    "rc2_preview_simulated_database_failure",
    async (key) => {
      try {
        await r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
        return true;
      } catch {
        return false;
      }
    },
  );
  checks.databaseFailureCleanup = cleanup.outcome === "deleted" && !(await exists(orphanKey));

  await r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: lifecycleKey }));
  checks.delete = !(await exists(lifecycleKey));
  assert.deepEqual(checks, {
    upload: true,
    download: true,
    privateAccessDenied: true,
    databaseFailureCleanup: true,
    delete: true,
  });

  const result = { provider: "cloudflare-r2", bucket, prefix, checks, completedAt: new Date().toISOString() };
  await mkdir(resultPath.split("/").slice(0, -1).join("/"), { recursive: true });
  await writeFile(resultPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(result, null, 2));
}

void main();
