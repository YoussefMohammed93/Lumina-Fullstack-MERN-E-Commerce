import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  createHash,
} from "node:crypto";

const KEY_LENGTH = 64;
const options = { N: 32_768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

const scrypt = (password: string, salt: string) =>
  new Promise<Buffer>((resolve, reject) =>
    scryptCallback(password, salt, KEY_LENGTH, options, (error, derivedKey) =>
      error ? reject(error) : resolve(derivedKey),
    ),
  );

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("base64url");
  const result = await scrypt(password, salt);

  return `scrypt$${salt}$${result.toString("base64url")}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [algorithm, salt, expected] = stored.split("$");

  if (algorithm !== "scrypt" || !salt || !expected) return false;

  const result = await scrypt(password, salt);

  return timingSafeEqual(result, Buffer.from(expected, "base64url"));
}

export const randomToken = () => randomBytes(32).toString("base64url");

export const tokenHash = (token: string) =>
  createHash("sha256").update(token).digest("base64url");
