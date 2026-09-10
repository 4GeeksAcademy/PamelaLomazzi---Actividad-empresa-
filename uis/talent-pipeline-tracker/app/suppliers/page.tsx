"use client";

import { useEffect, useMemo, useState } from "react";

import { createSupplier, getSuppliers, updateSupplierRate, updateSupplierStatus } from "@/services/api";
import type { Supplier, SupplierPayload, SupplierStatus } from "@/types/supplier";
import SupplierForm from "./_components/supplier-form";

const STATUS_STYLE: Record<SupplierStatus, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  suspended: "border-rose-200 bg-rose-50 text-rose-700",
};

const STATUS_LABEL: Record<SupplierStatus, string> = {
  active: "Activo",
  suspended: "Suspendido",
};

function formatCurrency(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [rowActionError, setRowActionError] = useState<string | null>(null);
  const [editingRateId, setEditingRateId] = useState<number | null>(null);
  const [rateDraft, setRateDraft] = useState<string>("");

  useEffect(() => {
    async function loadSuppliers() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getSuppliers();
        setSuppliers(data);
      } catch (fetchError) {
        const message = fetchError instanceof Error ? fetchError.message : "Error desconocido";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    void loadSuppliers();
  }, []);

  const categoryOptions = useMemo(() => {
    const unique = new Set<string>();
    suppliers.forEach((supplier) => supplier.categories.forEach((category) => unique.add(category)));
    return Array.from(unique).sort();
  }, [suppliers]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier) => {
      const byCountry = countryFilter === "all" || supplier.country === countryFilter;
      const byCategory = categoryFilter === "all" || supplier.categories.includes(categoryFilter);
      return byCountry && byCategory;
    });
  }, [suppliers, countryFilter, categoryFilter]);

  async function handleCreateSupplier(values: SupplierPayload) {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const created = await createSupplier(values);
      setSuppliers((prev) => [...prev, created]);
      setIsFormOpen(false);
    } catch (submitErr) {
      const message = submitErr instanceof Error ? submitErr.message : "Error desconocido";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function startRateEdit(supplier: Supplier) {
    setRowActionError(null);
    setEditingRateId(supplier.id);
    setRateDraft(String(supplier.monthly_rate));
  }

  async function saveRateEdit(supplier: Supplier) {
    const rateValue = Number(rateDraft);
    if (Number.isNaN(rateValue) || rateValue <= 0) {
      setRowActionError("La tarifa debe ser un número mayor a 0.");
      return;
    }

    try {
      const updated = await updateSupplierRate(supplier.id, rateValue);
      setSuppliers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setEditingRateId(null);
      setRowActionError(null);
    } catch (rateError) {
      const message = rateError instanceof Error ? rateError.message : "Error desconocido";
      setRowActionError(message);
    }
  }

  async function toggleStatus(supplier: Supplier) {
    const nextStatus: SupplierStatus = supplier.status === "active" ? "suspended" : "active";
    setRowActionError(null);

    try {
      const updated = await updateSupplierStatus(supplier.id, nextStatus);
      setSuppliers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (statusError) {
      const message = statusError instanceof Error ? statusError.message : "Error desconocido";
      setRowActionError(message);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-10 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">
              Operaciones
            </p>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
              Directorio de Proveedores
            </h1>
            <p className="text-sm text-slate-600">
              Gestión de proveedores, tarifas mensuales y estado contractual.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSubmitError(null);
              setIsFormOpen(true);
            }}
            className="inline-flex h-10 items-center rounded-xl bg-cyan-700 px-4 text-sm font-semibold text-white transition hover:bg-cyan-800"
          >
            Registrar proveedor
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-6 py-8 md:px-8">
        <section className="mb-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 md:p-5">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">País</span>
            <select
              value={countryFilter}
              onChange={(event) => setCountryFilter(event.target.value)}
              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-cyan-600"
            >
              <option value="all">Todos</option>
              <option value="USA">USA</option>
              <option value="UK">UK</option>
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">Categoría</span>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-cyan-600"
            >
              <option value="all">Todas</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
        </section>

        {rowActionError ? (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {rowActionError}
          </div>
        ) : null}

        {error ? (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">País</th>
                <th className="px-4 py-3">Categorías</th>
                <th className="px-4 py-3">Tarifa mensual</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    Cargando proveedores...
                  </td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    No hay proveedores para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td className="px-4 py-3 font-medium text-slate-800">{supplier.name}</td>
                    <td className="px-4 py-3">{supplier.country}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {supplier.categories.map((category) => (
                          <span
                            key={category}
                            className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {editingRateId === supplier.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.01"
                            value={rateDraft}
                            onChange={(event) => setRateDraft(event.target.value)}
                            className="h-9 w-28 rounded-lg border border-slate-300 px-2 text-sm outline-none focus:border-cyan-600"
                          />
                          <button
                            type="button"
                            onClick={() => void saveRateEdit(supplier)}
                            className="rounded-lg bg-cyan-700 px-2 py-1 text-xs font-semibold text-white hover:bg-cyan-800"
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingRateId(null)}
                            className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startRateEdit(supplier)}
                          className="underline decoration-dotted underline-offset-4 hover:text-cyan-700"
                        >
                          {formatCurrency(supplier.monthly_rate, supplier.currency)}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[supplier.status]}`}
                      >
                        {STATUS_LABEL[supplier.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => void toggleStatus(supplier)}
                        className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        {supplier.status === "active" ? "Suspender" : "Activar"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </main>

      {isFormOpen ? (
        <SupplierForm
          isSubmitting={isSubmitting}
          submitError={submitError}
          onSubmit={handleCreateSupplier}
          onCancel={() => setIsFormOpen(false)}
        />
      ) : null}
    </div>
  );
}
