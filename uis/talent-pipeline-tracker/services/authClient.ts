const TOKEN_STORAGE_KEY = "healthcore_auth_token";
const LOGIN_PATH = "/login";

export function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearToken(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

export function logout(): void {
  clearToken();
  if (typeof window !== "undefined") {
    window.location.assign(LOGIN_PATH);
  }
}

/** Fetch centralizado: añade el Bearer token y fuerza logout ante un 401. */
export async function authorizedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(input, { ...init, headers });

  if (response.status === 401) {
    clearToken();
    if (typeof window !== "undefined" && window.location.pathname !== LOGIN_PATH) {
      window.location.assign(LOGIN_PATH);
    }
  }

  return response;
}
