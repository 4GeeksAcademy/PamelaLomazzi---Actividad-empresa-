"use client";

import { useMemo } from "react";
import type { IncidentMetricsResponse } from "@/types/incidents";

function formatMetric(value: number | null): string {
  if (value === null) return "N/A";
  return Number.isInteger(value) ? `${value}` : value.toFixed(2);
}

function toRows(record: Record<string, number>): Array<[string, number]> {
  return Object.entries(record).sort(([first], [second]) => first.localeCompare(second));
}

export default function IncidentResults({ result }: { result: IncidentMetricsResponse }) {
  const invalidRows = useMemo(() => toRows(result.invalid_reason_counts), [result.invalid_reason_counts]);
  const categoryRows = useMemo(() => toRows(result.category_counts), [result.category_counts]);
  const statusRows = useMemo(() => toRows(result.status_counts), [result.status_counts]);

  return (
    <section className="mt-6 space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Total procesados</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{result.total_processed}</p>
        </article>
        <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">Registros validos</p>
          <p className="mt-2 text-3xl font-bold text-emerald-800">{result.total_valid}</p>
        </article>
        <article className="rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-rose-700">Registros invalidos</p>
          <p className="mt-2 text-3xl font-bold text-rose-800">{result.total_invalid}</p>
        </article>
        <article className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-700">Satisfaccion promedio</p>
          <p className="mt-2 text-3xl font-bold text-cyan-900">{formatMetric(result.avg_closed_satisfaction)}</p>
          <p className="mt-1 text-xs text-cyan-800">Casos cerrados con puntuacion: {result.closed_scores_count}</p>
        </article>
      </div>

      {result.total_invalid > 0 ? (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-sm">
          <h3 className="text-base font-semibold text-amber-900">Alerta: se detectaron {result.total_invalid} registros invalidos</h3>
          <ul className="mt-2 space-y-1 text-sm text-amber-800">
            {invalidRows.map(([reason, count]) => (
              <li key={reason}>{reason}: <span className="font-semibold">{count}</span></li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700">Desglose por Categoria</h3>
          </header>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-white"><tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Categoria</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">Cantidad</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {categoryRows.length > 0 ? categoryRows.map(([category, count]) => (
                  <tr key={category}>
                    <td className="px-4 py-3 text-sm text-slate-700">{category}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">{count}</td>
                  </tr>
                )) : <tr><td className="px-4 py-4 text-sm text-slate-500" colSpan={2}>Sin registros validos para categorias.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700">Desglose por Estado</h3>
          </header>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-white"><tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">Cantidad</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {statusRows.length > 0 ? statusRows.map(([status, count]) => (
                  <tr key={status}>
                    <td className="px-4 py-3 text-sm text-slate-700">{status}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">{count}</td>
                  </tr>
                )) : <tr><td className="px-4 py-4 text-sm text-slate-500" colSpan={2}>Sin registros validos para estados.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  );
}