"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import LogoutButton from "@/components/LogoutButton";

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export default function AuthNavActions() {
  const pathname = usePathname();

  if (isPublicPath(pathname)) {
    return null;
  }

  return (
    <>
      <Link
        href="/account/profile"
        className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
      >
        Mi cuenta
      </Link>
      <div className="ml-auto">
        <LogoutButton />
      </div>
    </>
  );
}
