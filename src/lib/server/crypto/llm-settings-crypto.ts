import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

import { ApiError } from "@/lib/server/errors";

const IV_LEN = 12;
const TAG_LEN = 16;

function getKey(): Buffer {
  const hex = process.env.LLM_SETTINGS_ENCRYPTION_KEY?.trim();
  if (!hex || hex.length !== 64 || !/^[0-9a-fA-F]+$/.test(hex)) {
    throw new ApiError(
      "LLM_SETTINGS_ENCRYPTION_KEY must be 64 hex characters (32 bytes). Example: openssl rand -hex 32",
      500,
      "llm_crypto_config",
    );
  }
  return Buffer.from(hex, "hex");
}

export function encryptLlmApiKey(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptLlmApiKey(b64: string): string {
  const key = getKey();
  const buf = Buffer.from(b64, "base64");
  if (buf.length < IV_LEN + TAG_LEN + 1) {
    throw new ApiError("Invalid encrypted key blob", 500, "llm_key_corrupt");
  }
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const data = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
