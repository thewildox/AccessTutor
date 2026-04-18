import { useState, useEffect, useId } from "react";
import {
  MAX_ATTACHMENT_COUNT,
  MAX_ATTACHMENT_BYTES,
  resolveMimeType,
} from "../utils/inlineAttachments";

const SAMPLE_TEXT = `Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to produce oxygen and energy in the form of sugar. This process takes place mainly in the leaves of plants, in cells containing chlorophyll. Chlorophyll is the pigment that makes plants green, and it absorbs light energy from the sun. The plant takes in carbon dioxide through tiny pores called stomata, and water through its roots. Using the energy from light, the plant converts these into glucose and releases oxygen as a byproduct. This glucose is used by the plant for growth, repair, and reproduction.`;

export default function HomeScreen({
  inputText, setInputText,
  attachedFiles = [],
  setAttachedFiles,
  onStart, error,
  geminiKey, setGeminiKey,
  elevenKey, setElevenKey,
  voiceId, setVoiceId,
  rememberKeys = false,
  setRememberKeys,
  longInputWarning = false,
}) {
  const [showKeys, setShowKeys] = useState(false);
  const [filesHint, setFilesHint] = useState(null);
  const fileInputId = useId();

  const canStart = Boolean(inputText.trim()) || attachedFiles.length > 0;

  const onPickFiles = (e) => {
    const list = e.target.files;
    e.target.value = "";
    if (!list?.length || !setAttachedFiles) return;
    const incoming = Array.from(list);
    const merged = [...attachedFiles, ...incoming];
    const next = merged.slice(0, MAX_ATTACHMENT_COUNT);
    setAttachedFiles(next);
    setFilesHint(
      merged.length > MAX_ATTACHMENT_COUNT
        ? `Using the first ${MAX_ATTACHMENT_COUNT} files. Remove files to add different ones.`
        : null,
    );
  };

  const removeFile = (index) => {
    if (!setAttachedFiles) return;
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilesHint(null);
  };

  return (
    <div className="fade-up home-stack">
      <header className="hero">
        <h1 className="hero__logo">AccessTutor</h1>
        <p className="hero__tagline">Learning, redesigned for focus.</p>
        <p className="hero__subline">For students who learn differently.</p>
      </header>

      <div className="home-settings-row">
        <button
          type="button"
          className="home-settings-trigger"
          onClick={() => setShowKeys((v) => !v)}
          aria-expanded={showKeys}
          aria-controls="api-keys-panel"
        >
          <span aria-hidden="true">⚙️</span> Settings
        </button>
      </div>

      {showKeys && (
        <div id="api-keys-panel" className="card card--keys card--settings">
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
            Keys are only sent to Google Gemini and ElevenLabs when you use the app. Lesson text and
            attachments go to Gemini when you start a lesson.
          </p>
        </div>
      )}

      <div className="home-main-block">
        <label className="visually-hidden" htmlFor="lesson-input">
          Homework or school text
        </label>
        <textarea
          id="lesson-input"
          className="input-textarea"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste something confusing… we'll break it down together."
          rows={7}
        />
        <p className="input-helper">
          Paste text, or add photos / a PDF of a worksheet — or both.
        </p>

        <div className="attach-row">
          <input
            id={fileInputId}
            type="file"
            className="attach-input"
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,.pdf"
            multiple
            onChange={onPickFiles}
          />
          <label htmlFor={fileInputId} className="btn btn-ghost btn-full attach-label">
            Add images or PDF
          </label>
        </div>
        <p className="hint-text">
          Up to {MAX_ATTACHMENT_COUNT} files, {Math.round(MAX_ATTACHMENT_BYTES / (1024 * 1024))} MB each.
          PDFs and images are read by Gemini (large PDFs may be slow).
        </p>

        {attachedFiles.length > 0 && (
          <ul className="attach-list" aria-label="Attached files">
            {attachedFiles.map((file, i) => (
              <li key={`${file.name}-${i}-${file.size}`} className="attach-chip">
                <AttachmentThumb file={file} />
                <span className="attach-chip__name" title={file.name}>
                  {file.name}
                </span>
                <button
                  type="button"
                  className="attach-chip__remove"
                  onClick={() => removeFile(i)}
                  aria-label={`Remove ${file.name}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        {filesHint && <p className="hint-text hint-text--warn">{filesHint}</p>}

        {longInputWarning && (
          <p className="hint-text hint-text--warn">
            Very long text will be trimmed to 32,000 characters for a reliable demo.
          </p>
        )}

        <button
          type="button"
          className="btn btn-cta btn-full"
          onClick={onStart}
          disabled={!canStart}
        >
          Start Learning →
        </button>
        <p className="cta-microcopy">Takes ~5 seconds</p>

        <button
          type="button"
          className="btn btn-ghost btn-full mt-sm"
          onClick={() => setInputText(SAMPLE_TEXT)}
        >
          Try a sample paragraph
        </button>
      </div>

      {error && <div className="error-box">{error}</div>}
    </div>
  );
}

function AttachmentThumb({ file }) {
  const mime = resolveMimeType(file);
  const isImage = mime.startsWith("image/");
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!isImage) return;
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file, isImage]);

  if (!isImage) {
    return <span className="attach-chip__badge" aria-hidden="true">PDF</span>;
  }
  if (!url) return <span className="attach-chip__badge" aria-hidden="true">…</span>;
  return <img src={url} alt="" className="attach-chip__thumb" />;
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
