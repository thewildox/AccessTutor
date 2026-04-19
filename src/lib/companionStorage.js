const COMPANION_KEY = "focusly_companion_v1";

/** @returns {boolean} */
export function loadCompanionEnabled() {
  try {
    const raw = localStorage.getItem(COMPANION_KEY);
    if (raw == null) return true;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.enabled === "boolean") return parsed.enabled;
  } catch {
    /* ignore */
  }
  return true;
}

/** @param {boolean} enabled */
export function saveCompanionEnabled(enabled) {
  try {
    localStorage.setItem(COMPANION_KEY, JSON.stringify({ enabled }));
  } catch {
    /* quota / private mode */
  }
}
