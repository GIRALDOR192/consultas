import { randomBytes, createHash } from "crypto";

/**
 * Genera un token público URL-safe para el cliente y un directorio único.
 * Retorna:
 * - token: el ID corto usado en la URL /proceso/[token]
 * - secureToken: hash de seguridad largo para validación backend si es necesario
 * - r2Directory: un hash único usado para la carpeta del cliente en R2
 */
export function generateProcessTokens() {
  // Token principal corto y amigable para la URL (aprox 16 caracteres)
  const token = randomBytes(12).toString("hex");
  
  // Token seguro más largo para operaciones internas
  const secureToken = randomBytes(32).toString("hex");
  
  // Nombre de directorio inidentificable (hash del token + timestamp)
  const timestamp = Date.now().toString();
  const r2Directory = createHash("sha256")
    .update(`${token}-${timestamp}-${secureToken}`)
    .digest("hex")
    .substring(0, 32); // Usamos 32 caracteres para el directorio

  return {
    token,
    secureToken,
    r2Directory,
  };
}
