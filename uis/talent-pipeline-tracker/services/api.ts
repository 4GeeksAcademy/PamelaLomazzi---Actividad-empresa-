import {
  type Note,
  type NotePayload,
  type NotesResponse,
  type Record,
  type RecordPatchPayload,
  type RecordPayload,
  type RecordsResponse,
} from "@/types/candidate";
import type { IncidentMetricsResponse } from "@/types/incidents";
import type { Supplier, SupplierFilters, SupplierPayload, SupplierStatus } from "@/types/supplier";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const INCIDENTS_API_URL = process.env.NEXT_PUBLIC_INCIDENTS_API_URL;
const DEFAULT_API_URL = "http://localhost:8000";

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

function isValidHttpBaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isLoopbackUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function deriveRemoteDevApiUrl(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const { protocol, host, hostname } = window.location;
  const isRemoteDevHost =
    hostname.endsWith("app.github.dev") || hostname.endsWith("githubpreview.dev");

  if (!isRemoteDevHost) {
    return null;
  }

  const match = host.match(/^(.*)-\d+\.(app\.github\.dev|githubpreview\.dev)$/);
  if (!match) {
    return null;
  }

  const backendHost = `${match[1]}-8000.${match[2]}`;

  return `${protocol}//${backendHost}`;
}

function resolveApiBaseUrl(configured?: string): string {
  const dynamicRemoteUrl = deriveRemoteDevApiUrl();
  if (configured) {
    const normalized = normalizeBaseUrl(configured);
    if (!isValidHttpBaseUrl(normalized)) {
      return dynamicRemoteUrl ?? DEFAULT_API_URL;
    }

    if (dynamicRemoteUrl && isLoopbackUrl(normalized)) {
      return dynamicRemoteUrl;
    }

    return normalized;
  }

  return dynamicRemoteUrl ?? DEFAULT_API_URL;
}

function getApiUrl(): string {
  return resolveApiBaseUrl(API_URL);
}

function getIncidentsApiBaseUrl(): string {
  return resolveApiBaseUrl(INCIDENTS_API_URL ?? API_URL);
}

function getIncidentsRouteBase(): string {
  const baseUrl = getIncidentsApiBaseUrl();
  return baseUrl.endsWith("/api") ? `${baseUrl}/incidents` : `${baseUrl}/api/incidents`;
}

function getSuppliersRouteBase(): string {
  const baseUrl = getIncidentsApiBaseUrl();
  return baseUrl.endsWith("/api") ? `${baseUrl.slice(0, -"/api".length)}/suppliers` : `${baseUrl}/suppliers`;
}

function formatValidationDetail(detail: unknown): string | null {
  if (!Array.isArray(detail)) {
    return null;
  }

  const messages = detail
    .map((item) => (item && typeof item === "object" && "msg" in item ? String(item.msg) : null))
    .filter((msg): msg is string => Boolean(msg));

  return messages.length > 0 ? messages.join(" ") : null;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const message =
      (payload && typeof payload === "object" && "detail" in payload && formatValidationDetail(payload.detail)) ||
      (payload && typeof payload === "object" && "detail" in payload && String(payload.detail)) ||
      (payload && typeof payload === "object" && "message" in payload && String(payload.message)) ||
      `HTTP ${response.status}`;

    throw new Error(message);
  }

  return payload as T;
}

export async function getRecords(): Promise<RecordsResponse> {
  try {
    const response = await fetch(`${getApiUrl()}/records`, {
      method: "GET",
      cache: "no-store",
    });

    return await parseResponse<RecordsResponse>(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    throw new Error(`No se pudieron obtener los registros: ${message}`);
  }
}

export async function getRecordById(id: string): Promise<Record> {
  try {
    const response = await fetch(`${getApiUrl()}/records/${id}`, {
      method: "GET",
      cache: "no-store",
    });

    return await parseResponse<Record>(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    throw new Error(`No se pudo obtener el registro ${id}: ${message}`);
  }
}

export async function createRecord(data: RecordPayload): Promise<Record> {
  try {
    const response = await fetch(`${getApiUrl()}/records`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    return await parseResponse<Record>(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    throw new Error(`No se pudo crear el registro: ${message}`);
  }
}

export async function updateRecord(id: string, data: RecordPayload): Promise<Record> {
  try {
    const response = await fetch(`${getApiUrl()}/records/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    return await parseResponse<Record>(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    throw new Error(`No se pudo actualizar el registro ${id}: ${message}`);
  }
}

export async function patchRecordStatusOrStage(
  id: string,
  data: RecordPatchPayload,
): Promise<Record> {
  try {
    const response = await fetch(`${getApiUrl()}/records/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    return await parseResponse<Record>(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    throw new Error(`No se pudo cambiar estado/etapa del registro ${id}: ${message}`);
  }
}

export async function getNotes(id: string): Promise<NotesResponse> {
  try {
    const response = await fetch(`${getApiUrl()}/records/${id}/notes`, {
      method: "GET",
      cache: "no-store",
    });

    return await parseResponse<NotesResponse>(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    throw new Error(`No se pudieron obtener las notas del registro ${id}: ${message}`);
  }
}

export async function createNote(id: string, note: NotePayload): Promise<Note> {
  try {
    const response = await fetch(`${getApiUrl()}/records/${id}/notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(note),
    });

    return await parseResponse<Note>(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    throw new Error(`No se pudo crear la nota para el registro ${id}: ${message}`);
  }
}

export async function deleteNote(id: string, noteId: string): Promise<void> {
  try {
    const response = await fetch(`${getApiUrl()}/records/${id}/notes/${noteId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      await parseResponse(response);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    throw new Error(
      `No se pudo eliminar la nota ${noteId} del registro ${id}: ${message}`,
    );
  }
}

export async function analyzeIncidents(file: File): Promise<IncidentMetricsResponse> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${getIncidentsRouteBase()}/analyze`, {
      method: "POST",
      body: formData,
    });

    return await parseResponse<IncidentMetricsResponse>(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    throw new Error(`No se pudo analizar el archivo de incidencias: ${message}`);
  }
}

export async function downloadIncidentResultsCsv(): Promise<Blob> {
  try {
    const response = await fetch(`${getIncidentsRouteBase()}/results/export`, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      await parseResponse(response);
    }

    return await response.blob();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    throw new Error(`No se pudo descargar el CSV de resultados: ${message}`);
  }
}

export async function getSuppliers(filters?: SupplierFilters): Promise<Supplier[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.country) params.set("country", filters.country);
    if (filters?.category) params.set("category", filters.category);
    const query = params.toString();

    const response = await fetch(`${getSuppliersRouteBase()}${query ? `?${query}` : ""}`, {
      method: "GET",
      cache: "no-store",
    });

    return await parseResponse<Supplier[]>(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    throw new Error(`No se pudieron obtener los proveedores: ${message}`);
  }
}

export async function createSupplier(data: SupplierPayload): Promise<Supplier> {
  try {
    const response = await fetch(getSuppliersRouteBase(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    return await parseResponse<Supplier>(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    throw new Error(`No se pudo crear el proveedor: ${message}`);
  }
}

export async function updateSupplierRate(id: number, monthlyRate: number): Promise<Supplier> {
  try {
    const response = await fetch(`${getSuppliersRouteBase()}/${id}/rate`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ monthly_rate: monthlyRate }),
    });

    return await parseResponse<Supplier>(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    throw new Error(`No se pudo actualizar la tarifa del proveedor ${id}: ${message}`);
  }
}

export async function updateSupplierStatus(id: number, status: SupplierStatus): Promise<Supplier> {
  try {
    const response = await fetch(`${getSuppliersRouteBase()}/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    return await parseResponse<Supplier>(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    throw new Error(`No se pudo actualizar el estado del proveedor ${id}: ${message}`);
  }
}
