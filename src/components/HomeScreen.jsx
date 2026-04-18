import { useState, useRef } from "react";
import { extractTextFromPdf } from "../utils/extractPdfText";

const SAMPLE_TEXT = `Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to produce oxygen and energy in the form of sugar. This process takes place mainly in the leaves of plants, in cells containing chlorophyll. Chlorophyll is the pigment that makes plants green, and it absorbs light energy from the sun. The plant takes in carbon dioxide through tiny pores called stomata, and water through its roots. Using the energy from light, the plant converts these into glucose and releases oxygen as a byproduct. This glucose is used by the plant for growth, repair, and reproduction.`;

export default function HomeScreen({
  inputText, setInputText,
  onStart, error,
  geminiKey, setGeminiKey,
  elevenKey, setElevenKey,
  voiceId, setVoiceId,
  rememberKeys = false,
  setRememberKeys,
  longInputWarning = false,
}) {
  const [showKeys, setShowKeys] = useState(!geminiKey);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const pdfInputRef = useRef(null);

  const handlePdfPick = () => {
    setUploadError(null);
    pdfInputRef.current?.click();
  };

  const handlePdfChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("Please choose a PDF file.");
      return;
    }
    setUploadError(null);
    setPdfLoading(true);
    try {
      const buf = await file.arrayBuffer();
      const text = await extractTextFromPdf(buf);
      setInputText(text);
    } catch (err) {
      setUploadError(err.message || "Could not read that PDF.");
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="fade-up">
      <header className="hero">
        <h1 className="hero__logo">AccessTutor</h1>
        <p className="hero__tagline">Learning, redesigned for focus.</p>
      </header>

      <div className="card card--keys">
        <button
          type="button"
          className="collapsible-toggle"
          onClick={() => setShowKeys(!showKeys)}
          aria-expanded={showKeys}
        >
          <span>API Keys</span>
          <span className="collapsible-toggle__hint" aria-hidden="true">{showKeys ? "Hide" : "Show"}</span>
        </button>

        {showKeys && (
          <div className="collapsible-body">
            <KeyField
              label="Gemini Key (required)"
              value={geminiKey}
              onChange={setGeminiKey}
              placeholder="AIza..."
            />
            <KeyField
              label="ElevenLabs Key (for voice)"
              value={elevenKey}
              onChange={setElevenKey}
              placeholder="sk_..."
            />
            <KeyField
              label="Voice ID"
              value={voiceId}
              onChange={setVoiceId}
              placeholder="21m00Tcm4TlvDq8ikWAM"
              type="text"
            />
            <label className="remember-keys">
              <input
                type="checkbox"
                checked={rememberKeys}
                onChange={(e) => setRememberKeys(e.target.checked)}
              />
              <span>Remember keys on this device (demo only — do not use on shared computers)</span>
            </label>
            <p className="hint-text" style={{ marginTop: "0.35rem" }}>
              Keys never leave your network except to Google Gemini and ElevenLabs when you run the app.
            </p>
          </div>
        )}
      </div>

      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="visually-hidden"
        aria-label="Upload a PDF file"
        onChange={handlePdfChange}
      />

      <label className="visually-hidden" htmlFor="lesson-input">
        Homework or school text
      </label>
      <textarea
        id="lesson-input"
        className="input-textarea"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Paste homework, a worksheet, or any school text here..."
        rows={6}
      />

      <button
        type="button"
        className="btn btn-secondary btn-full mt-md"
        onClick={handlePdfPick}
        disabled={pdfLoading}
      >
        {pdfLoading ? "Reading PDF…" : "Upload PDF"}
      </button>
      <p className="hint-text">
        Works with text-based PDFs. Scanned worksheets (photos) need text pasted manually.
      </p>

      {longInputWarning && (
        <p className="hint-text" style={{ color: "var(--wrong)", fontWeight: 600 }}>
          Very long text will be trimmed to 32,000 characters for a reliable demo.
        </p>
      )}

      <button
        type="button"
        className="btn btn-primary btn-full mt-lg"
        style={{ fontSize: "1.05rem" }}
        onClick={onStart}
        disabled={!inputText.trim()}
      >
        Start Learning →
      </button>

      <button
        type="button"
        className="btn btn-ghost btn-full mt-sm"
        onClick={() => setInputText(SAMPLE_TEXT)}
      >
        Try a sample paragraph
      </button>

      {uploadError && <div className="error-box">{uploadError}</div>}
      {error && <div className="error-box">{error}</div>}
    </div>
  );
}

function KeyField({ label, value, onChange, placeholder, type = "password" }) {
  const id = `key-${label.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()}`;
  return (
    <div className="field-group">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="field-input"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />
    </div>
  );
}
