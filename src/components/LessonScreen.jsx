import { useState } from "react";
import { speakText } from "../services/elevenLabsService";

export default function LessonScreen({
  lessonData, currentChunkIndex, setCurrentChunkIndex,
  onQuiz, onBack, a11y, elevenKey, voiceId,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [ttsError, setTtsError] = useState(null);
  const chunks = lessonData?.chunks || [];
  const total = chunks.length;
  const idx = currentChunkIndex;
  const pct = ((idx + 1) / total) * 100;

  const handleListen = async () => {
    if (isPlaying) return;
    const text = a11y.focusMode ? chunks[idx] : chunks.join(" ");
    setTtsError(null);
    setIsPlaying(true);
    const { audio, error } = await speakText(text, elevenKey, voiceId, a11y.slowAudio);
    if (error) setTtsError(error);
    if (audio) {
      audio.onended = () => setIsPlaying(false);
    } else {
      setIsPlaying(false);
    }
  };

  return (
    <div className="fade-up">
      <button type="button" className="btn btn-ghost btn--compact mb-nav" onClick={onBack}>
        ← Back
      </button>

      <div className="lesson-header">
        <h1 className="lesson-title">{lessonData.title || "Your Lesson"}</h1>
        <div className="progress-wrap">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="progress-label">{idx + 1} / {total}</span>
        </div>
      </div>

      {a11y.focusMode ? (
        <FocusChunk chunk={chunks[idx]} index={idx} />
      ) : (
        chunks.map((chunk, i) => (
          <AllChunk key={i} chunk={chunk} index={i} />
        ))
      )}

      <div className="btn-row">
        <button
          type="button"
          className={`btn btn-listen ${isPlaying ? "playing" : ""}`}
          onClick={handleListen}
          disabled={isPlaying || !elevenKey}
          title={!elevenKey ? "Add your ElevenLabs key to enable voice" : ""}
        >
          {isPlaying ? "Playing…" : "Listen"}
        </button>
        {!elevenKey && (
          <span className="inline-hint">Add ElevenLabs key for voice</span>
        )}
      </div>

      {ttsError && (
        <div className="error-box" role="alert">
          {ttsError}
        </div>
      )}

      {a11y.focusMode && (
        <div className="btn-row" style={{ marginTop: "8px" }}>
          <button type="button" className="btn btn-ghost" onClick={() => setCurrentChunkIndex(idx - 1)} disabled={idx === 0}>
            ← Back
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setCurrentChunkIndex(idx + 1)} disabled={idx === total - 1}>
            Next →
          </button>
        </div>
      )}

      <button type="button" className="btn btn-success btn-full mt-lg" onClick={onQuiz}>
        Quiz Me →
      </button>
    </div>
  );
}

function FocusChunk({ chunk, index }) {
  return (
    <article className="card-purple card-purple--focus fade-up">
      <div className="step-badge">Step {index + 1}</div>
      <p className="chunk-text">{chunk}</p>
    </article>
  );
}

function AllChunk({ chunk, index }) {
  return (
    <article className="card-purple">
      <div className="step-badge">Step {index + 1}</div>
      <p className="chunk-text chunk-text--all">{chunk}</p>
    </article>
  );
}
