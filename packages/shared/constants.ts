/** Canonical HealthCore incident taxonomy and location catalog. */

export const INCIDENT_CATEGORIES = [
  "ppe",
  "medications",
  "consumables",
  "equipment",
  "wound_care",
  "diagnostics",
] as const;

export type IncidentCategory = (typeof INCIDENT_CATEGORIES)[number];

/** Stable identifiers for HealthCore's 12 clinics plus central operations. */
export const HEALTHCORE_BRANCHES = [
  "US-TX-AUSTIN",
  "US-TX-DALLAS",
  "US-TX-HOUSTON",
  "US-TX-SAN_ANTONIO",
  "US-FL-MIAMI",
  "US-FL-ORLANDO",
  "US-FL-TAMPA",
  "US-GA-ATLANTA",
  "US-GA-SAVANNAH",
  "UK-LON-CENTRAL",
  "UK-LON-WEST",
  "UK-MAN-CENTRAL",
  "central",
] as const;

export type HealthCoreBranch = (typeof HEALTHCORE_BRANCHES)[number];

export const INCIDENT_ORIGINS = ["customer", "branch", "internal"] as const;
export type IncidentOrigin = (typeof INCIDENT_ORIGINS)[number];
