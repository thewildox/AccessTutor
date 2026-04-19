export const A11Y_STORAGE_KEY = "accesstutor_a11y_v1";

export const DEFAULT_A11Y = {
  largeText: false,
  focusMode: true,
  slowAudio: false,
  highContrast: false,
  dyslexicFont: false,
  calmMode: false,
};

/**
 * @returns {Partial<typeof DEFAULT_A11Y> | null}
 */
export function loadA11yPrefs() {
  try {
    const raw = localStorage.getItem(A11Y_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

/** @param {typeof DEFAULT_A11Y} a11y */
export function saveA11yPrefs(a11y) {
  try {
    localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(a11y));
  } catch {
    /* quota or private mode */
  }
}

/** @param {Partial<typeof DEFAULT_A11Y> | null} stored */
export function mergeA11yPrefs(stored) {
  return { ...DEFAULT_A11Y, ...(stored || {}) };
}
