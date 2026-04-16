#!/usr/bin/env node
/**
 * Шифрует API-ключ так же, как сервер (AES-256-GCM), чтобы вставить в org_llm_settings.api_key_encrypted.
 *
 * Usage:
 *   node scripts/encrypt-llm-api-key.cjs <64-char-hex-LLM_SETTINGS_ENCRYPTION_KEY> '<plain-api-key>'
 *
 * Пример (из корня репозитория Revenygo, не из ~):
 *   cd ~/Desktop/Revenygo
 *   node scripts/encrypt-llm-api-key.cjs "$(grep LLM_SETTINGS_ENCRYPTION_KEY .env.local | cut -d= -f2)" 'sk-...'
 */

const { createCipheriv, randomBytes } = require("crypto");

const IV_LEN = 12;
const TAG_LEN = 16;

function normalizeKeyHex(raw) {
  if (typeof raw !== "string") return "";
  let s = raw.trim();
  if (s.startsWith("<") && s.endsWith(">")) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

const keyHex = normalizeKeyHex(process.argv[2]);
const plain = process.argv[3];

if (!keyHex || keyHex.length !== 64 || !/^[0-9a-fA-F]+$/.test(keyHex)) {
  console.error(
    "Ошибка: первый аргумент — LLM_SETTINGS_ENCRYPTION_KEY (ровно 64 hex-символа, без < >).",
  );
  console.error(
    "Запускайте из папки проекта: cd путь/к/Revenygo && node scripts/encrypt-llm-api-key.cjs …",
  );
  process.exit(1);
}
if (!plain) {
  console.error("Ошибка: второй аргумент — открытый API-ключ в кавычках.");
  process.exit(1);
}

const key = Buffer.from(keyHex, "hex");
const iv = randomBytes(IV_LEN);
const cipher = createCipheriv("aes-256-gcm", key, iv);
const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
const tag = cipher.getAuthTag();
const out = Buffer.concat([iv, tag, enc]).toString("base64");
console.log(out);
