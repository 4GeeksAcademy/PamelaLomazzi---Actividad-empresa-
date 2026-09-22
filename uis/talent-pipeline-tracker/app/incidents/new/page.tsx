"use client";

import { FormEvent, useState } from "react";

import { createIncident } from "@/services/api";
import {
  HEALTHCORE_BRANCHES,
  INCIDENT_CATEGORIES,
  INCIDENT_ORIGINS,
  type IncidentCreatePayload,
} from "@/types/incident";

type FormErrors = Partial<Record<keyof IncidentCreatePayload, string>>;

const initialForm: IncidentCreatePayload = {
  title: "",
  description: "",
  category: "ppe",
  origin: "internal",
  branch: "",
};

const labels: Record<keyof IncidentCreatePayload, string> = {
  title: "Título",
  description: "Descripción",
  category: "Categoría",
  origin: "Origen",
  branch: "Sede",
};

function getValidationErrors(error: unknown): FormErrors {
  if (!(error instanceof Error)) return {};
  try {
    const parsed = JSON.parse(error.message) as { details?: Array<{ loc?: string[]; msg?: string }> };
    return Object.fromEntries(
      (parsed.details ?? [])
        .filter((detail) => {
          const field = detail.loc?.[1];
          return typeof field === "string" && field in labels;
        })
        .map((detail) => [detail.loc?.[1] as keyof IncidentCreatePayload, detail.msg ?? "Revisa este campo."]),
    ) as FormErrors;
  } catch {
    return {};
  }
}

export default function NewIncidentPage() {
  const [form, setForm] = useState<IncidentCreatePayload>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof IncidentCreatePayload>(field: K, value: IncidentCreatePayload[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSuccess(false);
    setServerError(null);
  }

  function validate(): FormErrors {
    const next: FormErrors = {};
    (Object.keys(labels) as Array<keyof IncidentCreatePayload>).forEach((field) => {
      if (!form[field].trim()) next[field] = `${labels[field]} es obligatorio.`;
    });
    return next;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setServerError("Revisa los campos indicados antes de enviar.");
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setServerError(null);
    setSuccess(false);
    try {
      await createIncident(form);
      setForm(initialForm);
      setSuccess(true);
    } catch (error) {
      const fieldErrors = getValidationErrors(error);
      setErrors(fieldErrors);
      setServerError(
        Object.keys(fieldErrors).length
          ? "La API ha detectado errores en algunos campos."
          : error instanceof Error
            ? error.message
            : "No se pudo registrar la incidencia. Inténtalo de nuevo.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass = (field: keyof IncidentCreatePayload) =>
    `mt-2 w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-cyan-200 ${
      errors[field] ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"
    }`;

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8 text-slate-900 md:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">Gestor centralizado</p>
          <h1 className="mt-2 text-3xl font-bold">Registrar una incidencia</h1>
          <p className="mt-2 text-sm text-slate-600">Completa la información para crear un nuevo caso operativo.</p>
        </header>

        {success && (
          <div role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            Incidencia registrada correctamente. El formulario está listo para un nuevo registro.
          </div>
        )}
        {serverError && (
          <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="md:col-span-2 text-sm font-semibold">
              {labels.title}
              <input value={form.title} onChange={(e) => updateField("title", e.target.value)} className={inputClass("title")} placeholder="Ej.: Falta de material de protección" />
              {errors.title && <span className="mt-1 block text-xs font-normal text-red-700">{errors.title}</span>}
            </label>

            <label className="md:col-span-2 text-sm font-semibold">
              {labels.description}
              <textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} className={`${inputClass("description")} min-h-32 resize-y`} placeholder="Describe qué ocurrió y qué impacto tiene." />
              {errors.description && <span className="mt-1 block text-xs font-normal text-red-700">{errors.description}</span>}
            </label>

            <label className="text-sm font-semibold">
              {labels.category}
              <select value={form.category} onChange={(e) => updateField("category", e.target.value as IncidentCreatePayload["category"])} className={inputClass("category")}>
                {INCIDENT_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
              {errors.category && <span className="mt-1 block text-xs font-normal text-red-700">{errors.category}</span>}
            </label>

            <label className="text-sm font-semibold">
              {labels.origin}
              <select value={form.origin} onChange={(e) => updateField("origin", e.target.value as IncidentCreatePayload["origin"])} className={inputClass("origin")}>
                {INCIDENT_ORIGINS.map((origin) => <option key={origin} value={origin}>{origin}</option>)}
              </select>
              {errors.origin && <span className="mt-1 block text-xs font-normal text-red-700">{errors.origin}</span>}
            </label>

            <label className={`md:col-span-2 rounded-xl p-3 text-sm font-semibold transition ${form.origin === "branch" ? "bg-cyan-50 ring-2 ring-cyan-400" : "bg-slate-50"}`}>
              {labels.branch}
              {form.origin === "branch" && <span className="ml-2 text-xs font-normal text-cyan-800">Sede reportante</span>}
              <select value={form.branch} onChange={(e) => updateField("branch", e.target.value as IncidentCreatePayload["branch"])} className={inputClass("branch")}>
                <option value="">Selecciona una sede</option>
                {HEALTHCORE_BRANCHES.map((branch) => <option key={branch} value={branch}>{branch}</option>)}
              </select>
              {errors.branch && <span className="mt-1 block text-xs font-normal text-red-700">{errors.branch}</span>}
            </label>
          </div>

          <button type="submit" disabled={isSubmitting} className="mt-6 inline-flex h-11 items-center rounded-xl bg-cyan-700 px-5 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60">
            {isSubmitting ? "Registrando…" : "Registrar incidencia"}
          </button>
        </form>
      </div>
    </main>
  );
}
