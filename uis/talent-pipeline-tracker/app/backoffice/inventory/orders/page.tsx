"use client";

import { useEffect, useState } from "react";
import { inventoryApi, inventoryErrorMessage, type InventoryOrder } from "@/lib/inventory";

export default function OrdersPage() {
  const [orders, setOrders] = useState<InventoryOrder[] | null>(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    inventoryApi.orders().then(
      (data) => { if (active) { setOrders(data); setError(""); } },
      (reason: unknown) => { if (active) setError(inventoryErrorMessage(reason)); },
    );
    return () => { active = false; };
  }, [revision]);

  return (
    <section aria-labelledby="orders-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="orders-title" className="text-xl font-semibold">Historial de ordenes</h2>
        <button type="button" onClick={() => { setOrders(null); setError(""); setRevision((value) => value + 1); }} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-100">Actualizar historial</button>
      </div>
      {error && <p role="alert" className="mt-4 text-red-700">{error}</p>}
      {!orders && !error && <p role="status" className="mt-4">Cargando ordenes...</p>}
      {orders?.length === 0 && <p className="mt-4">No hay ordenes registradas.</p>}
      {!!orders?.length && <div className="mt-4 overflow-x-auto border-y border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Entradas y salidas de inventario, mas recientes primero</caption>
          <thead className="bg-slate-100"><tr>
            {["Tipo", "Producto", "Cantidad", "Fecha", "user_uuid"].map((label) => <th scope="col" key={label} className="px-4 py-3 font-semibold">{label}</th>)}
          </tr></thead>
          <tbody>{orders.map((order) => <tr key={`${order.order_type}-${order.id}`} className="border-t border-slate-200">
            <td className="px-4 py-4"><span className={`rounded px-2 py-1 text-xs font-medium ${order.order_type === "inbound" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>{order.order_type === "inbound" ? "Entrada" : "Salida"}</span></td>
            <th scope="row" className="px-4 py-4 font-medium">{order.product_name}</th>
            <td className="px-4 py-4 tabular-nums">{order.quantity}</td>
            <td className="whitespace-nowrap px-4 py-4"><time dateTime={order.created_at}>{new Date(order.created_at).toLocaleString("es-ES")}</time></td>
            <td className="max-w-64 break-all px-4 py-4 font-mono text-xs">{order.user_uuid}</td>
          </tr>)}</tbody>
        </table>
      </div>}
    </section>
  );
}