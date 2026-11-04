"use client";

import { useSyncExternalStore } from "react";
import { getInventoryToken } from "@/lib/inventory";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("focus", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("focus", onChange);
  };
}

export function useInventoryAuth() {
  const token = useSyncExternalStore(subscribe, getInventoryToken, () => undefined);
  const configuredPath = process.env.NEXT_PUBLIC_INVENTORY_LOGIN_PATH;
  const loginPath = configuredPath?.startsWith("/") && !configuredPath.startsWith("//")
    ? configuredPath
    : null;
  return { ready: token !== undefined, allowed: !loginPath || Boolean(token), loginPath };
}