import { S3Client } from "@aws-sdk/client-s3";

// En producción o con env configurado, se usan estas variables:
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "0ec8ed3997626603f7bad0f9644dda9e";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export const BUCKET_NAME = process.env.R2_BUCKET_NAME || "consultas";
export const BASE_DIRECTORY = "aura"; // Para no afectar otros archivos del bucket
