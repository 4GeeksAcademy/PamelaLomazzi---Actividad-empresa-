"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { forgotPassword } from "@/services/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await forgotPassword({ email });
    } catch {
      // Ignorado a propósito: siempre mostramos el mismo mensaje genérico.
    } finally {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
      <h1 className="text-2xl font-semibold text-slate-900">Recuperar contraseña</h1>
      <p className="mt-1 text-sm text-slate-600">
        Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
      </p>

      {isSubmitted ? (
        <p className="mt-8 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Si el email está registrado, enviamos un enlace para restablecer la contraseña.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none disabled:opacity-60"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Enviando..." : "Enviar enlace"}
          </button>
        </form>
      )}

      <p className="mt-6 text-sm text-slate-600">
        <Link href="/login" className="font-medium text-cyan-700 hover:underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </main>
  );
}
