"use client";

import { useMemo, useRef, useState } from "react";

import { analyzeIncidents, downloadIncidentResultsCsv } from "@/services/api";
import type { IncidentMetricsResponse } from "@/types/incidents";

type UiState = "idle" | "loading" | "success" | "error";

function formatMetric(value: number | null): string {
  if (value === null) {
    return "N/A";
  }

  return Number.isInteger(value) ? `${value}` : value.toFixed(2);
}

function toRows(record: Record<string, number>): Array<[string, number]> {
  return Object.entries(record).sort(([a], [b]) => a.localeCompare(b));
}

export default function IncidentsPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [state, setState] = useState<UiState>("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<IncidentMetricsResponse | null>(null);

  const invalidRows = useMemo(
    () => (result ? toRows(result.invalid_reason_counts) : []),
    [result],
  );
  const categoryRows = useMemo(
    () => (result ? toRows(result.category_counts) : []),
    [result],
  );
  const statusRows = useMemo(() => (result ? toRows(result.status_counts) : []), [result]);

  function setFile(file: File | null) {
    if (file && !file.name.toLowerCase().endsWith(".csv")) {
      setSelectedFile(null);
      setErrorMessage("El archivo seleccionado no es CSV.");
      setState("error");
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
    setState("idle");
  }

  async function handleAnalyze() {
    if (!selectedFile) {
      setErrorMessage("Debes seleccionar un archivo CSV antes de analizar.");
      setState("error");
      return;
    }

    setState("loading");
    setErrorMessage(null);

    try {
      const analysis = await analyzeIncidents(selectedFile);
      setResult(analysis);
      setState("success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      setErrorMessage(message);
      setState("error");
    }
  }

  async function handleExport() {
    setIsExporting(true);
    setErrorMessage(null);

    try {
      const blob = await downloadIncidentResultsCsv();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = "results.csv";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      setErrorMessage(message);
      setState("error");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-10 text-slate-900">
      <header className="border-b border-slate-200 bg-gradient-to-r from-cyan-900 via-slate-900 to-cyan-800 text-white">
        <div className="mx-auto w-full max-w-7xl px-6 py-8 md:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
            Postventa
          </p>
          <h1 className="mt-2 text-3xl font-bold md:text-4xl">Analisis de Incidencias</h1>
          <p className="mt-3 max-w-3xl text-sm text-cyan-50 md:text-base">
            Carga un archivo CSV para validar registros, detectar incidencias corruptas y visualizar
            metricas operativas en tiempo real.
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-6 py-8 md:px-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <h2 className="text-lg font-semibold text-slate-900">Carga de archivo</h2>
          <p className="mt-1 text-sm text-slate-600">
            Formato esperado: CSV con cabeceras de incidencias.
          </p>

          <div
            className={`mt-4 rounded-2xl border-2 border-dashed p-8 text-center transition ${
              isDragging
                ? "border-cyan-600 bg-cyan-50"
                : "border-slate-300 bg-slate-50 hover:border-cyan-500 hover:bg-cyan-50/50"
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              const droppedFile = event.dataTransfer.files?.[0] ?? null;
              setFile(droppedFile);
            }}
          >
            <p className="text-sm font-medium text-slate-700">
              Arrastra tu CSV aqui o usa el selector de archivos.
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 inline-flex h-10 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Seleccionar archivo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            {selectedFile ? (
              <p className="mt-4 text-sm text-cyan-800">
                Archivo listo: <span className="font-semibold">{selectedFile.name}</span>
              </p>
            ) : null}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleAnalyze()}
              disabled={state === "loading"}
              className="inline-flex h-11 items-center rounded-xl bg-cyan-700 px-5 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {state === "loading" ? "Analizando..." : "Analizar incidencias"}
            </button>
            <button
              type="button"
              onClick={() => void handleExport()}
              disabled={isExporting || !result}
              className="inline-flex h-11 items-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isExporting ? "Descargando..." : "Descargar resultados en CSV"}
            </button>
          </div>
        </section>

        {errorMessage ? (
          <section className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700 shadow-sm">
            <h3 className="text-base font-semibold">Error de comunicacion con la API</h3>
            <p className="mt-1 text-sm">{errorMessage}</p>
          </section>
        ) : null}

        {result ? (
          <section className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Total procesados
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{result.total_processed}</p>
              </article>
              <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
                  Registros validos
                </p>
                <p className="mt-2 text-3xl font-bold text-emerald-800">{result.total_valid}</p>
              </article>
              <article className="rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-rose-700">
                  Registros invalidos
                </p>
                <p className="mt-2 text-3xl font-bold text-rose-800">{result.total_invalid}</p>
              </article>
              <article className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-cyan-700">
                  Satisfaccion promedio
                </p>
                <p className="mt-2 text-3xl font-bold text-cyan-900">
                  {formatMetric(result.avg_closed_satisfaction)}
                </p>
                <p className="mt-1 text-xs text-cyan-800">
                  Casos cerrados con puntuacion: {result.closed_scores_count}
                </p>
              </article>
            </div>

            {result.total_invalid > 0 ? (
              <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-sm">
                <h3 className="text-base font-semibold text-amber-900">
                  Alerta: se detectaron {result.total_invalid} registros invalidos
                </h3>
                <ul className="mt-2 space-y-1 text-sm text-amber-800">
                  {invalidRows.map(([reason, count]) => (
                    <li key={reason}>
                      {reason}: <span className="font-semibold">{count}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <header className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
                    Desglose por Categoria
                  </h3>
                </header>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-white">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Categoria
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Cantidad
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {categoryRows.length > 0 ? (
                        categoryRows.map(([category, count]) => (
                          <tr key={category}>
                            <td className="px-4 py-3 text-sm text-slate-700">{category}</td>
                            <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                              {count}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="px-4 py-4 text-sm text-slate-500" colSpan={2}>
                            Sin registros validos para categorias.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <header className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
                    Desglose por Estado
                  </h3>
                </header>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-white">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Estado
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Cantidad
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {statusRows.length > 0 ? (
                        statusRows.map(([status, count]) => (
                          <tr key={status}>
                            <td className="px-4 py-3 text-sm text-slate-700">{status}</td>
                            <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                              {count}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="px-4 py-4 text-sm text-slate-500" colSpan={2}>
                            Sin registros validos para estados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
