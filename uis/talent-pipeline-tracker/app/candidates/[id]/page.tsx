"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import {
  createNote,
  deleteNote,
  getNotes,
  getRecordById,
  patchRecordStatusOrStage,
} from "@/services/api";
import type { CandidateStage, CandidateStatus, Note, Record } from "@/types/candidate";

const STATUS_OPTIONS: Array<{ value: CandidateStatus; label: string }> = [
  { value: "received", label: "Recibida" },
  { value: "in_progress", label: "En progreso" },
  { value: "selected", label: "Seleccionada" },
  { value: "discarded", label: "Descartada" },
];

const STAGE_OPTIONS: Array<{ value: CandidateStage; label: string }> = [
  { value: "pending", label: "Pendiente" },
  { value: "review", label: "Revisión" },
  { value: "personal_interview", label: "Entrevista personal" },
  { value: "technical_interview", label: "Entrevista técnica" },
  { value: "offer_presented", label: "Oferta presentada" },
];

const STATUS_STYLE: Record<CandidateStatus, string> = {
  received: "border-sky-200 bg-sky-50 text-sky-700",
  in_progress: "border-amber-200 bg-amber-50 text-amber-700",
  selected: "border-emerald-200 bg-emerald-50 text-emerald-700",
  discarded: "border-rose-200 bg-rose-50 text-rose-700",
};

const STAGE_STYLE: Record<CandidateStage, string> = {
  pending: "border-slate-200 bg-slate-100 text-slate-700",
  review: "border-cyan-200 bg-cyan-50 text-cyan-700",
  personal_interview: "border-violet-200 bg-violet-50 text-violet-700",
  technical_interview: "border-indigo-200 bg-indigo-50 text-indigo-700",
  offer_presented: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

function getStatusLabel(status: CandidateStatus): string {
  return STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}

function getStageLabel(stage: CandidateStage): string {
  return STAGE_OPTIONS.find((option) => option.value === stage)?.label ?? stage;
}

export default function CandidateDetailPage() {
  const params = useParams<{ id: string }>();
  const recordId = params?.id;

  const [record, setRecord] = useState<Record | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [isSavingStage, setIsSavingStage] = useState(false);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  const [newNote, setNewNote] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);

  useEffect(() => {
    if (!recordId) {
      return;
    }

    async function loadCandidateData() {
      setIsLoading(true);
      setError(null);

      try {
        const [recordResponse, notesResponse] = await Promise.all([
          getRecordById(recordId),
          getNotes(recordId),
        ]);

        setRecord(recordResponse);
        setNotes(notesResponse.data);
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : "Error desconocido";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    void loadCandidateData();
  }, [recordId]);

  const appliedDate = record?.applied_at
    ? new Date(record.applied_at).toLocaleString("es-ES", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "-";

  async function handleStatusChange(nextStatus: CandidateStatus) {
    if (!record || !recordId) {
      return;
    }

    const previousStatus = record.status;
    setIsSavingStatus(true);
    setError(null);

    setRecord((prev) => (prev ? { ...prev, status: nextStatus } : prev));

    try {
      const updated = await patchRecordStatusOrStage(recordId, { status: nextStatus });
      setRecord(updated);
    } catch (patchError) {
      const message =
        patchError instanceof Error ? patchError.message : "Error desconocido";
      setRecord((prev) => (prev ? { ...prev, status: previousStatus } : prev));
      setError(`No se pudo actualizar el estado: ${message}`);
    } finally {
      setIsSavingStatus(false);
    }
  }

  async function handleStageChange(nextStage: CandidateStage) {
    if (!record || !recordId) {
      return;
    }

    const previousStage = record.stage;
    setIsSavingStage(true);
    setError(null);

    setRecord((prev) => (prev ? { ...prev, stage: nextStage } : prev));

    try {
      const updated = await patchRecordStatusOrStage(recordId, { stage: nextStage });
      setRecord(updated);
    } catch (patchError) {
      const message =
        patchError instanceof Error ? patchError.message : "Error desconocido";
      setRecord((prev) => (prev ? { ...prev, stage: previousStage } : prev));
      setError(`No se pudo actualizar la etapa: ${message}`);
    } finally {
      setIsSavingStage(false);
    }
  }

  async function handleCreateNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!recordId) {
      return;
    }

    if (!newNote.trim()) {
      setNoteError("La nota no puede estar vacía.");
      return;
    }

    setIsCreatingNote(true);
    setNoteError(null);

    try {
      const created = await createNote(recordId, { content: newNote.trim() });
      setNotes((prev) => [created, ...prev]);
      setRecord((prev) =>
        prev ? { ...prev, notes_count: prev.notes_count + 1 } : prev,
      );
      setNewNote("");
    } catch (createError) {
      const message =
        createError instanceof Error ? createError.message : "Error desconocido";
      setNoteError(`No se pudo crear la nota: ${message}`);
    } finally {
      setIsCreatingNote(false);
    }
  }

  async function handleDeleteNote(noteId: string) {
    if (!recordId) {
      return;
    }

    setDeletingNoteId(noteId);
    setNoteError(null);

    const previousNotes = notes;
    setNotes((prev) => prev.filter((note) => note.id !== noteId));
    setRecord((prev) =>
      prev ? { ...prev, notes_count: Math.max(0, prev.notes_count - 1) } : prev,
    );

    try {
      await deleteNote(recordId, noteId);
    } catch (deleteError) {
      const message =
        deleteError instanceof Error ? deleteError.message : "Error desconocido";
      setNotes(previousNotes);
      setRecord((prev) =>
        prev ? { ...prev, notes_count: previousNotes.length } : prev,
      );
      setNoteError(`No se pudo eliminar la nota: ${message}`);
    } finally {
      setDeletingNoteId(null);
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
              Selección de Personal Médico y Administrativo: vista detallada y seguimiento interno.
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

      <main className="mx-auto w-full max-w-7xl px-6 py-8 md:px-8">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-cyan-700 underline underline-offset-4 transition hover:text-cyan-800"
          >
            Volver al pipeline
          </Link>
          {recordId ? (
            <Link
              href={`/candidates/${recordId}/edit`}
              className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Editar candidatura
            </Link>
          ) : null}
        </div>

        {isLoading ? (
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="h-7 w-72 animate-pulse rounded bg-slate-200" />
            <div className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="h-10 animate-pulse rounded bg-slate-200" />
              ))}
            </div>
          </section>
        ) : null}

        {!isLoading && error ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700 shadow-sm">
            <h2 className="mb-2 text-base font-semibold">No se pudo cargar la candidatura</h2>
            <p className="text-sm">Detalle: {error}</p>
          </section>
        ) : null}

        {!isLoading && !error && record ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Datos de la candidatura</h2>

              <div className="grid gap-4 text-sm md:grid-cols-2">
                <DetailItem label="Nombre" value={record.full_name} />
                <DetailItem label="Email" value={record.email} />
                <DetailItem label="Teléfono" value={record.phone} />
                <DetailItem label="Puesto" value={record.position} />
                <DetailItem
                  label="LinkedIn"
                  value={
                    record.linkedin_url ? (
                      <a
                        href={record.linkedin_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-700 underline underline-offset-4"
                      >
                        Ver perfil
                      </a>
                    ) : (
                      "-"
                    )
                  }
                />
                <DetailItem
                  label="CV"
                  value={
                    record.cv_url ? (
                      <a
                        href={record.cv_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-700 underline underline-offset-4"
                      >
                        Abrir CV
                      </a>
                    ) : (
                      "-"
                    )
                  }
                />
                <DetailItem
                  label="Años de experiencia"
                  value={String(record.experience_years)}
                />
                <DetailItem
                  label="Estado"
                  value={
                    <Badge className={STATUS_STYLE[record.status]}>
                      {getStatusLabel(record.status)}
                    </Badge>
                  }
                />
                <DetailItem
                  label="Etapa"
                  value={
                    <Badge className={STAGE_STYLE[record.stage]}>
                      {getStageLabel(record.stage)}
                    </Badge>
                  }
                />
                <DetailItem label="Fecha de aplicación" value={appliedDate} />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Controles rápidos</h2>

              <div className="mb-4 flex flex-wrap gap-2">
                <Badge className={STATUS_STYLE[record.status]}>
                  Estado: {getStatusLabel(record.status)}
                </Badge>
                <Badge className={STAGE_STYLE[record.stage]}>
                  Etapa: {getStageLabel(record.stage)}
                </Badge>
              </div>

              <div className="space-y-4">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">Estado</span>
                  <select
                    value={record.status}
                    onChange={(event) =>
                      void handleStatusChange(event.target.value as CandidateStatus)
                    }
                    disabled={isSavingStatus}
                    className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-cyan-600 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {isSavingStatus ? (
                    <p className="text-xs text-slate-500">Actualizando estado...</p>
                  ) : null}
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">Etapa</span>
                  <select
                    value={record.stage}
                    onChange={(event) =>
                      void handleStageChange(event.target.value as CandidateStage)
                    }
                    disabled={isSavingStage}
                    className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-cyan-600 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {STAGE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {isSavingStage ? (
                    <p className="text-xs text-slate-500">Actualizando etapa...</p>
                  ) : null}
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-3">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-slate-900">Notas internas de selección HealthCore</h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {notes.length} nota(s)
                </span>
              </div>

              <form onSubmit={handleCreateNote} className="mb-5 space-y-3 rounded-xl border border-slate-200 p-4">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">Nueva nota interna</span>
                  <textarea
                    value={newNote}
                    onChange={(event) => setNewNote(event.target.value)}
                    rows={3}
                    placeholder="Escribe una observación para el comité de selección médica o administrativa..."
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-600"
                  />
                </label>
                <button
                  type="submit"
                  disabled={isCreatingNote}
                  className="inline-flex h-10 items-center rounded-xl bg-cyan-700 px-4 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isCreatingNote ? "Guardando nota..." : "Agregar nota"}
                </button>
                {noteError ? <p className="text-sm text-rose-700">{noteError}</p> : null}
              </form>

              {notes.length === 0 ? (
                <p className="text-sm text-slate-600">Aún no hay notas para esta candidatura.</p>
              ) : (
                <ul className="space-y-3">
                  {notes.map((note) => (
                    <li
                      key={note.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm text-slate-800">{note.content}</p>
                          <p className="mt-2 text-xs text-slate-500">
                            {new Date(note.created_at).toLocaleString("es-ES", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleDeleteNote(note.id)}
                          disabled={deletingNoteId === note.id}
                          className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {deletingNoteId === note.id ? "Eliminando..." : "Eliminar"}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="text-sm font-medium text-slate-800">{value}</div>
    </div>
  );
}

function Badge({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      {children}
    </span>
  );
}
