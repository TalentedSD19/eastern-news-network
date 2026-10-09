import { S3Client } from "@aws-sdk/client-s3";

const R2_ENV = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME", "R2_PUBLIC_URL"] as const;

let cached: { key: string; client: S3Client } | null = null;

// Reads the R2 settings at call time rather than at import, so a server that was started
// before the env vars were added (or changed) picks up the current values.
export function getR2():
  | { client: S3Client; bucket: string; publicUrl: string; missing?: undefined }
  | { missing: string[] } {
  const missing = R2_ENV.filter((name) => !process.env[name]);
  if (missing.length > 0) return { missing };

  const accountId = process.env.R2_ACCOUNT_ID!;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;
  const key = `${accountId}:${accessKeyId}:${secretAccessKey}`;
  if (cached?.key !== key) {
    cached = {
      key,
      client: new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId, secretAccessKey },
      }),
    };
  }

  return {
    client: cached.client,
    bucket: process.env.R2_BUCKET_NAME!,
    publicUrl: process.env.R2_PUBLIC_URL!.replace(/\/$/, ""),
  };
}
