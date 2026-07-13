export type CandidateStatus =
  | "received"
  | "in_progress"
  | "selected"
  | "discarded";

export type CandidateStage =
  | "pending"
  | "review"
  | "personal_interview"
  | "technical_interview"
  | "offer_presented";

export interface Note {
  id: string;
  record_id: string;
  content: string;
  created_at: string;
}

export interface Record {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url: string | null;
  cv_url: string | null;
  experience_years: number;
  status: CandidateStatus;
  stage: CandidateStage;
  applied_at: string;
  updated_at: string;
  notes_count: number;
  notes?: Note[];
}

export interface RecordsResponse {
  total: number;
  page: number;
  limit: number;
  data: Record[];
}

export interface NotesResponse {
  data: Note[];
  meta: {
    total: number;
  };
}

export interface RecordPayload {
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url?: string | null;
  cv_url?: string | null;
  experience_years: number;
}

export interface RecordPatchPayload {
  status?: CandidateStatus | null;
  stage?: CandidateStage | null;
}

export interface NotePayload {
  content: string;
}
