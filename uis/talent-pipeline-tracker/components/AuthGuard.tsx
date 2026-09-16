"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

import { isAuthenticated } from "@/services/authClient";

const PUBLIC_PATHS = ["/login", "/register"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function subscribeNoop(): () => void {
  return () => {};
}

function getServerSnapshot(): boolean {
  return false;
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const publicPath = isPublicPath(pathname);
  // useSyncExternalStore evita el desajuste de hidratación al leer localStorage.
  const authenticated = useSyncExternalStore(subscribeNoop, isAuthenticated, getServerSnapshot);

  useEffect(() => {
    if (!publicPath && !authenticated) {
      router.replace("/login");
    }
  }, [publicPath, authenticated, router]);

  if (!publicPath && !authenticated) {
    return null;
  }

  return <>{children}</>;
}
