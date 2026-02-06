import crypto from "crypto";

export function generateAccessToken(entropyBytes: number = 32): string {
  const raw = crypto.randomBytes(entropyBytes).toString("base64url");

  return raw;
}
