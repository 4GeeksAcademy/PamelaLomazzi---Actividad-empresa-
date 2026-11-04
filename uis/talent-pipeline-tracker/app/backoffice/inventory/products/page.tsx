"use client";

import Link from "next/link";
import { useProducts } from "../_components/use-products";

const LOW_STOCK_THRESHOLD = 10;

export default function ProductsPage() {
  const { products, error, reload } = useProducts();
  return (
    <section aria-labelledby="products-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="products-title" className="text-xl font-semibold">Productos</h2>
        <button type="button" onClick={reload} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-100">Actualizar stock</button>
      </div>
      <p className="mt-2 text-sm text-slate-600">Stock bajo: {LOW_STOCK_THRESHOLD} unidades o menos.</p>
      {error && <p role="alert" className="mt-4 text-red-700">{error}</p>}
      {!products && !error && <p role="status" className="mt-4">Cargando productos...</p>}
      {products?.length === 0 && <p className="mt-4">No hay productos registrados.</p>}
      {!!products?.length && (
        <div className="mt-4 overflow-x-auto border-y border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Productos y existencias actuales</caption>
            <thead className="bg-slate-100"><tr>
              {["Producto", "SKU", "Categoria", "Stock actual", "Estado", "Acciones"].map((label) => <th key={label} scope="col" className="px-4 py-3 font-semibold">{label}</th>)}
            </tr></thead>
            <tbody>{products.map((product) => (
              <tr key={product.id} className="border-t border-slate-200">
                <th scope="row" className="px-4 py-4 font-medium">{product.name}</th>
                <td className="px-4 py-4">{product.sku}</td>
                <td className="px-4 py-4">{product.category}</td>
                <td className="whitespace-nowrap px-4 py-4 tabular-nums">{product.current_stock} {product.unit}</td>
                <td className="px-4 py-4"><span className={`inline-block whitespace-nowrap rounded px-2 py-1 text-xs font-medium ${product.current_stock <= LOW_STOCK_THRESHOLD ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-800"}`}>
                  {product.current_stock <= LOW_STOCK_THRESHOLD ? "Stock bajo" : "Saludable"}
                </span></td>
                <td className="px-4 py-4"><div className="flex flex-wrap gap-x-4 gap-y-2">
                  <Link href={`/backoffice/inventory/orders/inbound?product=${product.id}`} aria-label={`Registrar entrada de ${product.name}`} className="font-medium text-cyan-800 underline">Registrar entrada</Link>
                  <Link href={`/backoffice/inventory/orders/outbound?product=${product.id}`} aria-label={`Registrar salida de ${product.name}`} className="font-medium text-cyan-800 underline">Registrar salida</Link>
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}