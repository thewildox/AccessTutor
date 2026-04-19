import { useCallback, useEffect, useRef, useState } from "react";
import PeerAvatar from "./PeerAvatar";

/** Inactivity window (ms) before gentle check-in — between 6–8 seconds. */
const IDLE_MS = 7000;

/**
 * Lightweight “study with me” strip: local inactivity only (no vision stack).
 * @param {{ mouthAmp?: number }} props
 */
export default function StudyCompanionPanel({ mouthAmp = 0 }) {
  const [enabled, setEnabled] = useState(false);
  const [manualBreak, setManualBreak] = useState(false);
  const [showTogether, setShowTogether] = useState(false);
  const lastActivityRef = useRef(Date.now());

  const markActive = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowTogether(false);
  }, []);

  useEffect(() => {
    if (!enabled || manualBreak) {
      setShowTogether(false);
      return undefined;
    }
    markActive();
    const onActivity = () => {
      markActive();
    };
    const events = ["pointerdown", "keydown", "scroll", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));
    const id = window.setInterval(() => {
      if (Date.now() - lastActivityRef.current >= IDLE_MS) {
        setShowTogether(true);
      }
    }, 400);
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, onActivity));
      window.clearInterval(id);
    };
  }, [enabled, manualBreak, markActive]);

  const onContinueTogether = () => {
    markActive();
  };

  const onTakeBreakFromNudge = () => {
    setManualBreak(true);
    setShowTogether(false);
    markActive();
  };

  const onEndBreak = () => {
    setManualBreak(false);
    markActive();
  };

  return (
    <section className="study-with-me card card--companion-compact" aria-label="Study with me">
      <div className="study-with-me__main">
        <PeerAvatar mouthOpen={mouthAmp} />
        <div className="study-with-me__copy">
          <label className="study-with-me__toggle">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => {
                setEnabled(e.target.checked);
                if (!e.target.checked) {
                  setManualBreak(false);
                  setShowTogether(false);
                }
              }}
            />
            <span>Study with me</span>
          </label>
          <p className="study-with-me__line">I’ll stay with you while you learn.</p>
          <p className="study-with-me__line">We can go step by step.</p>
          <p className="study-with-me__privacy hint-text">Your video stays on your device.</p>

          {enabled && !manualBreak && (
            <button
              type="button"
              className="btn btn-ghost btn--compact study-with-me__quiet-break"
              onClick={() => {
                setManualBreak(true);
                markActive();
              }}
            >
              Take a short break
            </button>
          )}

          {enabled && manualBreak && (
            <p className="hint-text study-with-me__break-note">Pause as long as you like.</p>
          )}

          {enabled && manualBreak && (
            <button type="button" className="btn btn-secondary btn--compact" onClick={onEndBreak}>
              Continue →
            </button>
          )}
        </div>
      </div>

      {enabled && !manualBreak && showTogether && (
        <div
          className="study-with-me__nudge"
          role="region"
          aria-label="Check in"
          aria-live="polite"
        >
          <p className="study-with-me__nudge-title">Want to keep going together?</p>
          <div className="study-with-me__nudge-btns">
            <button type="button" className="btn btn-secondary btn--compact" onClick={onContinueTogether}>
              Continue →
            </button>
            <button type="button" className="btn btn-ghost btn--compact" onClick={onTakeBreakFromNudge}>
              Take a short break
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
