"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";

import { getMe, updateMyProfile } from "@/services/auth";
import type { AuthenticatedUser, ProfileUpdatePayload } from "@/types/auth";

export default function AccountProfilePage() {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [form, setForm] = useState<ProfileUpdatePayload>({ name: "", phone: "", address: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMe() {
      setIsLoading(true);
      setError(null);

      try {
        const me = await getMe();
        setUser(me);
        setForm({
          name: me.profile?.name ?? "",
          phone: me.profile?.phone ?? "",
          address: me.profile?.address ?? "",
        });
      } catch (fetchError) {
        const message = fetchError instanceof Error ? fetchError.message : "Error desconocido";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    void fetchMe();
  }, []);

  function updateField(field: keyof ProfileUpdatePayload) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSaving(true);

    try {
      const updatedProfile = await updateMyProfile(form);
      setUser((prev) => (prev ? { ...prev, profile: updatedProfile } : prev));
      setSuccessMessage("Perfil actualizado correctamente.");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Error desconocido";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-lg flex-1 px-6 py-12">
        <p className="text-sm text-slate-600">Cargando perfil...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-6 py-12">
      <h1 className="text-2xl font-semibold text-slate-900">Mi cuenta</h1>
      {user ? <p className="mt-1 text-sm text-slate-600">{user.email}</p> : null}

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Nombre
          <input
            type="text"
            value={form.name ?? ""}
            onChange={updateField("name")}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Teléfono
          <input
            type="tel"
            value={form.phone ?? ""}
            onChange={updateField("phone")}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Dirección
          <input
            type="text"
            value={form.address ?? ""}
            onChange={updateField("address")}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none"
          />
        </label>

        {error ? (
          <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        {successMessage ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {successMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSaving}
          className="mt-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </main>
  );
}
