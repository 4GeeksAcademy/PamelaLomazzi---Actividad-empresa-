"use client";

import type { FormEvent } from "react";
import type { Note } from "@/types/candidate";

export interface CandidateNotesProps {
  notes: Note[];
  draft: string;
  error: string | null;
  isCreating: boolean;
  deletingNoteId: string | null;
  onDraftChange: (value: string) => void;
  onCreate: (event: FormEvent<HTMLFormElement>) => void;
  onDelete: (noteId: string) => void;
}

export default function CandidateNotes({
  notes, draft, error, isCreating, deletingNoteId, onDraftChange, onCreate, onDelete,
}: CandidateNotesProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900">Notas internas de selección HealthCore</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {notes.length} nota(s)
        </span>
      </div>
      <form onSubmit={onCreate} className="mb-5 space-y-3 rounded-xl border border-slate-200 p-4">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">Nueva nota interna</span>
          <textarea
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            rows={3}
            placeholder="Escribe una observación para el comité de selección médica o administrativa..."
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-600"
          />
        </label>
        <button
          type="submit"
          disabled={isCreating}
          className="inline-flex h-10 items-center rounded-xl bg-cyan-700 px-4 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isCreating ? "Guardando nota..." : "Agregar nota"}
        </button>
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      </form>
      {notes.length === 0 ? (
        <p className="text-sm text-slate-600">Aún no hay notas para esta candidatura.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li key={note.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-800">{note.content}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {new Date(note.created_at).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(note.id)}
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
  );
}