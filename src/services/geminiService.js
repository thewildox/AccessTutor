import { debugIngest } from "../debugIngest.js";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

/**
 * @param {{
 *   studyPeer?: boolean;
 *   specialInterest?: string;
 *   engagementHint?: string;
 * }} [persona]
 */
function buildPrompt(inputText, hasAttachments, persona = {}) {
  const { studyPeer, specialInterest, engagementHint } = persona;
  const peerBlock = studyPeer
    ? `Role: You are a study peer sitting beside the learner — not a teacher. Use "we" and "us" ("we can read this part together"). Keep a calm, focused model of attention. Avoid lecturing or testing tone.\n\n`
    : "";
  const interestBlock =
    specialInterest && String(specialInterest).trim()
      ? `Use the learner’s special interest only as friendly analogies or metaphors to clarify ideas (do not replace the school content): "${String(specialInterest).trim().slice(0, 180)}".\n\n`
      : "";
  const engagementBlock =
    engagementHint && String(engagementHint).trim()
      ? `Session note (from local focus hints, not video): ${String(engagementHint).trim().slice(0, 320)}\n\n`
      : "";

  const sourceNote = hasAttachments
    ? `The learner may have pasted text below and/or attached file(s) (photos of homework, screenshots, or a PDF). Read every attachment carefully (all readable pages of a PDF). Combine what you see in the file(s) with any pasted text. If pasted text is empty, use only the attachment(s).`
    : "";
  const attachmentOnly =
    hasAttachments && typeof inputText === "string" && inputText.trim() === "";
  const attachmentOnlyNote = attachmentOnly
    ? `If the "school text" section below is empty, that is intentional: your ONLY source is the file(s) in this message. The lesson title, every chunk, and every quiz question must be grounded in what you read in those attachments — not generic study advice.`
    : "";

  return `${peerBlock}${interestBlock}${engagementBlock}You are a learning assistant for a neurodivergent child aged 8-14 with ADHD or dyslexia.
${sourceNote ? `${sourceNote}\n\n` : ""}${attachmentOnlyNote ? `${attachmentOnlyNote}\n\n` : ""}
Rewrite the following school text using:
- Very short sentences (max 10-12 words each)
- One idea per sentence
- No jargon or complex vocabulary
- Calm, encouraging, friendly tone
- Break into 3-6 small digestible steps

Return ONLY valid JSON with no markdown backticks or extra text, exactly this shape:
{
  "title": "short friendly title for this lesson",
  "chunks": [
    "first step or idea written simply",
    "second step or idea written simply",
    "third step or idea written simply"
  ],
  "questions": [
    {
      "question": "simple question about the content?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": "Option A",
      "hint": "one kind encouraging sentence pointing back to the content"
    },
    {
      "question": "another simple question?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": "Option B",
      "hint": "one kind encouraging sentence"
    },
    {
      "question": "a third simple question?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": "Option C",
      "hint": "one kind encouraging sentence"
    }
  ]
}

IMPORTANT: correct must exactly match one of the options strings.

School text to rewrite:
${inputText}`;
}

/**
 * @param {string} inputText
 * @param {string} apiKey
 * @param {{ mimeType: string, data: string }[]} [attachments]
 * @param {{ studyPeer?: boolean; specialInterest?: string; engagementHint?: string }} [persona]
 */
export async function simplifyText(inputText, apiKey, attachments = [], persona = {}) {
  const hasAttachments = attachments.length > 0;
  const textPart = { text: buildPrompt(inputText, hasAttachments, persona) };
  const inlineParts = attachments.map((a) => ({
    inlineData: {
      mimeType: a.mimeType,
      data: String(a.data || "").replace(/\s+/g, ""),
    },
  }));
  // Put bytes before the long instruction so vision/PDF binding stays tied to the media (Google’s own samples often order image → text).
  const parts = [...inlineParts, textPart];

  // #region agent log
  debugIngest({
    runId: "post-fix",
    hypothesisId: "H4",
    location: "geminiService.js:simplifyText:preFetch",
    message: "payload shape",
    data: {
      attachmentCount: attachments.length,
      mimes: attachments.map((a) => a.mimeType),
      dataLens: attachments.map((a) => (a.data ? a.data.length : 0)),
      partsCount: parts.length,
      textPartLen: inputText.length,
    },
    timestamp: Date.now(),
  });
  // #endregion

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
    }),
  });

  const data = await res.json();

  // #region agent log
  debugIngest({
    runId: "post-fix",
    hypothesisId: "H3",
    location: "geminiService.js:simplifyText:postFetch",
    message: "gemini response meta",
    data: {
      ok: res.ok,
      status: res.status,
      apiError: data.error?.message || null,
      candidateCount: data.candidates?.length ?? 0,
      blockReason: data.promptFeedback?.blockReason || null,
    },
    timestamp: Date.now(),
  });
  // #endregion

  if (!res.ok) {
    throw new Error(data.error?.message || "Gemini API error");
  }

  if (!data.candidates?.length) {
    const block = data.promptFeedback?.blockReason;
    throw new Error(
      block
        ? `Request was blocked (${block}). Try different or shorter text.`
        : "No response from the model. Try shorter text or run again."
    );
  }

  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const clean = raw.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(clean);
  } catch {
    throw new Error("Could not parse Gemini response. Try again.");
  }
}
