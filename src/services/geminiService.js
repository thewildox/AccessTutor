const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

function buildPrompt(inputText) {
  return `You are a learning assistant for a neurodivergent child aged 8-14 with ADHD or dyslexia.

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

export async function simplifyText(inputText, apiKey) {
  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(inputText) }] }],
    }),
  });

  const data = await res.json();

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
