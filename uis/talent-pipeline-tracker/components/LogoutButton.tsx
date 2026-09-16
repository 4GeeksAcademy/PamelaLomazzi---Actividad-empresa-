"use client";

import { logout } from "@/services/authClient";

export default function LogoutButton() {
  return (
    <button
      type="button"
      onClick={logout}
      className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
    >
      Cerrar sesión
    </button>
  );
}
