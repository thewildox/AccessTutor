import { useState, useRef } from "react";
import { extractTextFromPdf } from "../utils/extractPdfText";

const SAMPLE_TEXT = `Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to produce oxygen and energy in the form of sugar. This process takes place mainly in the leaves of plants, in cells containing chlorophyll. Chlorophyll is the pigment that makes plants green, and it absorbs light energy from the sun. The plant takes in carbon dioxide through tiny pores called stomata, and water through its roots. Using the energy from light, the plant converts these into glucose and releases oxygen as a byproduct. This glucose is used by the plant for growth, repair, and reproduction.`;

export default function HomeScreen({
  inputText, setInputText,
  onStart, error,
  geminiKey, setGeminiKey,
  elevenKey, setElevenKey,
  voiceId, setVoiceId,
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
      {/* Hero */}
      <div style={{ textAlign: "center", padding: "2rem 0 1.75rem" }}>
        <div style={{
          fontFamily: "var(--font-display)",
          fontSize: "2.4rem",
          fontWeight: 800,
          color: "var(--primary)",
          letterSpacing: "-0.5px",
          lineHeight: 1.1,
        }}>
          AccessTutor
        </div>
        <p style={{ color: "var(--muted)", marginTop: "8px", fontSize: "1rem" }}>
          Learning, redesigned for focus.
        </p>
      </div>

      {/* API Keys Panel */}
      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <button
          onClick={() => setShowKeys(!showKeys)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            width: "100%", padding: 0,
            fontFamily: "var(--font-display)", fontWeight: 700,
            fontSize: "0.85rem", color: "var(--muted)", letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          <span>API Keys</span>
          <span>{showKeys ? "▲ Hide" : "▼ Show"}</span>
        </button>

        {showKeys && (
          <div style={{ marginTop: "1rem" }}>
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
            <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: "8px", lineHeight: 1.5 }}>
              Keys stay in your browser only. Never stored or shared.
            </p>
          </div>
        )}
      </div>

      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf,.pdf"
        style={{ display: "none" }}
        onChange={handlePdfChange}
      />

      {/* Text Input */}
      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Paste homework, a worksheet, or any school text here..."
        rows={6}
        style={{
          width: "100%",
          border: "2px dashed var(--border)",
          borderRadius: "var(--radius)",
          padding: "1rem 1.25rem",
          fontSize: "1rem",
          fontFamily: "var(--font-main)",
          color: "var(--text)",
          background: "var(--surface)",
          resize: "vertical",
          outline: "none",
          lineHeight: 1.7,
          transition: "border-color 0.2s",
        }}
        onFocus={(e) => (e.target.style.borderColor = "var(--primary)", e.target.style.borderStyle = "solid")}
        onBlur={(e) => (e.target.style.borderColor = "var(--border)", e.target.style.borderStyle = "dashed")}
      />

      <button
        type="button"
        className="btn btn-secondary btn-full"
        style={{ marginTop: "10px" }}
        onClick={handlePdfPick}
        disabled={pdfLoading}
      >
        {pdfLoading ? "Reading PDF…" : "📄 Upload PDF"}
      </button>
      <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: "6px", lineHeight: 1.45 }}>
        Works with text-based PDFs. Scanned worksheets (photos) need text pasted manually.
      </p>

      {/* Buttons */}
      <button
        className="btn btn-primary btn-full"
        style={{ marginTop: "0.75rem", fontSize: "1.05rem" }}
        onClick={onStart}
        disabled={!inputText.trim()}
      >
        Start Learning →
      </button>

      <button
        className="btn btn-ghost btn-full"
        style={{ marginTop: "8px" }}
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
  return (
    <div style={{ marginBottom: "10px" }}>
      <label style={{
        display: "block", fontSize: "0.8rem",
        color: "var(--muted)", marginBottom: "4px", fontWeight: 600,
      }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "9px 12px",
          border: "1.5px solid var(--border)",
          borderRadius: "var(--radius-xs)",
          fontSize: "0.9rem", fontFamily: "var(--font-main)",
          background: "var(--bg)", color: "var(--text)",
          outline: "none",
        }}
      />
    </div>
  );
}
