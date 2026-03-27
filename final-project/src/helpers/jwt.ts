import jwt from "jsonwebtoken"

export interface JWTPayload {
  _id: string;
  email: string;
  username: string;
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(
      token,
      process.env.SECRET_KEY as string,
    ) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

export function createToken(payload: JWTPayload): string {
  return jwt.sign(payload, process.env.SECRET_KEY as string);
}
