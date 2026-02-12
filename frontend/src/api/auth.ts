import { apiFetch } from "./client";
import type { MeResponse } from "../auth/types";

export function apiGetMe() {
  return apiFetch<MeResponse>("/api/auth/me");
}

export function apiLogin(email: string, password: string) {
  return apiFetch<{ ok: boolean }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function apiLogout() {
  return apiFetch<{ ok: boolean }>("/api/auth/logout", {
    method: "POST",
  });
}

export function apiSendEmailCode(email: string) {
  return apiFetch<{ ok: boolean; expires_in: number }>("/api/auth/email/send-code", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function apiVerifyEmailCode(email: string, code: string) {
  return apiFetch<{ ok: boolean; verified: boolean; user_exists: boolean }>("/api/auth/email/verify", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}