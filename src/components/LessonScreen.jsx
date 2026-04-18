import { useState } from "react";
import { speakText } from "../services/elevenLabsService";

export default function LessonScreen({
  lessonData, currentChunkIndex, setCurrentChunkIndex,
  onQuiz, onBack, a11y, elevenKey, voiceId,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const chunks = lessonData?.chunks || [];
  const total = chunks.length;
  const idx = currentChunkIndex;
  const pct = ((idx + 1) / total) * 100;

  const handleListen = async () => {
    if (isPlaying) return;
    const text = a11y.focusMode ? chunks[idx] : chunks.join(" ");
    setIsPlaying(true);
    const audio = await speakText(text, elevenKey, voiceId, a11y.slowAudio);
    if (audio) {
      audio.onended = () => setIsPlaying(false);
    } else {
      setIsPlaying(false);
    }
  };

  return (
    <div className="fade-up">
      {/* Back */}
      <button className="btn btn-ghost" style={{ padding: "8px 14px", fontSize: "0.85rem", marginBottom: "1rem" }} onClick={onBack}>
        ← Back
      </button>

      {/* Title + Progress */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", color: "var(--text)", marginBottom: "6px" }}>
          {lessonData.title || "Your Lesson"}
        </h1>
        <div className="progress-wrap">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="progress-label">{idx + 1} / {total}</span>
        </div>
      </div>

      {/* Chunks */}
      {a11y.focusMode ? (
        <FocusChunk chunk={chunks[idx]} index={idx} />
      ) : (
        chunks.map((chunk, i) => (
          <AllChunk key={i} chunk={chunk} index={i} />
        ))
      )}

      {/* Listen Button */}
      <div className="btn-row">
        <button
          className={`btn btn-listen ${isPlaying ? "playing" : ""}`}
          onClick={handleListen}
          disabled={isPlaying || !elevenKey}
          title={!elevenKey ? "Add your ElevenLabs key to enable voice" : ""}
        >
          {isPlaying ? "⏸ Playing..." : "🔊 Listen"}
        </button>
        {!elevenKey && (
          <span style={{ fontSize: "0.8rem", color: "var(--muted)", alignSelf: "center" }}>
            Add ElevenLabs key for voice
          </span>
        )}
      </div>

      {/* Focus Mode Navigation */}
      {a11y.focusMode && (
        <div className="btn-row" style={{ marginTop: "8px" }}>
          <button className="btn btn-ghost" onClick={() => setCurrentChunkIndex(idx - 1)} disabled={idx === 0}>
            ← Back
          </button>
          <button className="btn btn-secondary" onClick={() => setCurrentChunkIndex(idx + 1)} disabled={idx === total - 1}>
            Next →
          </button>
        </div>
      )}

      {/* Quiz CTA */}
      <button
        className="btn btn-success btn-full"
        style={{ marginTop: "1.25rem" }}
        onClick={onQuiz}
      >
        Quiz Me →
      </button>
    </div>
  );
}

function FocusChunk({ chunk, index }) {
  return (
    <div className="card-purple fade-up" style={{ marginBottom: "1rem" }}>
      <div style={{
        fontSize: "11px", fontWeight: 700, color: "var(--primary)",
        textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px",
      }}>
        Step {index + 1}
      </div>
      <p className="chunk-text" style={{ fontSize: "1.1rem", lineHeight: 1.9, color: "var(--text)" }}>
        {chunk}
      </p>
    </div>
  );
}

function AllChunk({ chunk, index }) {
  return (
    <div className="card-purple" style={{ marginBottom: "10px" }}>
      <div style={{
        fontSize: "11px", fontWeight: 700, color: "var(--primary)",
        textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px",
      }}>
        Step {index + 1}
      </div>
      <p className="chunk-text" style={{ fontSize: "1rem", lineHeight: 1.8, color: "var(--text)" }}>
        {chunk}
      </p>
    </div>
  );
}
