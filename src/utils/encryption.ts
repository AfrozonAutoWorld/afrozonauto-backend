import crypto from "node:crypto";
import {ENCRYPTION_SECRET, ENCRYPTION_ALGO} from "../secrets"


const ALGORITHM = ENCRYPTION_ALGO || "aes-256-cbc";

const SECRET_KEY = ENCRYPTION_SECRET!.padEnd(32, "0");
const IV_LENGTH = 16;

export const encryptData = (text: string) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
};

export const decryptData = (encryptedText: string) => {
  const [ivHex, encryptedHex] = encryptedText.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

export const generateSecurePassword = (): string =>{
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const specialChars = "!@#$%^&*";

  // Ensure at least one of each type
  const getRandom = (chars: string) => chars[Math.floor(Math.random() * chars.length)];

  const passwordArray = [
    getRandom(lowercase),
    getRandom(uppercase),
    getRandom(numbers),
    getRandom(specialChars),
  ];

  // Fill remaining characters randomly (8–12 chars total)
  const allChars = lowercase + uppercase + numbers + specialChars;
  const remainingLength = Math.floor(Math.random() * 5) + 8; // 8–12 total
  for (let i = passwordArray.length; i < remainingLength; i++) {
    passwordArray.push(getRandom(allChars));
  }

  // Shuffle password characters for randomness
  return passwordArray.sort(() => 0.5 - Math.random()).join("");
}
