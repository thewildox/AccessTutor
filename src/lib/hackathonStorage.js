const SESSION_KEY = "accesstutor_session_v1";
export const REMEMBER_KEYS_FLAG = "accesstutor_remember_keys";
const KEYS_KEY = "accesstutor_keys_v1";
const SESSION_MAX_AGE_MS = 48 * 60 * 60 * 1000;

export function readSavedSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.lessonData?.chunks?.length) return null;
    if (typeof data.savedAt !== "number" || Date.now() - data.savedAt > SESSION_MAX_AGE_MS) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function writeSavedSession(payload) {
  try {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ ...payload, savedAt: Date.now(), version: 1 })
    );
  } catch {
    /* quota or private mode */
  }
}

export function clearSavedSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function loadRememberedKeys() {
  if (localStorage.getItem(REMEMBER_KEYS_FLAG) !== "1") return null;
  try {
    return JSON.parse(localStorage.getItem(KEYS_KEY) || "{}");
  } catch {
    return null;
  }
}

export function saveRememberedKeys(keys) {
  localStorage.setItem(REMEMBER_KEYS_FLAG, "1");
  localStorage.setItem(KEYS_KEY, JSON.stringify(keys));
}

export function clearRememberedKeys() {
  localStorage.removeItem(REMEMBER_KEYS_FLAG);
  localStorage.removeItem(KEYS_KEY);
}
