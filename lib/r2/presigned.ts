import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client, BUCKET_NAME, BASE_DIRECTORY } from "./client";

export async function generateUploadUrl(
  fileName: string,
  contentType: string,
  directory: string
) {
  // Construir la ruta completa asegurando que esté dentro de 'aura/'
  const key = `${BASE_DIRECTORY}/${directory}/${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  // URL válida por 15 minutos para la subida
  const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 900 });

  return {
    uploadUrl: signedUrl,
    key: key, // Se devuelve el key para guardarlo en la base de datos después de subir
  };
}
