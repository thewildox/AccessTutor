import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const MAX_PAGES = 40;

/**
 * Pull plain text from a text-based PDF (not scanned images).
 * @param {ArrayBuffer} arrayBuffer
 * @returns {Promise<string>}
 */
export async function extractTextFromPdf(arrayBuffer) {
  const data = new Uint8Array(arrayBuffer);
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pageCount = Math.min(pdf.numPages, MAX_PAGES);
  const parts = [];

  for (let p = 1; p <= pageCount; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .filter(Boolean)
      .join(" ");
    parts.push(pageText);
  }

  let text = parts.join("\n\n").replace(/\s+\n/g, "\n").trim();

  if (!text) {
    throw new Error(
      "No text found in this PDF. It may be scanned (image only). Try a digital PDF or paste the text instead."
    );
  }

  if (pdf.numPages > MAX_PAGES) {
    text += `\n\n[Only the first ${MAX_PAGES} pages were imported.]`;
  }

  return text;
}
