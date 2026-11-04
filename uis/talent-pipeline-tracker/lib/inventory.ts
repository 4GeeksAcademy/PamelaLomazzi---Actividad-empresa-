export interface InventoryProduct {
  id: number;
  name: string;
  sku: string;
  category: string;
  unit: string;
  country: string;
  current_stock: number;
}

interface OrderPayload {
  supply_id: number;
  quantity: number;
  clinic_id: number;
  user_uuid: string;
}

export interface InboundPayload extends OrderPayload {
  vendor_name: string;
}

export interface OutboundPayload extends OrderPayload {
  consumption_type: "clinical_use" | "expiry_waste";
}

interface OrderResponse extends OrderPayload {
  id: number;
  created_at: string;
}

export type InventoryOrder = OrderResponse & {
  order_type: "inbound" | "outbound";
  product_name: string;
};

export class InventoryApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "InventoryApiError";
  }
}

export function getInventoryToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem("token");
  } catch {
    return null;
  }
}

function apiMessage(body: unknown): string | undefined {
  if (typeof body === "string") return body;
  if (!body || typeof body !== "object") return undefined;
  const record = body as Record<string, unknown>;
  for (const value of [record.detail, record.message, record.error]) {
    if (typeof value === "string") return value;
    if (Array.isArray(value)) {
      const messages = value.flatMap((item: unknown) => {
        if (!item || typeof item !== "object") return [];
        const detail = item as Record<string, unknown>;
        return typeof detail.msg === "string" ? [detail.msg] : [];
      });
      if (messages.length) return messages.join("; ");
    }
    if (value && typeof value === "object" && "message" in value) {
      if (typeof value.message === "string") return value.message;
    }
  }
  return undefined;
}

export function inventoryErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "No se pudo completar la operacion.";
}

async function request<ResponseBody>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<ResponseBody> {
  const configuredUrl = process.env.NEXT_PUBLIC_INVENTORY_API_URL?.trim().replace(/\/+$/, "");
  if (!configuredUrl) {
    throw new InventoryApiError("Falta configurar NEXT_PUBLIC_INVENTORY_API_URL.", 0);
  }
  const baseUrl = configuredUrl.endsWith("/inventory") ? configuredUrl : `${configuredUrl}/inventory`;
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body) headers.set("Content-Type", "application/json");
  const accessToken = token === undefined ? getInventoryToken() : token;
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
      cache: "no-store",
      credentials: "same-origin",
    });
  } catch {
    throw new InventoryApiError("No se pudo conectar con inventario. Revisa la conexion e intentalo de nuevo.", 0);
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new InventoryApiError(
      apiMessage(body) || (response.status === 401 || response.status === 403
        ? "La API denego el acceso. Revisa la sesion y los permisos del usuario."
        : `No se pudo completar la operacion (HTTP ${response.status}).`),
      response.status,
    );
  }
  if (body === null) {
    throw new InventoryApiError("La API no devolvio JSON valido. Revisa la URL y el proxy de inventario.", response.status);
  }
  return body as ResponseBody;
}

export const inventoryApi = {
  products: (token?: string | null) => request<InventoryProduct[]>("/products", {}, token),
  product: (id: number, token?: string | null) => request<InventoryProduct>(`/products/${id}`, {}, token),
  orders: (token?: string | null) => request<InventoryOrder[]>("/orders", {}, token),
  inbound: (payload: InboundPayload, token?: string | null) =>
    request<OrderResponse & InboundPayload>("/deliveries", { method: "POST", body: JSON.stringify(payload) }, token),
  outbound: (payload: OutboundPayload, token?: string | null) =>
    request<OrderResponse & OutboundPayload>("/consumptions", { method: "POST", body: JSON.stringify(payload) }, token),
};