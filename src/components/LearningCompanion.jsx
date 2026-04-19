import { useState, useEffect, useRef, useCallback } from "react";

/** @typedef {'neutral' | 'positive' | 'idle'} CompanionMood */

const EMOJI = {
  neutral: "🙂",
  positive: "😄",
  idle: "😐",
};

const IDLE_MS = 90_000;
const POSITIVE_MS = 6_000;
const IDLE_CHECK_MS = 20_000;

/**
 * Calm corner presence during lesson/quiz only. No motion, no chat, no audio.
 * @param {{
 *   active: boolean;
 *   view: string;
 *   lessonKey: string;
 *   lastQuizAnswer: { correct: boolean; id: number } | null;
 * }} props
 */
export default function LearningCompanion({ active, view, lessonKey, lastQuizAnswer }) {
  const [mood, setMood] = useState(/** @type {CompanionMood} */ ("neutral"));
  const lastActivityRef = useRef(Date.now());
  const positiveTimerRef = useRef(0);
  const idleTimerRef = useRef(0);

  const clearPositiveTimer = useCallback(() => {
    if (positiveTimerRef.current) {
      window.clearTimeout(positiveTimerRef.current);
      positiveTimerRef.current = 0;
    }
  }, []);

  const bumpActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // New lesson session or view → calm welcome; when off, stop timers
  useEffect(() => {
    if (!active) {
      clearPositiveTimer();
      return;
    }
    clearPositiveTimer();
    setMood("neutral");
    bumpActivity();
  }, [active, lessonKey, view, clearPositiveTimer, bumpActivity]);

  // Quiz answer feedback (no rapid bounce: positive returns to neutral on a timer)
  useEffect(() => {
    if (!active) {
      clearPositiveTimer();
      return;
    }
    if (!lastQuizAnswer) return;
    clearPositiveTimer();
    if (lastQuizAnswer.correct) {
      setMood("positive");
      bumpActivity();
      positiveTimerRef.current = window.setTimeout(() => {
        setMood((m) => (m === "positive" ? "neutral" : m));
        positiveTimerRef.current = 0;
      }, POSITIVE_MS);
    } else {
      setMood("neutral");
      bumpActivity();
    }
    return clearPositiveTimer;
  }, [active, lastQuizAnswer, clearPositiveTimer, bumpActivity]);

  // Idle → very subtle face (only from neutral; no timers when inactive)
  useEffect(() => {
    if (!active) return undefined;

    const tick = () => {
      const now = Date.now();
      if (mood !== "neutral") return;
      if (now - lastActivityRef.current >= IDLE_MS) {
        setMood("idle");
      }
    };

    idleTimerRef.current = window.setInterval(tick, IDLE_CHECK_MS);
    return () => {
      window.clearInterval(idleTimerRef.current);
      idleTimerRef.current = 0;
    };
  }, [active, mood]);

  useEffect(() => {
    if (!active) return undefined;

    const onActivity = () => {
      lastActivityRef.current = Date.now();
      setMood((m) => (m === "idle" ? "neutral" : m));
    };

    window.addEventListener("pointerdown", onActivity, true);
    window.addEventListener("keydown", onActivity, true);
    return () => {
      window.removeEventListener("pointerdown", onActivity, true);
      window.removeEventListener("keydown", onActivity, true);
    };
  }, [active]);

  useEffect(() => () => clearPositiveTimer(), [clearPositiveTimer]);

  if (!active) return null;

  return (
    <div
      className="learning-companion"
      aria-hidden="true"
      title="Companion"
    >
      <span className="learning-companion__emoji">{EMOJI[mood]}</span>
    </div>
  );
}
