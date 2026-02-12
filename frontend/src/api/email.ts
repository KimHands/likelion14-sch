import { apiFetch } from "./client";

export function apiSendEmailCode(email: string) {
  return apiFetch<{ ok: boolean; expires_in: number }>("/api/auth/email/send-code", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function apiVerifyEmailCode(email: string, code: string) {
  return apiFetch<{ ok: boolean }>("/api/auth/email/verify", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}