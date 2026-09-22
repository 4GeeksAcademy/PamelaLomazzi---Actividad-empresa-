"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import {
  getIncidentById,
  getIncidents,
  getIncidentSummary,
  updateIncidentStatus,
  type IncidentFilters,
} from "@/services/api";
import {
  HEALTHCORE_BRANCHES,
  INCIDENT_CATEGORIES,
  INCIDENT_ORIGINS,
  type Incident,
  type IncidentStatus,
  type IncidentSummary,
} from "@/types/incident";

const statuses: IncidentStatus[] = ["open", "in_progress", "resolved", "discarded"];
const transitions: Record<IncidentStatus, IncidentStatus[]> = {
  open: ["in_progress", "discarded"],
  in_progress: ["resolved", "discarded"],
  resolved: [],
  discarded: [],
};
const labels: Record<string, string> = {
  open: "Abierta", in_progress: "En progreso", resolved: "Resuelta", discarded: "Descartada",
};

function CounterGroup({ title, values }: { title: string; values: Record<string, number> }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</h3>
      <div className="mt-3 space-y-2">
        {Object.entries(values).length ? Object.entries(values).map(([key, value]) => (
          <div key={key} className="flex justify-between text-sm"><span className="text-slate-600">{labels[key] ?? key}</span><strong>{value}</strong></div>
        )) : <p className="text-sm text-slate-400">Sin datos</p>}
      </div>
    </div>
  );
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [summary, setSummary] = useState<IncidentSummary | null>(null);
  const [filters, setFilters] = useState<IncidentFilters>({});
  const [selected, setSelected] = useState<Incident | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [items, metrics] = await Promise.all([getIncidents(filters), getIncidentSummary()]);
      setIncidents(items); setSummary(metrics);
    } catch {
      setError("No se pudieron cargar las incidencias. Comprueba la conexión e inténtalo de nuevo.");
    } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => {
    void Promise.resolve().then(() => load());
  }, [load]);

  async function changeStatus(id: string, status: IncidentStatus) {
    setUpdating(id); setError(null);
    try {
      const updated = await updateIncidentStatus(id, status);
      setIncidents((current) => current.map((item) => item.id === id ? updated : item));
      setSelected((current) => current?.id === id ? updated : current);
      const metrics = await getIncidentSummary(); setSummary(metrics);
    } catch { setError("No se pudo actualizar el estado de la incidencia. Inténtalo de nuevo."); }
    finally { setUpdating(null); }
  }

  async function showDetail(id: string) {
    setSelectedId(id);
    setSelected(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      setSelected(await getIncidentById(id));
    } catch {
      setDetailError("No se pudo cargar el detalle de la incidencia. Inténtalo de nuevo.");
    } finally {
      setDetailLoading(false);
    }
  }

  function setFilter(key: keyof IncidentFilters, value: string) {
    setFilters((current) => ({ ...current, [key]: value || undefined }));
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8 text-slate-900 md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">HealthCore</p><h1 className="mt-2 text-3xl font-bold">Gestor de Incidencias</h1><p className="mt-2 text-sm text-slate-600">Consulta, filtra y gestiona el estado de las incidencias centralizadas.</p></div>
          <Link href="/incidents/new" className="rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800">+ Nueva incidencia</Link>
        </header>

        {error && <div role="alert" className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><span>{error}</span><button type="button" onClick={() => void load()} className="rounded-lg border border-red-300 bg-white px-3 py-2 font-semibold text-red-800 hover:bg-red-100">Reintentar</button></div>}

        {summary && <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wider text-cyan-700">Total</p><p className="mt-2 text-3xl font-bold text-cyan-900">{summary.total}</p></div><CounterGroup title="Por estado" values={summary.by_status} /><CounterGroup title="Por categoría" values={summary.by_category} /><CounterGroup title="Por origen" values={summary.by_origin} /></section>}
        {summary && <section className="mt-4"><CounterGroup title="Por sede" values={summary.by_branch} /></section>}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-4">
            <select aria-label="Filtrar estado" value={filters.status ?? ""} onChange={(e) => setFilter("status", e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm"><option value="">Todos los estados</option>{statuses.map((item) => <option key={item} value={item}>{labels[item]}</option>)}</select>
            <select aria-label="Filtrar origen" value={filters.origin ?? ""} onChange={(e) => setFilter("origin", e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm"><option value="">Todos los orígenes</option>{INCIDENT_ORIGINS.map((item) => <option key={item}>{item}</option>)}</select>
            <select aria-label="Filtrar sede" value={filters.branch ?? ""} onChange={(e) => setFilter("branch", e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm"><option value="">Todas las sedes</option>{HEALTHCORE_BRANCHES.map((item) => <option key={item}>{item}</option>)}</select>
            <select aria-label="Filtrar categoría" value={filters.category ?? ""} onChange={(e) => setFilter("category", e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm"><option value="">Todas las categorías</option>{INCIDENT_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4"><h2 className="font-semibold">Incidencias ({incidents.length})</h2></div>
          {loading ? <p className="p-6 text-sm text-slate-500">Cargando incidencias…</p> : incidents.length === 0 ? <p className="p-6 text-sm text-slate-500">No hay incidencias para estos filtros.</p> : <div className="divide-y divide-slate-100">{incidents.map((incident) => <article key={incident.id} className="p-5"><div className="flex flex-wrap justify-between gap-3"><div><button onClick={() => void showDetail(incident.id)} className="text-left font-semibold text-cyan-800 hover:underline">{incident.title}</button><p className="mt-1 text-sm text-slate-600">{incident.description}</p><p className="mt-2 text-xs text-slate-500">{incident.category} · {incident.origin} · {incident.branch}</p></div><div className="flex items-center gap-2"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{labels[incident.status] ?? incident.status}</span>{(transitions[incident.status as IncidentStatus] || []).map((next) => <button key={next} disabled={updating === incident.id} onClick={() => void changeStatus(incident.id, next)} className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50">{updating === incident.id ? "…" : labels[next]}</button>)}</div></div></article>)}</div>}
        </section>
      </div>

      {(detailLoading || detailError || selected) && <div className="fixed inset-0 z-10 flex items-center justify-center bg-slate-900/40 p-6" onClick={() => { setSelected(null); setSelectedId(null); setDetailError(null); }}><section role="dialog" aria-modal="true" className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}><div className="flex justify-between gap-4"><h2 className="text-xl font-bold">Detalle de incidencia</h2><button onClick={() => { setSelected(null); setSelectedId(null); setDetailError(null); }} aria-label="Cerrar detalle" className="text-2xl text-slate-400">×</button></div>{detailLoading && <p className="mt-5 text-sm text-slate-500">Cargando detalle…</p>}{detailError && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><p>{detailError}</p><div className="mt-4 flex gap-2"><button type="button" onClick={() => selectedId && void showDetail(selectedId)} className="rounded-lg bg-cyan-700 px-3 py-2 font-semibold text-white hover:bg-cyan-800">Reintentar carga</button><button type="button" onClick={() => { setSelected(null); setSelectedId(null); setDetailError(null); }} className="rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-700 hover:bg-slate-50">Cerrar</button></div></div>}{selected && !detailLoading && !detailError && <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="font-semibold text-slate-500">Estado</dt><dd>{labels[selected.status] ?? selected.status}</dd></div><div><dt className="font-semibold text-slate-500">Categoría</dt><dd>{selected.category}</dd></div><div><dt className="font-semibold text-slate-500">Origen</dt><dd>{selected.origin}</dd></div><div><dt className="font-semibold text-slate-500">Sede</dt><dd>{selected.branch}</dd></div><div className="sm:col-span-2"><dt className="font-semibold text-slate-500">Descripción</dt><dd className="mt-1 whitespace-pre-wrap">{selected.description}</dd></div><div><dt className="font-semibold text-slate-500">Creada</dt><dd>{new Date(selected.created_at).toLocaleString("es-ES")}</dd></div><div><dt className="font-semibold text-slate-500">Actualizada</dt><dd>{new Date(selected.updated_at).toLocaleString("es-ES")}</dd></div></dl>}</section></div>}
    </main>
  );
}
