"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getRecords } from "@/services/api";
import type { CandidateStage, CandidateStatus, Record } from "@/types/candidate";

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

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [records, setRecords] = useState<Record[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const selectedStatus = searchParams.get("status") ?? "all";
  const selectedStage = searchParams.get("stage") ?? "all";

  useEffect(() => {
    async function fetchRecords() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getRecords();
        setRecords(response.data);
      } catch (fetchError) {
        const message =
          fetchError instanceof Error ? fetchError.message : "Error desconocido";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    void fetchRecords();
  }, []);

  const filteredRecords = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return records.filter((record) => {
      const byStatus = selectedStatus === "all" || record.status === selectedStatus;
      const byStage = selectedStage === "all" || record.stage === selectedStage;
      const bySearch =
        !searchValue ||
        record.full_name.toLowerCase().includes(searchValue) ||
        record.email.toLowerCase().includes(searchValue);

      return byStatus && byStage && bySearch;
    });
  }, [records, selectedStage, selectedStatus, search]);

  function updateUrlFilter(key: "status" | "stage", value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
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
              Selección de Personal Médico y Administrativo: seguimiento operativo de candidaturas.
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
        <div className="mb-6 flex items-center justify-end">
          <Link
            href="/candidates/new"
            className="inline-flex h-10 items-center rounded-xl bg-cyan-700 px-4 text-sm font-semibold text-white transition hover:bg-cyan-800"
          >
            Registrar candidatura HealthCore
          </Link>
        </div>

        <section className="mb-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3 md:p-5">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">Estado del proceso</span>
            <select
              value={selectedStatus}
              onChange={(event) => updateUrlFilter("status", event.target.value)}
              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-cyan-600"
            >
              <option value="all">Todos</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">Etapa del proceso</span>
            <select
              value={selectedStage}
              onChange={(event) => updateUrlFilter("stage", event.target.value)}
              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-cyan-600"
            >
              <option value="all">Todas</option>
              {STAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">Buscar candidatura</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nombre o email del candidato de HealthCore"
              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-cyan-600"
            />
          </label>
        </section>

        {isLoading ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 h-5 w-56 animate-pulse rounded bg-slate-200" />
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="grid animate-pulse grid-cols-1 gap-3 rounded-xl border border-slate-100 p-4 md:grid-cols-4"
                >
                  <div className="h-4 rounded bg-slate-200" />
                  <div className="h-4 rounded bg-slate-200" />
                  <div className="h-4 rounded bg-slate-200" />
                  <div className="h-4 rounded bg-slate-200" />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {!isLoading && error ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700 shadow-sm">
            <h2 className="mb-2 text-base font-semibold">No fue posible cargar el pipeline</h2>
            <p className="text-sm">
              Ocurrió un error al consultar la API de candidaturas. Detalle: {error}
            </p>
          </section>
        ) : null}

        {!isLoading && !error ? (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Nombre completo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Puesto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Etapa
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        <Link
                          href={`/candidates/${record.id}`}
                          className="underline decoration-cyan-600 decoration-2 underline-offset-4 transition hover:text-cyan-700"
                        >
                          {record.full_name}
                        </Link>
                        <p className="mt-1 text-xs text-slate-500">{record.email}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">{record.position}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[record.status]}`}
                        >
                          {getStatusLabel(record.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${STAGE_STYLE[record.stage]}`}
                        >
                          {getStageLabel(record.stage)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredRecords.length === 0 ? (
              <div className="border-t border-slate-100 px-4 py-6 text-sm text-slate-600">
                No hay candidaturas de selección médica o administrativa que coincidan con los filtros.
              </div>
            ) : null}
          </section>
        ) : null}
      </main>
    </div>
  );
}
