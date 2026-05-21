import * as jose from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "aura-secret-super-secure-key-change-in-prod";
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

export interface JWTPayload {
  userId: string;
  role: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  const jwt = await new jose.SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(encodedSecret);
  return jwt;
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, encodedSecret);
    return payload as unknown as JWTPayload;
  } catch (error) {
    return null;
  }
}
