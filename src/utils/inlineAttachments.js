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
  const mime = resolveMimeType(file);
  if (!mime || !ALLOWED_MIME.has(mime)) {
    return `"${file.name}" is not a supported type. Use JPG, PNG, WebP, GIF, or PDF.`;
  }
  return null;
}

/**
 * @param {File} file
 * @returns {Promise<InlineAttachment>}
 */
export function fileToInlineAttachment(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Could not read file."));
        return;
      }
      const m = /^data:([^;]+);base64,(.+)$/.exec(result);
      if (!m) {
        reject(new Error("Could not read file."));
        return;
      }
      const mimeType = resolveMimeType(file) || m[1];
      resolve({ mimeType, data: m[2] });
    };
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}
