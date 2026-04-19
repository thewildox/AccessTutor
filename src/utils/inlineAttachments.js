import { debugIngest } from "../debugIngest.js";

/** @typedef {{ mimeType: string, data: string }} InlineAttachment */

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

export const MAX_ATTACHMENT_BYTES = 7 * 1024 * 1024;
export const MAX_ATTACHMENT_COUNT = 6;

function mimeFromName(name) {
  const n = name.toLowerCase();
  if (n.endsWith(".pdf")) return "application/pdf";
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".webp")) return "image/webp";
  if (n.endsWith(".gif")) return "image/gif";
  return "";
}

/**
 * @param {File} file
 * @returns {string}
 */
export function resolveMimeType(file) {
  if (file.type && ALLOWED_MIME.has(file.type)) return file.type;
  const guessed = mimeFromName(file.name);
  return guessed;
}

/**
 * @param {File} file
 * @returns {string | null}
 */
export function validateAttachmentFile(file) {
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return `"${file.name}" is too large (max ${Math.round(MAX_ATTACHMENT_BYTES / (1024 * 1024))} MB per file).`;
  }
  const n = file.name.toLowerCase();
  const t = (file.type || "").toLowerCase();
  if (
    t === "image/heic" ||
    t === "image/heif" ||
    n.endsWith(".heic") ||
    n.endsWith(".heif")
  ) {
    return `"${file.name}" is HEIC/HEIF (iPhone’s default). Gemini needs JPG or PNG here — export a JPEG from Photos, or set Settings → Camera → Formats → Most Compatible for new photos.`;
  }
  const mime = resolveMimeType(file);
  if (!mime || !ALLOWED_MIME.has(mime)) {
    return `"${file.name}" is not a supported type. Use JPG, PNG, WebP, GIF, or PDF.`;
  }
  return null;
}

/**
 * readAsDataURL() may include parameters before ";base64," (e.g. charset), which breaks a strict
 * ^data:([^;]+);base64,(.+)$ regex. Find the base64 payload by marker instead.
 * @param {string} result
 * @returns {{ mimeFromUrl: string, data: string } | null}
 */
function parseDataUrlBase64(result) {
  if (typeof result !== "string" || !result.startsWith("data:")) return null;
  const lower = result.toLowerCase();
  const marker = ";base64,";
  const idx = lower.indexOf(marker);
  if (idx === -1) return null;
  const meta = result.slice("data:".length, idx);
  const mimeFromUrl = meta.split(";")[0].trim();
  const data = result.slice(idx + marker.length);
  if (!data) return null;
  return { mimeFromUrl, data };
}

/**
 * @param {File} file
 * @returns {Promise<InlineAttachment>}
 */
export function fileToInlineAttachment(file) {
  return new Promise((resolve, reject) => {
    // #region agent log
    const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
    debugIngest({
      runId: "post-fix",
      hypothesisId: "H2",
      location: "inlineAttachments.js:fileToInlineAttachment:entry",
      message: "read attachment",
      data: {
        ext,
        size: file.size,
        browserType: file.type || "",
        resolvedMime: resolveMimeType(file),
      },
      timestamp: Date.now(),
    });
    // #endregion
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        // #region agent log
        debugIngest({
          runId: "post-fix",
          hypothesisId: "H1",
          location: "inlineAttachments.js:reader.onload",
          message: "result not string",
          data: { resultType: typeof result },
          timestamp: Date.now(),
        });
        // #endregion
        reject(new Error("Could not read file."));
        return;
      }
      const parsed = parseDataUrlBase64(result);
      const strictLegacy = /^data:([^;]+);base64,(.+)$/.exec(result);
      // #region agent log
      debugIngest({
        runId: "post-fix",
        hypothesisId: "H1",
        location: "inlineAttachments.js:reader.onload:dataUrl",
        message: "data url parse",
        data: {
          markerParsed: Boolean(parsed),
          strictRegexMatched: Boolean(strictLegacy),
          legacyWouldFail: Boolean(parsed && !strictLegacy),
          mimeFromUrl: parsed ? parsed.mimeFromUrl : null,
          head: result.slice(0, 80),
          base64Len: parsed ? parsed.data.length : 0,
        },
        timestamp: Date.now(),
      });
      // #endregion
      if (!parsed) {
        reject(new Error("Could not read file."));
        return;
      }
      const mimeType = resolveMimeType(file) || parsed.mimeFromUrl;
      const data = String(parsed.data).replace(/\s+/g, "");
      resolve({ mimeType, data });
    };
    reader.onerror = () => {
      // #region agent log
      debugIngest({
        runId: "post-fix",
        hypothesisId: "H1",
        location: "inlineAttachments.js:reader.onerror",
        message: "filereader error",
        data: {},
        timestamp: Date.now(),
      });
      // #endregion
      reject(new Error("Could not read file."));
    };
    reader.readAsDataURL(file);
  });
}
