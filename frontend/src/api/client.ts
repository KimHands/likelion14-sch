const BASE_URL = ""; // Vite proxy 기준

function getCookie(name: string) {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

let csrfEnsured = false;

async function ensureCsrfCookie(): Promise<void> {
  if (csrfEnsured || getCookie("csrftoken")) {
    csrfEnsured = true;
    return;
  }
  await fetch(`${BASE_URL}/api/auth/csrf`, { credentials: "include" });
  csrfEnsured = true;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method || "GET").toUpperCase();

  // POST/PUT/DELETE 시 CSRF 쿠키가 없으면 먼저 확보
  if (method !== "GET" && method !== "HEAD") {
    await ensureCsrfCookie();
  }

  const csrf = getCookie("csrftoken");

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...(method !== "GET" && method !== "HEAD" && csrf ? { "X-CSRFToken": csrf } : {}),
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}
