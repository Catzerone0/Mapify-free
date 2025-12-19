import { describe, it, expect } from "@jest/globals";
import { encryptApiKey, decryptApiKey, validateApiKey } from "./encryption";

describe("Encryption", () => {

  it("should encrypt and decrypt API keys correctly", () => {
    const originalKey = "sk-test-123456789";
    const encrypted = encryptApiKey(originalKey);
    const decrypted = decryptApiKey(encrypted);

    expect(encrypted).not.toBe(originalKey);
    expect(decrypted).toBe(originalKey);
  });

  it("should validate API keys correctly", () => {
    expect(validateApiKey("valid-key")).toBe(true);
    expect(validateApiKey("")).toBe(false);
  });

  it("should produce different ciphertext for same plaintext", () => {
    const originalKey = "sk-test-123456789";
    const encrypted1 = encryptApiKey(originalKey);
    const encrypted2 = encryptApiKey(originalKey);

    expect(encrypted1).not.toBe(encrypted2);
    expect(decryptApiKey(encrypted1)).toBe(originalKey);
    expect(decryptApiKey(encrypted2)).toBe(originalKey);
  });
});
