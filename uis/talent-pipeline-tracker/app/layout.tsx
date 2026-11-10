import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pipeline de selección médica y administrativa | HealthCore",
  description:
    "Plataforma interna de HealthCore para registrar candidaturas y gestionar etapas, estados y seguimiento de los procesos de selección médica y administrativa.",
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "HealthCore",
    title: "Pipeline de selección médica y administrativa | HealthCore",
    description:
      "Plataforma interna de HealthCore para registrar candidaturas y gestionar etapas, estados y seguimiento de los procesos de selección médica y administrativa.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <nav className="border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3 px-6 py-3 md:px-8">
            <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-800">
              HealthCore
            </span>
            <Link
              href="/"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Pipeline de Talento
            </Link>
            <Link
              href="/incidents"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Analisis de Incidencias
            </Link>
            <Link
              href="/backoffice/inventory/products"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Inventario
            </Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
