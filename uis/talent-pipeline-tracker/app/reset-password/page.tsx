"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";

import { resetPassword } from "@/services/auth";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword({ token, new_password: newPassword });
      router.push("/login");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Error desconocido";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token) {
    return (
      <p role="alert" className="mt-8 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
        El enlace de restablecimiento es inválido. Solicita uno nuevo desde{" "}
        <Link href="/forgot-password" className="font-medium underline">
          recuperar contraseña
        </Link>
        .
      </p>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Nueva contraseña
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Confirmar contraseña
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none"
          />
        </label>

        {error ? (
          <div role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            <p>{error}</p>
            <Link href="/forgot-password" className="font-medium underline">
              Solicitar un nuevo enlace
            </Link>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Guardando..." : "Restablecer contraseña"}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        <Link href="/login" className="font-medium text-cyan-700 hover:underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
      <h1 className="text-2xl font-semibold text-slate-900">Restablecer contraseña</h1>
      <p className="mt-1 text-sm text-slate-600">Ingresa tu nueva contraseña.</p>

      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
