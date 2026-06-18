import crypto from "node:crypto";

// Unambiguous alphabet (no 0/O/1/I/L) for human-readable codes.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
// Full set for passwords.
const PW_ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomFrom(alphabet, length) {
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

// e.g. "SLF-7K9QF2"
export function generateUserCode() {
  return `SLF-${randomFrom(CODE_ALPHABET, 6)}`;
}

// e.g. "k7Qm2RpX9t"
export function generatePassword() {
  return randomFrom(PW_ALPHABET, 10);
}
