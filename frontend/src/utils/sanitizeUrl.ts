/**
 * URL 프로토콜 검증: http: / https: 만 허용.
 * javascript:, data: 등 XSS 벡터 차단.
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return trimmed;
    }
    return "";
  } catch {
    // 상대경로(/media/...)는 허용
    if (trimmed.startsWith("/")) return trimmed;
    return "";
  }
}
