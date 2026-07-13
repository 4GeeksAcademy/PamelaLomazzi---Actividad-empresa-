"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import CandidateForm from "@/app/candidates/_components/candidate-form";
import { createRecord } from "@/services/api";
import type { RecordPayload } from "@/types/candidate";

export default function NewCandidatePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  async function handleCreate(values: RecordPayload) {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const created = await createRecord(values);
      setCreatedId(created.id);
      setSubmitSuccess("Candidatura registrada correctamente.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      setSubmitError(`No se pudo registrar la candidatura: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-6 md:flex-row md:items-start md:justify-between md:px-8">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">
              Herramienta interna
            </p>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
              People &amp; Talent - HealthCore
            </h1>
            <p className="text-sm text-slate-600">
              Selección de Personal Médico y Administrativo: registro de nuevas candidaturas.
            </p>
          </div>
          <Image
            src="/healthcore-logo.png"
            alt="Logo de HealthCore"
            width={180}
            height={84}
            priority
            className="h-auto w-36 self-end md:w-44"
          />
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-6 py-8 md:px-8">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-cyan-700 underline underline-offset-4 transition hover:text-cyan-800"
          >
            Volver al pipeline
          </Link>
          {createdId ? (
            <Link
              href={`/candidates/${createdId}`}
              className="inline-flex items-center rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100"
            >
              Ver candidatura creada
            </Link>
          ) : null}
        </div>

        <CandidateForm
          title="Nueva candidatura"
          description="Completa los datos requeridos para registrar un nuevo perfil médico o administrativo en HealthCore."
          submitLabel="Registrar candidatura"
          isSubmitting={isSubmitting}
          submitError={submitError}
          submitSuccess={submitSuccess}
          onSubmit={handleCreate}
        />
      </main>
    </div>
  );
}
