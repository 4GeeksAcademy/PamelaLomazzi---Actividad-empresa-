import type { RecordPayload } from "@/types/candidate";

export type CandidateFormState = Pick<
  RecordPayload,
  "full_name" | "email" | "phone" | "position"
> & {
  experience_years: string;
};

export type CandidateFormErrors = Partial<
  Record<keyof RecordPayload, string>
>;

export function validateCandidateForm(
  values: CandidateFormState,
): CandidateFormErrors {
  const errors: CandidateFormErrors = {};

  if (!values.full_name.trim()) {
    errors.full_name = "El nombre completo es obligatorio.";
  }

  if (!values.email.trim()) {
    errors.email = "El email es obligatorio.";
  } else if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) {
    errors.email = "Ingresa un email valido.";
  }

  if (!values.phone.trim()) {
    errors.phone = "El telefono es obligatorio.";
  }

  if (!values.position.trim()) {
    errors.position = "El puesto es obligatorio.";
  }

  if (!values.experience_years.trim()) {
    errors.experience_years = "Los anos de experiencia son obligatorios.";
  } else {
    const years = Number(values.experience_years);
    if (Number.isNaN(years) || years < 0) {
      errors.experience_years = "Ingresa un numero valido mayor o igual a 0.";
    }
  }

  return errors;
}

export function formatCandidateDate(value?: string | null): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });
}