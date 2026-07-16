// Crockford's Base32 alphabet (no I, L, O, U to avoid ambiguity).
const CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/**
 * Generates a high-entropy emergency code using a cryptographically secure RNG.
 * Format: LV-XXXXX-XXXXX-XXXXX-XXXXX (20 chars from a 32-char alphabet
 * => ~100 bits of entropy). The code is the only secret guarding the public
 * emergency profile lookup, so it must be effectively unguessable.
 */
export function generateEmergencyCode(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
    if (i === 4 || i === 9 || i === 14) out += "-";
  }
  return `LV-${out}`;
}

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"] as const;

export const REMINDER_KINDS = [
  { value: "medicine", label: "Medicine" },
  { value: "vaccination", label: "Vaccination" },
  { value: "insurance", label: "Insurance renewal" },
  { value: "appointment", label: "Appointment" },
  { value: "checkup", label: "Checkup" },
] as const;