/** Dev-only: same-origin path proxied by Vite to the Cursor debug ingest server (avoids browser CORS). */
const INGEST_PATH = "/ingest/69150063-f960-45f9-a5f4-c420d62fe543";

/**
 * @param {Record<string, unknown>} payload
 */
export function debugIngest(payload) {
  if (!import.meta.env.DEV) return;
  // Console mirror (use info — debug level is often hidden in DevTools “Default levels”).
  console.info("[FocuslyDebug]", payload.location ?? "", payload.message ?? "", payload.data ?? {});
  fetch(INGEST_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "8e9869" },
    body: JSON.stringify({ sessionId: "8e9869", ...payload, timestamp: payload.timestamp ?? Date.now() }),
  }).catch(() => {});
}
