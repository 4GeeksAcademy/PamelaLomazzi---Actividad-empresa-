"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import CandidateForm from "@/app/candidates/_components/candidate-form";
import { getRecordById, updateRecord } from "@/services/api";
import type { Record, RecordPayload } from "@/types/candidate";

function toPayload(record: Record): RecordPayload {
  return {
    full_name: record.full_name,
    email: record.email,
    phone: record.phone,
    position: record.position,
    linkedin_url: record.linkedin_url,
    cv_url: record.cv_url,
    experience_years: record.experience_years,
  };
}

export default function EditCandidatePage() {
  const params = useParams<{ id: string }>();
  const recordId = params?.id;

  const [record, setRecord] = useState<Record | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!recordId) {
      return;
    }

    async function loadRecord() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const response = await getRecordById(recordId);
        setRecord(response);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error desconocido";
        setLoadError(`No se pudo cargar la candidatura: ${message}`);
      } finally {
        setIsLoading(false);
      }
    }

    void loadRecord();
  }, [recordId]);

  async function handleUpdate(values: RecordPayload) {
    if (!recordId) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const updated = await updateRecord(recordId, values);
      setRecord(updated);
      setSubmitSuccess("Candidatura actualizada correctamente.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      setSubmitError(`No se pudo actualizar la candidatura: ${message}`);
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
              Selección de Personal Médico y Administrativo: edición completa de candidatura.
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
          {recordId ? (
            <Link
              href={`/candidates/${recordId}`}
              className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Volver al detalle
            </Link>
          ) : null}
        </div>

        {isLoading ? (
          <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="h-7 w-64 animate-pulse rounded bg-slate-200" />
            <div className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="h-10 animate-pulse rounded bg-slate-200" />
              ))}
            </div>
          </section>
        ) : null}

        {!isLoading && loadError ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700 shadow-sm">
            {loadError}
          </section>
        ) : null}

        {!isLoading && !loadError && record ? (
          <CandidateForm
            title="Editar candidatura"
            description="Actualiza los datos completos del perfil para mantener el pipeline médico y administrativo de HealthCore al día."
            submitLabel="Guardar cambios"
            initialValues={toPayload(record)}
            isSubmitting={isSubmitting}
            submitError={submitError}
            submitSuccess={submitSuccess}
            onSubmit={handleUpdate}
          />
        ) : null}
      </main>
    </div>
  );
}
