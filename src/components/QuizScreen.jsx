import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { speakText } from "../services/elevenLabsService";

const SCORE_MESSAGES = {
  3: "Perfect score! You really understood this. Amazing work.",
  2: "Really solid work. You are getting it — keep going.",
  1: "Every try counts. You showed up and that is everything.",
  0: "No worries at all. Learning takes time. Let's try again.",
};

function optionClass(opt, q, selectedAnswer, isCorrect, keyboardFocus) {
  let base = "quiz-option";
  if (!selectedAnswer) {
    if (keyboardFocus) base += " quiz-option--keyboard-focus";
    return base;
  }
  if (opt === q.correct) return "quiz-option quiz-option--correct";
  if (opt === selectedAnswer && !isCorrect) return "quiz-option quiz-option--wrong";
  return "quiz-option quiz-option--dim";
}

export default function QuizScreen({
  lessonData,
  onBack,
  a11y,
  elevenKey,
  voiceId,
  onAnswerResult,
}) {
  const questions = lessonData?.questions || [];
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [ttsError, setTtsError] = useState(null);
  const [focusedIdx, setFocusedIdx] = useState(0);
  const [optionsHaveFocus, setOptionsHaveFocus] = useState(false);

  const optionRefs = useRef([]);
  const nextBtnRef = useRef(null);
  const handleSelectRef = useRef(null);
  const optsRef = useRef([]);
  const focusedIdxRef = useRef(0);

  const q = questions[currentQ];
  const pct = ((currentQ + 1) / questions.length) * 100;
  const opts = q?.options || [];

  optsRef.current = opts;
  focusedIdxRef.current = focusedIdx;

  const handleSelect = async (opt) => {
    if (selectedAnswer) return;
    const correct = opt === q.correct;
    setSelectedAnswer(opt);
    setIsCorrect(correct);
    setTtsError(null);
    onAnswerResult?.(correct);
    if (correct) {
      setScore((s) => s + 1);
    } else if (elevenKey && q.hint) {
      const { error } = await speakText(q.hint, elevenKey, voiceId, a11y.slowAudio);
      if (error) setTtsError(error);
    }
  };

  handleSelectRef.current = handleSelect;

  useLayoutEffect(() => {
    setFocusedIdx(0);
  }, [currentQ]);

  useLayoutEffect(() => {
    if (done || selectedAnswer || !opts.length) return;
    optionRefs.current[focusedIdx]?.focus({ preventScroll: true });
  }, [focusedIdx, selectedAnswer, done, opts.length, currentQ]);

  useLayoutEffect(() => {
    if (!selectedAnswer || done) return;
    nextBtnRef.current?.focus({ preventScroll: true });
  }, [selectedAnswer, done, currentQ]);

  useEffect(() => {
    if (done || !q || selectedAnswer || !opts.length) return;

    const onKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target;
      if (t && ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return;
      if (!t?.closest?.(".quiz-options")) return;

      const { key } = e;
      if (!["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Enter", " "].includes(key)) return;

      e.preventDefault();
      const list = optsRef.current;
      const n = list.length;
      if (!n) return;

      if (key === "ArrowDown" || key === "ArrowRight") {
        setFocusedIdx((i) => (i + 1) % n);
      } else if (key === "ArrowUp" || key === "ArrowLeft") {
        setFocusedIdx((i) => (i - 1 + n) % n);
      } else if (key === "Enter" || key === " ") {
        handleSelectRef.current?.(list[focusedIdxRef.current]);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [done, q, selectedAnswer, opts.length, currentQ]);

  const handleNext = () => {
    setTtsError(null);
    if (currentQ < questions.length - 1) {
      setCurrentQ((n) => n + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
    } else {
      setDone(true);
    }
  };

  const handleRetry = () => {
    setCurrentQ(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setScore(0);
    setDone(false);
    setTtsError(null);
    setFocusedIdx(0);
  };

  if (done) {
    return (
      <div className="fade-up quiz-results">
        <div className="quiz-results__score" aria-live="polite">
          {score}/{questions.length}
        </div>
        <div className="quiz-results__label">questions correct</div>
        <p className="quiz-results__message">
          {SCORE_MESSAGES[score] || SCORE_MESSAGES[0]}
        </p>
        <div className="btn-row btn-row--center mt-lg">
          <button type="button" className="btn btn-ghost" onClick={handleRetry}>Try Again</button>
          <button type="button" className="btn btn-primary" onClick={onBack}>Back to Lesson</button>
        </div>
      </div>
    );
  }

  if (!q) return <p className="empty-state">No questions available.</p>;

  return (
    <div className="fade-up">
      <button type="button" className="btn btn-ghost btn--compact mb-nav" onClick={onBack}>
        ← Back to Lesson
      </button>

      <div className="progress-wrap" style={{ marginBottom: "1.5rem" }}>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="progress-label">Question {currentQ + 1} of {questions.length}</span>
      </div>

      <p id={`quiz-q-${currentQ}`} className="quiz-question">{q.question}</p>

      <p className="visually-hidden">
        Use arrow keys to move between answers. Press Enter or Space to choose.
      </p>

      <div
        className="quiz-options"
        role="radiogroup"
        aria-labelledby={`quiz-q-${currentQ}`}
        onFocusCapture={() => setOptionsHaveFocus(true)}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setOptionsHaveFocus(false);
        }}
      >
        {(q.options || []).map((opt, i) => (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={!!selectedAnswer && opt === selectedAnswer}
            tabIndex={!selectedAnswer && i === focusedIdx ? 0 : -1}
            ref={(el) => {
              optionRefs.current[i] = el;
            }}
            className={optionClass(
              opt,
              q,
              selectedAnswer,
              isCorrect,
              !selectedAnswer && optionsHaveFocus && i === focusedIdx,
            )}
            onClick={() => handleSelect(opt)}
            onFocus={() => {
              if (!selectedAnswer) setFocusedIdx(i);
            }}
            disabled={!!selectedAnswer}
          >
            {opt}
          </button>
        ))}
      </div>

      {selectedAnswer && (
        <div
          className={`feedback-banner ${isCorrect ? "feedback-banner--ok" : "feedback-banner--no"}`}
          role="status"
        >
          {isCorrect
            ? "Correct — nice work."
            : `Not quite. ${q.hint || "Take another look at the lesson when you are ready."}`}
        </div>
      )}

      {ttsError && (
        <div className="error-box" role="alert">
          {ttsError}
        </div>
      )}

      {selectedAnswer && (
        <div className="btn-row">
          {!isCorrect && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setSelectedAnswer(null);
                setIsCorrect(null);
                setTtsError(null);
              }}
            >
              Try Again
            </button>
          )}
          <button ref={nextBtnRef} type="button" className="btn btn-primary" onClick={handleNext}>
            {currentQ < questions.length - 1 ? "Next Question →" : "See Results"}
          </button>
        </div>
      )}
    </div>
  );
}
