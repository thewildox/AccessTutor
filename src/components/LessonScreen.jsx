import { useState, useRef, useEffect, useCallback } from "react";
import { speakText } from "../services/elevenLabsService";
import {
  splitIntoSentences,
  charWeights,
  buildCumulativeEnds,
  indexForTime,
} from "../utils/readAlongTiming";
import StudyCompanionPanel from "./StudyCompanionPanel";

export default function LessonScreen({
  lessonData, currentChunkIndex, setCurrentChunkIndex,
  onQuiz, onBack, a11y, elevenKey, voiceId,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [ttsError, setTtsError] = useState(null);
  const [readAlongSentences, setReadAlongSentences] = useState(null);
  const [activeSentenceIdx, setActiveSentenceIdx] = useState(null);
  const [activeChunkIdx, setActiveChunkIdx] = useState(null);
  const [mouthAmp, setMouthAmp] = useState(0);

  const audioRef = useRef(null);
  const endsRef = useRef(null);
  const modeRef = useRef(null);
  const detachListenersRef = useRef(null);
  const ampRafRef = useRef(0);
  const audioCtxRef = useRef(null);
  const chunks = lessonData?.chunks || [];
  const total = chunks.length;
  const idx = currentChunkIndex;
  const pct = ((idx + 1) / total) * 100;

  const clearReadAlong = useCallback(() => {
    endsRef.current = null;
    modeRef.current = null;
    setReadAlongSentences(null);
    setActiveSentenceIdx(null);
    setActiveChunkIdx(null);
  }, []);

  const stopPlayback = useCallback(() => {
    if (ampRafRef.current) {
      cancelAnimationFrame(ampRafRef.current);
      ampRafRef.current = 0;
    }
    try {
      audioCtxRef.current?.close?.();
    } catch {
      /* */
    }
    audioCtxRef.current = null;
    setMouthAmp(0);

    const detach = detachListenersRef.current;
    if (detach) detach();
    detachListenersRef.current = null;
    const a = audioRef.current;
    if (a) {
      try {
        a.pause();
      } catch {
        /* ignore */
      }
    }
    audioRef.current = null;
    clearReadAlong();
  }, [clearReadAlong]);

  useEffect(() => () => stopPlayback(), [stopPlayback]);

  useEffect(() => {
    if (audioRef.current) {
      stopPlayback();
      setIsPlaying(false);
    }
  }, [idx, a11y.focusMode, stopPlayback]);

  const handleListen = async () => {
    if (isPlaying) return;
    const text = a11y.focusMode ? chunks[idx] : chunks.join(" ");
    setTtsError(null);
    stopPlayback();
    setIsPlaying(true);

    const { audio, error } = await speakText(text, elevenKey, voiceId, a11y.slowAudio, {
      deferPlay: true,
    });
    if (error) {
      setTtsError(error);
      setIsPlaying(false);
      return;
    }
    if (!audio) {
      setIsPlaying(false);
      return;
    }

    audioRef.current = audio;
    const focus = a11y.focusMode;

    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        const ctx = new AC();
        audioCtxRef.current = ctx;
        await ctx.resume();
        const source = ctx.createMediaElementSource(audio);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.65;
        source.connect(analyser);
        analyser.connect(ctx.destination);
        const bins = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          if (!audioRef.current) return;
          analyser.getByteFrequencyData(bins);
          let s = 0;
          for (let i = 0; i < bins.length; i++) s += bins[i];
          const norm = Math.min(1, (s / bins.length) / 110);
          setMouthAmp(norm);
          ampRafRef.current = requestAnimationFrame(tick);
        };
        ampRafRef.current = requestAnimationFrame(tick);
      }
    } catch {
      /* lip-sync optional */
    }

    try {
      await audio.play();
    } catch {
      setTtsError("Playback was blocked. Click Listen again, or check browser sound permissions.");
      stopPlayback();
      setIsPlaying(false);
      return;
    }

    const onTimeUpdate = () => {
      const ends = endsRef.current;
      if (!ends?.length) return;
      const i = indexForTime(audio.currentTime, ends);
      if (modeRef.current === "sentence") setActiveSentenceIdx(i);
      else setActiveChunkIdx(i);
    };

    let loadedOnce = false;
    const onLoaded = () => {
      if (loadedOnce) return;
      const dur = audio.duration;
      if (!Number.isFinite(dur) || dur <= 0) return;
      loadedOnce = true;

      if (focus) {
        const parts = splitIntoSentences(text);
        const sents = parts.length ? parts : [text];
        const w = charWeights(sents);
        endsRef.current = buildCumulativeEnds(w, dur);
        modeRef.current = "sentence";
        setReadAlongSentences(sents);
        setActiveSentenceIdx(0);
        setActiveChunkIdx(null);
      } else {
        const w = charWeights(chunks);
        endsRef.current = buildCumulativeEnds(w, dur);
        modeRef.current = "chunk";
        setReadAlongSentences(null);
        setActiveSentenceIdx(null);
        setActiveChunkIdx(0);
      }
      onTimeUpdate();
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoaded, { once: true });

    detachListenersRef.current = () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoaded);
    };

    const finishPlayback = () => {
      detachListenersRef.current?.();
      detachListenersRef.current = null;
      if (ampRafRef.current) {
        cancelAnimationFrame(ampRafRef.current);
        ampRafRef.current = 0;
      }
      try {
        audioCtxRef.current?.close?.();
      } catch {
        /* */
      }
      audioCtxRef.current = null;
      setMouthAmp(0);
      audioRef.current = null;
      clearReadAlong();
      setIsPlaying(false);
    };

    audio.onended = finishPlayback;
    audio.onerror = () => {
      setTtsError("Audio playback failed. Try Listen again.");
      finishPlayback();
    };

    if (audio.readyState >= 1) onLoaded();
  };

  return (
    <div className="fade-up lesson-screen">
      <button type="button" className="btn btn-ghost btn--compact mb-nav" onClick={onBack}>
        ← Back
      </button>

      <div className="lesson-body">
        <div className="lesson-header">
          <p className="lesson-kicker">Your lesson in small steps</p>
          <h1 className="lesson-title">{lessonData.title || "Your Lesson"}</h1>
          <div className="progress-wrap">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="progress-label">{idx + 1} / {total}</span>
          </div>
        </div>

        {a11y.focusMode ? (
          <FocusChunk
            chunk={chunks[idx]}
            index={idx}
            sentences={readAlongSentences}
            activeSentenceIdx={isPlaying ? activeSentenceIdx : null}
          />
        ) : (
          chunks.map((chunk, i) => (
            <AllChunk
              key={i}
              chunk={chunk}
              index={i}
              readAlongActive={isPlaying && activeChunkIdx === i}
            />
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

        {isPlaying && (
          <p className="hint-text" style={{ marginTop: "6px", textAlign: "center" }}>
            Read-along timing is approximate and follows the audio length.
          </p>
        )}

        {ttsError && (
          <div className="error-box" role="alert">
            {ttsError}
          </div>
        )}

        {a11y.focusMode && (
          <div className="btn-row" style={{ marginTop: "8px" }}>
            <button type="button" className="btn btn-ghost" onClick={() => setCurrentChunkIndex(idx - 1)} disabled={idx === 0 || isPlaying}>
              ← Back
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setCurrentChunkIndex(idx + 1)}
              disabled={idx === total - 1 || isPlaying}
            >
              Next →
            </button>
          </div>
        )}

        <aside className="lesson-support" aria-label="Optional: gentle pacing companion (lesson steps are above)">
          <StudyCompanionPanel mouthAmp={mouthAmp} />
        </aside>

        <button type="button" className="btn btn-success btn-full mt-lg" onClick={onQuiz}>
          Quiz Me →
        </button>
      </div>
    </div>
  );
}

function FocusChunk({ chunk, index, sentences, activeSentenceIdx }) {
  const useReadAlong = sentences && sentences.length > 0 && activeSentenceIdx !== null;

  return (
    <article className="card-purple card-purple--focus fade-up">
      <div className="step-badge">Step {index + 1}</div>
      <p className="chunk-text">
        {useReadAlong
          ? sentences.map((s, i) => (
            <span
              key={i}
              className={
                i === activeSentenceIdx
                  ? "read-along__sentence read-along__sentence--active"
                  : "read-along__sentence"
              }
            >
              {s}
              {i < sentences.length - 1 ? " " : ""}
            </span>
          ))
          : chunk}
      </p>
    </article>
  );
}

function AllChunk({ chunk, index, readAlongActive }) {
  return (
    <article
      className={
        `card-purple${readAlongActive ? " card-purple--read-along card-purple--read-along-active" : ""}`
      }
    >
      <div className="step-badge">Step {index + 1}</div>
      <p className="chunk-text chunk-text--all">{chunk}</p>
    </article>
  );
}
