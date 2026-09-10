"use client";

import { useState } from "react";

import type { SupplierCountry, SupplierPayload } from "@/types/supplier";

const COUNTRY_CURRENCY: Record<SupplierCountry, "USD" | "GBP"> = {
  USA: "USD",
  UK: "GBP",
};

interface SupplierFormState {
  name: string;
  country: SupplierCountry;
  categories: string;
  monthly_rate: string;
  contact_email: string;
  contract_renewal_date: string;
  notes: string;
}

const DEFAULT_VALUES: SupplierFormState = {
  name: "",
  country: "USA",
  categories: "",
  monthly_rate: "",
  contact_email: "",
  contract_renewal_date: "",
  notes: "",
};

type FormErrors = Partial<Record<keyof SupplierFormState, string>>;

function validate(values: SupplierFormState): FormErrors {
  const errors: FormErrors = {};

  if (!values.name.trim()) {
    errors.name = "El nombre comercial es obligatorio.";
  }

  if (!values.categories.trim()) {
    errors.categories = "Ingresa al menos una categoría.";
  }

  if (!values.monthly_rate.trim()) {
    errors.monthly_rate = "La tarifa mensual es obligatoria.";
  } else {
    const rate = Number(values.monthly_rate);
    if (Number.isNaN(rate) || rate <= 0) {
      errors.monthly_rate = "La tarifa debe ser un número mayor a 0.";
    }
  }

  return errors;
}

export interface SupplierFormProps {
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: (values: SupplierPayload) => Promise<void>;
  onCancel: () => void;
}

export default function SupplierForm({
  isSubmitting,
  submitError,
  onSubmit,
  onCancel,
}: SupplierFormProps) {
  const [formValues, setFormValues] = useState<SupplierFormState>(DEFAULT_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});

  function handleChange<K extends keyof SupplierFormState>(field: K, value: SupplierFormState[K]) {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }
      const clone = { ...prev };
      delete clone[field];
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

    const payload: SupplierPayload = {
      name: formValues.name.trim(),
      country: formValues.country,
      currency: COUNTRY_CURRENCY[formValues.country],
      categories: formValues.categories
        .split(",")
        .map((category) => category.trim())
        .filter(Boolean),
      monthly_rate: Number(formValues.monthly_rate),
      contact_email: formValues.contact_email.trim() || null,
      contract_renewal_date: formValues.contract_renewal_date.trim() || null,
      notes: formValues.notes.trim() || null,
    };

    await onSubmit(payload);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">Registrar proveedor</h2>
        <p className="mt-1 text-sm text-slate-600">
          Completa los datos del nuevo proveedor del Directorio.
        </p>

        {submitError ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {submitError}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-700">Nombre comercial</span>
            <input
              type="text"
              value={formValues.name}
              onChange={(event) => handleChange("name", event.target.value)}
              className="h-10 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-cyan-600"
            />
            {errors.name ? <span className="text-xs text-rose-600">{errors.name}</span> : null}
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-700">País</span>
              <select
                value={formValues.country}
                onChange={(event) => handleChange("country", event.target.value as SupplierCountry)}
                className="h-10 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-cyan-600"
              >
                <option value="USA">USA</option>
                <option value="UK">UK</option>
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-700">Moneda</span>
              <input
                type="text"
                value={COUNTRY_CURRENCY[formValues.country]}
                disabled
                className="h-10 rounded-xl border border-slate-200 bg-slate-100 px-3 text-sm text-slate-500"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-700">Categorías (separadas por coma)</span>
            <input
              type="text"
              value={formValues.categories}
              onChange={(event) => handleChange("categories", event.target.value)}
              placeholder="tecnologia, farmaceutica"
              className="h-10 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-cyan-600"
            />
            {errors.categories ? (
              <span className="text-xs text-rose-600">{errors.categories}</span>
            ) : null}
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-700">Tarifa mensual</span>
            <input
              type="number"
              step="0.01"
              value={formValues.monthly_rate}
              onChange={(event) => handleChange("monthly_rate", event.target.value)}
              className="h-10 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-cyan-600"
            />
            {errors.monthly_rate ? (
              <span className="text-xs text-rose-600">{errors.monthly_rate}</span>
            ) : null}
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-700">Email de contacto (opcional)</span>
            <input
              type="email"
              value={formValues.contact_email}
              onChange={(event) => handleChange("contact_email", event.target.value)}
              className="h-10 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-cyan-600"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-700">
              Fecha de renovación de contrato (opcional)
            </span>
            <input
              type="date"
              value={formValues.contract_renewal_date}
              onChange={(event) => handleChange("contract_renewal_date", event.target.value)}
              className="h-10 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-cyan-600"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-700">Notas (opcional)</span>
            <textarea
              value={formValues.notes}
              onChange={(event) => handleChange("notes", event.target.value)}
              rows={2}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-600"
            />
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="h-10 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 rounded-xl bg-cyan-700 px-4 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Guardando..." : "Guardar proveedor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
