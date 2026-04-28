const crypto = require("crypto");

// AES-256-CBC encryption settings
const ALGORITHM = "aes-256-cbc";

// Must be 32 bytes for AES-256
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

// IV length for AES
const IV_LENGTH = 16;

/**
 * Encrypt sensitive data
 * Example use:
 * - Aadhaar
 * - PAN
 * - Card details
 * - KYC document references
 */
function encryptData(text) {
  if (!text) return null;

  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    throw new Error(
      "ENCRYPTION_KEY must be exactly 32 characters long in environment variables."
    );
  }

  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY),
    iv
  );

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return `${iv.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt encrypted data
 */
function decryptData(encryptedText) {
  if (!encryptedText) return null;

  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    throw new Error(
      "ENCRYPTION_KEY must be exactly 32 characters long in environment variables."
    );
  }

  const parts = encryptedText.split(":");

  if (parts.length !== 2) {
    throw new Error("Invalid encrypted data format.");
  }

  const iv = Buffer.from(parts[0], "hex");
  const encryptedData = parts[1];

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY),
    iv
  );

  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

module.exports = {
  encryptData,
  decryptData,
};