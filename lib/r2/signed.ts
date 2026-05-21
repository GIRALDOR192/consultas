import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client, BUCKET_NAME } from "./client";

export async function generateDownloadUrl(key: string, expiresIn: number = 3600) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  // URL válida por defecto 1 hora (3600s)
  const signedUrl = await getSignedUrl(r2Client, command, { expiresIn });

  return signedUrl;
}
