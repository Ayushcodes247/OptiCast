import crypto from "crypto";

interface AccessTokenResult {
  rawToken: string;
  entropyBytes: number;
}

export function generateAccessToken(
  entropyBytes: number = 32,
): AccessTokenResult {
  const raw = crypto.randomBytes(entropyBytes).toString("base64url");

  return {
    rawToken: raw,
    entropyBytes,
  };
}
