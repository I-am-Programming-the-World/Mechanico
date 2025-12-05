import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "~/env";

let client: S3Client | null = null;

function getClient() {
  if (!client) {
    if (!env.S3_REGION || !env.S3_BUCKET || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) {
      throw new Error("S3 is not configured. Please set S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY.");
    }
    client = new S3Client({
      region: env.S3_REGION,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      },
    });
  }
  return client;
}

export async function getPresignedPutUrl(key: string, contentType: string): Promise<string> {
  const s3 = getClient();
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET!,
    Key: key,
    ContentType: contentType,
  });
  // 60 seconds expiry is enough for browser upload
  return getSignedUrl(s3, command, { expiresIn: 60 });
}

export function publicUrlForKey(key: string): string {
  if (!env.S3_PUBLIC_URL_BASE) {
    throw new Error("S3_PUBLIC_URL_BASE not configured");
  }
  const base = env.S3_PUBLIC_URL_BASE.replace(/\/$/, "");
  return `${base}/${key}`;
}