"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useInventoryAuth } from "@/lib/inventory-auth";

const links = [
  ["/backoffice/inventory/products", "Productos"],
  ["/backoffice/inventory/orders/inbound", "Entrada"],
  ["/backoffice/inventory/orders/outbound", "Salida"],
  ["/backoffice/inventory/orders", "Historial"],
] as const;

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  const { ready, allowed, loginPath } = useInventoryAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (ready && !allowed && loginPath) {
      router.replace(`${loginPath}?next=${encodeURIComponent(pathname)}`);
    }
  }, [ready, allowed, loginPath, pathname, router]);

  if (!ready || !allowed) {
    return <main className="mx-auto w-full max-w-7xl p-6" role="status">Verificando acceso...</main>;
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-8 md:px-8">
      <p className="text-sm font-medium text-cyan-800">Backoffice / HealthCore</p>
      <h1 className="mt-2 text-3xl font-semibold">Inventario e insumos</h1>
      <nav aria-label="Inventario" className="my-6 flex flex-wrap gap-2 border-b border-slate-300 pb-3">
        {links.map(([href, label]) => (
          <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}
            className={`rounded-md px-4 py-2 text-sm font-medium ${pathname === href ? "bg-cyan-800 text-white" : "text-slate-700 hover:bg-slate-200"}`}>
            {label}
          </Link>
        ))}
      </nav>
      {children}
    </main>
  );
}