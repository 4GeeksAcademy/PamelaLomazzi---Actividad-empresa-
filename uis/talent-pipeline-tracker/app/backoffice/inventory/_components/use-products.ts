"use client";

import { useEffect, useState } from "react";
import { inventoryApi, inventoryErrorMessage, type InventoryProduct } from "@/lib/inventory";

export function useProducts() {
  const [products, setProducts] = useState<InventoryProduct[] | null>(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    inventoryApi.products(undefined, revision > 0).then(
      (data) => { if (active) { setProducts(data); setError(""); } },
      (reason: unknown) => { if (active) setError(inventoryErrorMessage(reason)); },
    );
    return () => { active = false; };
  }, [revision]);

  function reload() {
    setProducts(null);
    setError("");
    setRevision((value) => value + 1);
  }

  return { products, error, reload };
}