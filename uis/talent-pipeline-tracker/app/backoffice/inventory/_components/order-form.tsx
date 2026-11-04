"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { inventoryApi, inventoryErrorMessage, type InventoryProduct, type OutboundPayload } from "@/lib/inventory";
import { useProducts } from "./use-products";

const fieldClass = "mt-1 w-full rounded-md border border-slate-400 bg-white px-3 py-2 disabled:bg-slate-100";

export default function OrderForm({ direction, initialProductId }: {
  direction: "inbound" | "outbound";
  initialProductId?: string;
}) {
  const outbound = direction === "outbound";
  const { products, error: productsError, reload } = useProducts();
  const [productId, setProductId] = useState(initialProductId ?? "");
  const [quantity, setQuantity] = useState("");
  const [checkedProduct, setCheckedProduct] = useState<InventoryProduct | null>(null);
  const [stockError, setStockError] = useState<{ id: number; message: string } | null>(null);
  const [stockRevision, setStockRevision] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const selectedProduct = products?.find((product) => String(product.id) === productId);
  const currentProduct = checkedProduct?.id === selectedProduct?.id ? checkedProduct : selectedProduct;
  const checkingStock = outbound && !!selectedProduct && checkedProduct?.id !== selectedProduct.id;
  const currentStockError = stockError?.id === selectedProduct?.id ? stockError?.message : "";
  const exceedsStock = outbound && !!currentProduct && Number(quantity) > currentProduct.current_stock;

  useEffect(() => {
    if (!outbound || !productId) return;
    let active = true;
    inventoryApi.product(Number(productId)).then(
      (product) => { if (active) { setCheckedProduct(product); setStockError(null); } },
      (reason: unknown) => { if (active) setStockError({ id: Number(productId), message: inventoryErrorMessage(reason) }); },
    );
    return () => { active = false; };
  }, [productId, outbound, stockRevision]);

  function changeProduct(value: string) {
    setProductId(value);
    setCheckedProduct(null);
    setStockError(null);
    setError("");
    setSuccess("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError("");
    setSuccess("");
    const form = new FormData(event.currentTarget);
    const amount = Number(quantity);
    const userUuid = String(form.get("user_uuid") ?? "").trim();
    const vendor = String(form.get("vendor_name") ?? "").trim();
    if (!selectedProduct || !Number.isSafeInteger(amount) || amount <= 0 || !userUuid || (!outbound && !vendor)) {
      setError("Completa los campos obligatorios con una cantidad entera mayor que cero.");
      return;
    }
    if (exceedsStock) return;
    setSubmitting(true);
    try {
      const payload = {
        supply_id: selectedProduct.id,
        quantity: amount,
        clinic_id: Number(form.get("clinic_id")),
        user_uuid: userUuid,
      };
      if (outbound) {
        const latest = await inventoryApi.product(selectedProduct.id);
        setCheckedProduct(latest);
        if (amount > latest.current_stock) {
          setError("El stock cambio. La cantidad solicitada supera el stock disponible.");
          return;
        }
        await inventoryApi.outbound({
          ...payload,
          consumption_type: form.get("consumption_type") as OutboundPayload["consumption_type"],
        });
        setCheckedProduct({ ...latest, current_stock: latest.current_stock - amount });
      } else {
        await inventoryApi.inbound({ ...payload, vendor_name: vendor });
      }
      setSuccess(`${outbound ? "Salida" : "Entrada"} registrada: ${amount} ${selectedProduct.unit} de ${selectedProduct.name}.`);
      setQuantity("");
      reload();
    } catch (reason) {
      setError(inventoryErrorMessage(reason));
      if (outbound) {
        setCheckedProduct(null);
        setStockRevision((value) => value + 1);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="max-w-2xl" aria-labelledby="order-title">
      <h2 id="order-title" className="text-xl font-semibold">{outbound ? "Registrar salida" : "Registrar entrada"}</h2>
      {productsError && <div role="alert" className="mt-4 text-red-700">{productsError} <button type="button" onClick={reload} className="underline">Reintentar</button></div>}
      {!products && !productsError && <p role="status" className="mt-4">Cargando productos...</p>}
      {products?.length === 0 && <p className="mt-4">No hay productos registrados.</p>}
      <form onSubmit={submit} className="mt-6 space-y-5">
        <fieldset disabled={submitting || !products?.length} className="space-y-5 disabled:opacity-70">
          <legend className="sr-only">Datos de la orden</legend>
          <label className="block text-sm font-medium">Producto
            <select required value={productId} onChange={(event) => changeProduct(event.target.value)} className={fieldClass}>
              <option value="">Selecciona un producto</option>
              {products?.map((product) => <option key={product.id} value={product.id}>{product.name} ({product.sku})</option>)}
            </select>
          </label>
          {outbound && currentProduct && (
            <div role="status" aria-live="polite" className="border-l-4 border-cyan-700 bg-cyan-50 p-4">
              <p className="text-sm text-cyan-900">Stock disponible actual</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{currentProduct.current_stock} <span className="text-base font-normal">{currentProduct.unit}</span></p>
              {checkingStock && !currentStockError && <p className="mt-1 text-sm">Actualizando stock...</p>}
            </div>
          )}
          {currentStockError && <p role="alert" className="text-red-700">{currentStockError} <button type="button" onClick={() => setStockRevision((value) => value + 1)} className="underline">Reintentar</button></p>}
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-medium">Cantidad
              <input required type="number" min="1" step="1" value={quantity}
                onChange={(event) => { setQuantity(event.target.value); setSuccess(""); }}
                aria-invalid={exceedsStock} aria-describedby={exceedsStock ? "quantity-warning" : undefined} className={fieldClass} />
            </label>
            <label className="block text-sm font-medium">Clinica
              <select name="clinic_id" required defaultValue="" className={fieldClass}>
                <option value="">Selecciona una clinica</option>
                {Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>Clinica {index + 1}</option>)}
              </select>
            </label>
          </div>
          {exceedsStock && <p id="quantity-warning" role="alert" className="text-sm font-medium text-red-700">La cantidad supera el stock disponible. Maximo: {currentProduct?.current_stock} {currentProduct?.unit}.</p>}
          {outbound ? (
            <label className="block text-sm font-medium">Tipo de consumo
              <select name="consumption_type" defaultValue="clinical_use" className={fieldClass}>
                <option value="clinical_use">Consumo / despacho clinico</option>
                <option value="expiry_waste">Baja por vencimiento</option>
              </select>
            </label>
          ) : (
            <label className="block text-sm font-medium">Proveedor
              <input name="vendor_name" required className={fieldClass} />
            </label>
          )}
          <label className="block text-sm font-medium">UUID del usuario responsable
            <input name="user_uuid" required className={fieldClass} autoComplete="off" />
          </label>
        </fieldset>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        {success && <p role="status" className="text-sm text-emerald-800">{success}</p>}
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" disabled={submitting || !selectedProduct || exceedsStock || checkingStock || !!currentStockError || !!productsError}
            className="rounded-md bg-cyan-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-900 disabled:cursor-not-allowed disabled:opacity-50">
            {submitting ? "Registrando..." : outbound ? "Registrar salida" : "Registrar entrada"}
          </button>
          <Link href="/backoffice/inventory/products" className="text-sm text-cyan-800 underline">Volver a productos</Link>
        </div>
      </form>
    </section>
  );
}