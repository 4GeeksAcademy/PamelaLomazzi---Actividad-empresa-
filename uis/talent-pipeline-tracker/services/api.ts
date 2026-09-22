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
import type { Incident, IncidentCreatePayload, IncidentStatus, IncidentSummary } from "@/types/incident";

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

const HTTP_ERROR_MESSAGES: { [status: number]: string } = {
  400: "Los datos enviados no son válidos.",
  401: "No tienes autorización para realizar esta operación.",
  403: "No tienes permisos para realizar esta operación.",
  404: "Recurso no encontrado.",
  409: "La operación no se puede completar porque existe un conflicto.",
  413: "El archivo enviado es demasiado grande.",
  429: "Demasiadas solicitudes. Inténtalo de nuevo más tarde.",
  500: "Ocurrió un error en el servidor. Por favor, reintenta más tarde.",
};

const INVALID_RESPONSE_MESSAGE =
  "Error de comunicación con el servidor (respuesta no válida).";

function getHttpErrorMessage(status: number): string {
  if (HTTP_ERROR_MESSAGES[status]) {
    return HTTP_ERROR_MESSAGES[status];
  }

  if (status >= 500) {
    return "Ocurrió un error en el servidor. Por favor, reintenta más tarde.";
  }

  if (status >= 400) {
    return "No se pudo completar la solicitud.";
  }

  return "Error de comunicación con el servidor.";
}

async function parseResponse<T>(response: Response): Promise<T> {
  const isJson = response.headers.get("content-type")?.includes("application/json");
  let payload: unknown = null;

  if (isJson) {
    try {
      payload = await response.json();
    } catch {
      throw new Error(INVALID_RESPONSE_MESSAGE);
    }
  }

  if (!response.ok) {
    throw new Error(getHttpErrorMessage(response.status));
  }

  return payload as T;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, init);
  } catch {
    throw new Error("No se pudo conectar con el servidor. Inténtalo de nuevo.");
  }

  return parseResponse<T>(response);
}

export async function getRecords(): Promise<RecordsResponse> {
  try {
    return await requestJson<RecordsResponse>(`${getApiUrl()}/records`, {
      method: "GET",
      cache: "no-store",
    });
  } catch {
    throw new Error("No se pudieron obtener los registros. Inténtalo de nuevo.");
  }
}

export async function getRecordById(id: string): Promise<Record> {
  try {
    return await requestJson<Record>(`${getApiUrl()}/records/${id}`, {
      method: "GET",
      cache: "no-store",
    });
  } catch {
    throw new Error("No se pudo obtener el registro solicitado. Inténtalo de nuevo.");
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

export async function createIncident(payload: IncidentCreatePayload): Promise<Incident> {
  try {
    const response = await fetch(getIncidentsRouteBase(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await parseResponse<Incident>(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    throw new Error(`No se pudo registrar la incidencia: ${message}`);
  }
}

export type IncidentFilters = Partial<Pick<Incident, "status" | "origin" | "branch" | "category">>;

export async function getIncidents(filters: IncidentFilters = {}): Promise<Incident[]> {
  try {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const query = params.toString();
    return await requestJson<Incident[]>(
      `${getIncidentsRouteBase()}${query ? `?${query}` : ""}`,
      { cache: "no-store" },
    );
  } catch {
    throw new Error("No se pudieron obtener las incidencias. Inténtalo de nuevo.");
  }
}

export async function getIncidentById(id: string): Promise<Incident> {
  try {
    return await requestJson<Incident>(`${getIncidentsRouteBase()}/${id}`, {
      cache: "no-store",
    });
  } catch {
    throw new Error("No se pudo obtener la incidencia solicitada. Inténtalo de nuevo.");
  }
}

export async function getIncidentSummary(): Promise<IncidentSummary> {
  try {
    return await requestJson<IncidentSummary>(`${getIncidentsRouteBase()}/summary`, {
      cache: "no-store",
    });
  } catch {
    throw new Error("No se pudo obtener el resumen de incidencias. Inténtalo de nuevo.");
  }
}

export async function updateIncidentStatus(id: string, status: IncidentStatus): Promise<Incident> {
  try {
    return await requestJson<Incident>(`${getIncidentsRouteBase()}/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  } catch {
    throw new Error("No se pudo actualizar el estado de la incidencia. Inténtalo de nuevo.");
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
