import "server-only";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const globalForS3 = globalThis as unknown as { s3Client: S3Client | undefined };

function createClient() {
  return new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION ?? "us-east-1",
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
    },
  });
}

export const s3Client = globalForS3.s3Client ?? createClient();

if (process.env.NODE_ENV !== "production") globalForS3.s3Client = s3Client;

export const S3_BUCKET = process.env.S3_BUCKET ?? "recruitment-crm";

let bucketReady: Promise<void> | null = null;

/** Creates the bucket if it doesn't exist yet — local MinIO doesn't pre-provision one. */
export function ensureBucket(): Promise<void> {
  if (!bucketReady) {
    bucketReady = (async () => {
      try {
        await s3Client.send(new HeadBucketCommand({ Bucket: S3_BUCKET }));
      } catch {
        await s3Client.send(new CreateBucketCommand({ Bucket: S3_BUCKET }));
      }
    })();
  }
  return bucketReady;
}

export async function uploadObject(
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  await ensureBucket();
  await s3Client.send(
    new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, Body: body, ContentType: contentType })
  );
}

export async function getDownloadUrl(key: string, expiresInSeconds = 300): Promise<string> {
  const command = new GetObjectCommand({ Bucket: S3_BUCKET, Key: key });
  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}
