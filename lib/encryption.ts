import CryptoJS from "crypto-js";
import { env } from "@/env";

/**
 * Encrypts a string using AES encryption
 * Uses the ENCRYPTION_KEY from environment variables
 */
export function encryptApiKey(plaintext: string): string {
  const encrypted = CryptoJS.AES.encrypt(plaintext, env.ENCRYPTION_KEY);
  return encrypted.toString();
}

/**
 * Decrypts an AES-encrypted string
 * Uses the ENCRYPTION_KEY from environment variables
 */
export function decryptApiKey(ciphertext: string): string {
  const decrypted = CryptoJS.AES.decrypt(ciphertext, env.ENCRYPTION_KEY);
  return decrypted.toString(CryptoJS.enc.Utf8);
}

// Alias for backward compatibility
export const decryptKey = decryptApiKey;

/**
 * Validates that a decrypted key is not empty
 */
export function validateApiKey(key: string): boolean {
  return !!(key && key.length > 0);
}
