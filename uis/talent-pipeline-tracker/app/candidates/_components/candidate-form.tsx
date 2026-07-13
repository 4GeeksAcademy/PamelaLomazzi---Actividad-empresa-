"use client";

import type { RecordPayload } from "@/types/candidate";
import { useMemo, useState } from "react";

type FormErrors = Partial<Record<keyof RecordPayload, string>>;

export interface CandidateFormProps {
  title: string;
  description: string;
  submitLabel: string;
  initialValues?: RecordPayload;
  isSubmitting: boolean;
  submitError: string | null;
  submitSuccess: string | null;
  onSubmit: (values: RecordPayload) => Promise<void>;
}

interface CandidateFormState {
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url: string;
  cv_url: string;
  experience_years: string;
}

const DEFAULT_VALUES: CandidateFormState = {
  full_name: "",
  email: "",
  phone: "",
  position: "",
  linkedin_url: "",
  cv_url: "",
  experience_years: "",
};

function toFormValues(values?: RecordPayload): CandidateFormState {
  if (!values) {
    return DEFAULT_VALUES;
  }

  return {
    full_name: values.full_name,
    email: values.email,
    phone: values.phone,
    position: values.position,
    linkedin_url: values.linkedin_url ?? "",
    cv_url: values.cv_url ?? "",
    experience_years: String(values.experience_years),
  };
}

function validate(values: CandidateFormState): FormErrors {
  const errors: FormErrors = {};

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

export default function CandidateForm({
  title,
  description,
  submitLabel,
  initialValues,
  isSubmitting,
  submitError,
  submitSuccess,
  onSubmit,
}: CandidateFormProps) {
  const [formValues, setFormValues] = useState<CandidateFormState>(
    toFormValues(initialValues),
  );
  const [errors, setErrors] = useState<FormErrors>({});

  const hasClientErrors = useMemo(() => Object.keys(errors).length > 0, [errors]);

  function handleChange(
    field: keyof CandidateFormState,
    value: CandidateFormState[keyof CandidateFormState],
  ) {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field as keyof RecordPayload]) {
        return prev;
      }

      const clone = { ...prev };
      delete clone[field as keyof RecordPayload];
      return clone;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const currentErrors = validate(formValues);
    setErrors(currentErrors);

    if (Object.keys(currentErrors).length > 0) {
      return;
    }

    const payload: RecordPayload = {
      full_name: formValues.full_name.trim(),
      email: formValues.email.trim(),
      phone: formValues.phone.trim(),
      position: formValues.position.trim(),
      linkedin_url: formValues.linkedin_url.trim() || null,
      cv_url: formValues.cv_url.trim() || null,
      experience_years: Number(formValues.experience_years),
    };

    await onSubmit(payload);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{description}</p>

      {submitSuccess ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {submitSuccess}
        </div>
      ) : null}

      {submitError ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {submitError}
        </div>
      ) : null}

      {hasClientErrors ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Revisa los campos marcados antes de continuar.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-5 grid gap-4 md:grid-cols-2">
        <Field
          label="Nombre completo *"
          error={errors.full_name}
          input={
            <input
              value={formValues.full_name}
              onChange={(event) => handleChange("full_name", event.target.value)}
              className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-cyan-600"
            />
          }
        />

        <Field
          label="Email *"
          error={errors.email}
          input={
            <input
              type="email"
              value={formValues.email}
              onChange={(event) => handleChange("email", event.target.value)}
              className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-cyan-600"
            />
          }
        />

        <Field
          label="Telefono *"
          error={errors.phone}
          input={
            <input
              value={formValues.phone}
              onChange={(event) => handleChange("phone", event.target.value)}
              className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-cyan-600"
            />
          }
        />

        <Field
          label="Puesto *"
          error={errors.position}
          input={
            <input
              value={formValues.position}
              onChange={(event) => handleChange("position", event.target.value)}
              placeholder="Ej. Enfermería, Médico General, Coordinación Administrativa"
              className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-cyan-600"
            />
          }
        />

        <Field
          label="LinkedIn"
          input={
            <input
              value={formValues.linkedin_url}
              onChange={(event) => handleChange("linkedin_url", event.target.value)}
              className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-cyan-600"
              placeholder="Perfil profesional del candidato para selección HealthCore"
            />
          }
        />

        <Field
          label="Enlace CV"
          input={
            <input
              value={formValues.cv_url}
              onChange={(event) => handleChange("cv_url", event.target.value)}
              className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-cyan-600"
              placeholder="Enlace al CV del candidato médico o administrativo"
            />
          }
        />

        <Field
          label="Anos de experiencia *"
          error={errors.experience_years}
          input={
            <input
              type="number"
              min={0}
              step={1}
              value={formValues.experience_years}
              onChange={(event) =>
                handleChange("experience_years", event.target.value)
              }
              className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-cyan-600"
            />
          }
        />

        <div className="flex items-end md:col-span-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 items-center rounded-xl bg-cyan-700 px-5 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Guardando..." : submitLabel}
          </button>
        </div>
      </form>
    </section>
  );
}

function Field({
  label,
  error,
  input,
}: {
  label: string;
  error?: string;
  input: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {input}
      {error ? <span className="text-xs text-rose-700">{error}</span> : null}
    </label>
  );
}
