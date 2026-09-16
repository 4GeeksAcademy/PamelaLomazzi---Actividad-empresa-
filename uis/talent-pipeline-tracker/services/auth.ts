import { getApiUrl, parseResponse } from "@/services/api";
import { authorizedFetch, setToken } from "@/services/authClient";
import type {
  AuthTokenResponse,
  AuthenticatedUser,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  LoginPayload,
  MessageResponse,
  Profile,
  ProfileUpdatePayload,
  RegisterPayload,
  ResetPasswordPayload,
} from "@/types/auth";

// Los routers de auth/usuarios/perfiles del backend FastAPI se montan bajo /api.
function getAuthApiBase(): string {
  const baseUrl = getApiUrl();
  return baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
}

export async function login(payload: LoginPayload): Promise<AuthTokenResponse> {
  try {
    const response = await fetch(`${getAuthApiBase()}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await parseResponse<AuthTokenResponse>(response);
    setToken(data.access_token);
    return data;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    throw new Error(`No se pudo iniciar sesión: ${message}`);
  }
}

export async function register(payload: RegisterPayload): Promise<AuthTokenResponse> {
  const response = await fetch(`${getAuthApiBase()}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  await parseResponse(response);

  // Auto-login tras el registro exitoso.
  return login({ email: payload.email, password: payload.password });
}

export async function getMe(): Promise<AuthenticatedUser> {
  try {
    const response = await authorizedFetch(`${getAuthApiBase()}/auth/me`, {
      method: "GET",
      cache: "no-store",
    });

    return await parseResponse<AuthenticatedUser>(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    throw new Error(`No se pudo obtener el perfil: ${message}`);
  }
}

export async function updateMyProfile(payload: ProfileUpdatePayload): Promise<Profile> {
  try {
    const response = await authorizedFetch(`${getAuthApiBase()}/profiles/me`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return await parseResponse<Profile>(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    throw new Error(`No se pudo actualizar el perfil: ${message}`);
  }
}

export async function forgotPassword(payload: ForgotPasswordPayload): Promise<MessageResponse> {
  const response = await fetch(`${getAuthApiBase()}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResponse<MessageResponse>(response);
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<MessageResponse> {
  const response = await fetch(`${getAuthApiBase()}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResponse<MessageResponse>(response);
}

export async function changePassword(payload: ChangePasswordPayload): Promise<MessageResponse> {
  const response = await authorizedFetch(`${getAuthApiBase()}/auth/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResponse<MessageResponse>(response);
}
