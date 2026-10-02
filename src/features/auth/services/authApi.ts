import axios from "axios";
import { AUTH_API_BASE_URL, TENANT_ID } from "../../../config/apiConfig";

export interface LoginRequest {
  email: string;
  password: string;
  mfaCode?: number;
  recoveryCode?: string;
}

export interface LoginResponse {
  accessToken: string | null;
  mfaRequired: boolean;
  email: string | null;
}

export const authApi = axios.create({
  baseURL: AUTH_API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "X-Tenant-Id": TENANT_ID,
  },
});

export async function login(request: LoginRequest): Promise<LoginResponse> {
  const response = await authApi.post<LoginResponse>("/auth/login", request);
  return response.data;
}

export async function refreshSession(): Promise<LoginResponse> {
  const response = await authApi.post<LoginResponse>("/auth/refresh");
  return response.data;
}

export async function logoutSession(): Promise<void> {
  await authApi.post("/auth/logout");
}

export function bearerHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "X-Tenant-Id": TENANT_ID,
  };
}

