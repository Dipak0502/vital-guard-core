export function generateEmergencyCode(): string {
  const rand = () => Math.floor(1000 + Math.random() * 9000);
  return `LV-${rand()}-${rand()}`;
}

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"] as const;

export const REMINDER_KINDS = [
  { value: "medicine", label: "Medicine" },
  { value: "vaccination", label: "Vaccination" },
  { value: "insurance", label: "Insurance renewal" },
  { value: "appointment", label: "Appointment" },
  { value: "checkup", label: "Checkup" },
] as const;