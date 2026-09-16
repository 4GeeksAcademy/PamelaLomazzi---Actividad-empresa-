"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";

import { ApiError } from "@/services/api";
import { register } from "@/services/auth";

interface RegisterForm {
  email: string;
  password: string;
  name: string;
  phone: string;
  address: string;
}

const INITIAL_FORM: RegisterForm = {
  email: "",
  password: "",
  name: "",
  phone: "",
  address: "",
};

function extractFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || !error.payload || typeof error.payload !== "object") {
    return {};
  }

  const payload = error.payload as { detail?: unknown; errors?: unknown };

  if (Array.isArray(payload.detail)) {
    const fieldErrors: Record<string, string> = {};

    for (const item of payload.detail as Array<{ loc?: unknown[]; msg?: string }>) {
      const field = Array.isArray(item.loc) ? String(item.loc[item.loc.length - 1]) : null;
      if (field && item.msg) {
        fieldErrors[field] = item.msg;
      }
    }

    return fieldErrors;
  }

  if (payload.errors && typeof payload.errors === "object") {
    return payload.errors as Record<string, string>;
  }

  return {};
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterForm>(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: keyof RegisterForm) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await register({
        email: form.email,
        password: form.password,
        name: form.name || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
      });
      router.push("/");
    } catch (submitError) {
      const errors = extractFieldErrors(submitError);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
      } else {
        const message = submitError instanceof Error ? submitError.message : "Error desconocido";
        setFormError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
      <h1 className="text-2xl font-semibold text-slate-900">Crear cuenta</h1>
      <p className="mt-1 text-sm text-slate-600">
        Regístrate para acceder al panel de gestión del pipeline de talento.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={updateField("email")}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none"
          />
          {fieldErrors.email ? (
            <span className="text-xs text-rose-600">{fieldErrors.email}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Contraseña
          <input
            type="password"
            required
            autoComplete="new-password"
            value={form.password}
            onChange={updateField("password")}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none"
          />
          {fieldErrors.password ? (
            <span className="text-xs text-rose-600">{fieldErrors.password}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Nombre (opcional)
          <input
            type="text"
            autoComplete="name"
            value={form.name}
            onChange={updateField("name")}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none"
          />
          {fieldErrors.name ? (
            <span className="text-xs text-rose-600">{fieldErrors.name}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Teléfono (opcional)
          <input
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={updateField("phone")}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none"
          />
          {fieldErrors.phone ? (
            <span className="text-xs text-rose-600">{fieldErrors.phone}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Dirección (opcional)
          <input
            type="text"
            autoComplete="street-address"
            value={form.address}
            onChange={updateField("address")}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none"
          />
          {fieldErrors.address ? (
            <span className="text-xs text-rose-600">{fieldErrors.address}</span>
          ) : null}
        </label>

        {formError ? (
          <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {formError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-cyan-700 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </main>
  );
}
