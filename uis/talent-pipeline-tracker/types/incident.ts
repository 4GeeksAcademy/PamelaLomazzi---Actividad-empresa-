export const INCIDENT_CATEGORIES = [
  "ppe",
  "medications",
  "consumables",
  "equipment",
  "wound_care",
  "diagnostics",
] as const;

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

export const INCIDENT_ORIGINS = ["customer", "branch", "internal"] as const;

export type IncidentCreatePayload = {
  title: string;
  description: string;
  category: (typeof INCIDENT_CATEGORIES)[number];
  origin: (typeof INCIDENT_ORIGINS)[number];
  branch: (typeof HEALTHCORE_BRANCHES)[number] | "";
};

export type Incident = IncidentCreatePayload & {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type IncidentStatus = "open" | "in_progress" | "resolved" | "discarded";

export type IncidentSummary = {
  total: number;
  by_status: Record<string, number>;
  by_category: Record<string, number>;
  by_origin: Record<string, number>;
  by_branch: Record<string, number>;
};
