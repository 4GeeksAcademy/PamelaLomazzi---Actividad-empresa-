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

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const INCIDENTS_API_URL = process.env.NEXT_PUBLIC_INCIDENTS_API_URL;
const DEFAULT_API_URL = "http://localhost:8000";

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
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

  const backendHost = host
    .replace(/-3000\./, "-8000.")
    .replace(/-3001\./, "-8000.");

  return `${protocol}//${backendHost}`;
}

function resolveApiBaseUrl(configured?: string): string {
  const dynamicRemoteUrl = deriveRemoteDevApiUrl();
  if (configured) {
    const normalized = normalizeBaseUrl(configured);
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

async function parseResponse<T>(response: Response): Promise<T> {
  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const message =
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
