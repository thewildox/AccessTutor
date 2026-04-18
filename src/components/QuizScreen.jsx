import { useState } from "react";
import { speakText } from "../services/elevenLabsService";

const SCORE_MESSAGES = {
  3: "Perfect score! You really understood this. Amazing work.",
  2: "Really solid work. You are getting it — keep going.",
  1: "Every try counts. You showed up and that is everything.",
  0: "No worries at all. Learning takes time. Let's try again.",
};

export default function QuizScreen({ lessonData, onBack, a11y, elevenKey, voiceId }) {
  const questions = lessonData?.questions || [];
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[currentQ];
  const pct = ((currentQ + 1) / questions.length) * 100;

  const handleSelect = async (opt) => {
    if (selectedAnswer) return;
    const correct = opt === q.correct;
    setSelectedAnswer(opt);
    setIsCorrect(correct);
    if (correct) {
      setScore((s) => s + 1);
    } else {
      // Play hint aloud when wrong
      if (elevenKey && q.hint) {
        await speakText(q.hint, elevenKey, voiceId, a11y.slowAudio);
      }
    }
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ((q) => q + 1);
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
  };

  if (done) {
    return (
      <div className="fade-up" style={{ textAlign: "center", padding: "2.5rem 0" }}>
        <div style={{
          fontFamily: "var(--font-display)", fontSize: "4rem",
          fontWeight: 800, color: "var(--primary)",
        }}>
          {score}/{questions.length}
        </div>
        <div style={{ color: "var(--muted)", fontSize: "1rem", marginTop: "4px" }}>
          questions correct
        </div>
        <p style={{
          fontSize: "1.1rem", fontWeight: 600, color: "var(--text)",
          marginTop: "1.25rem", lineHeight: 1.6,
        }}>
          {SCORE_MESSAGES[score] || SCORE_MESSAGES[0]}
        </p>
        <div className="btn-row" style={{ marginTop: "2rem", justifyContent: "center" }}>
          <button className="btn btn-ghost" onClick={handleRetry}>Try Again</button>
          <button className="btn btn-primary" onClick={onBack}>Back to Lesson</button>
        </div>
      </div>
    );
  }

  if (!q) return <p>No questions available.</p>;

  return (
    <div className="fade-up">
      {/* Back */}
      <button className="btn btn-ghost" style={{ padding: "8px 14px", fontSize: "0.85rem", marginBottom: "1rem" }} onClick={onBack}>
        ← Back to Lesson
      </button>

      {/* Progress */}
      <div className="progress-wrap" style={{ marginBottom: "1.5rem" }}>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="progress-label">Question {currentQ + 1} of {questions.length}</span>
      </div>

      {/* Question */}
      <p className="quiz-question" style={{
        fontFamily: "var(--font-display)", fontSize: "1.2rem",
        fontWeight: 700, lineHeight: 1.6, marginBottom: "1.25rem", color: "var(--text)",
      }}>
        {q.question}
      </p>

      {/* Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {(q.options || []).map((opt) => {
          let bg = "var(--surface)";
          let borderColor = "var(--border)";
          let color = "var(--text)";

          if (selectedAnswer) {
            if (opt === q.correct) {
              bg = "var(--success-light)";
              borderColor = "var(--success)";
              color = "#2e7d32";
            } else if (opt === selectedAnswer && !isCorrect) {
              bg = "var(--wrong-light)";
              borderColor = "var(--wrong)";
              color = "#c62828";
            }
          }

          return (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              disabled={!!selectedAnswer}
              style={{
                padding: "14px 18px",
                borderRadius: "var(--radius-sm)",
                border: `2px solid ${borderColor}`,
                background: bg,
                color,
                fontSize: "1rem",
                fontFamily: "var(--font-main)",
                cursor: selectedAnswer ? "not-allowed" : "pointer",
                textAlign: "left",
                lineHeight: 1.5,
                transition: "all 0.2s",
                minHeight: "52px",
              }}
              onMouseEnter={(e) => {
                if (!selectedAnswer) {
                  e.target.style.borderColor = "var(--primary)";
                  e.target.style.background = "var(--primary-light)";
                }
              }}
              onMouseLeave={(e) => {
                if (!selectedAnswer) {
                  e.target.style.borderColor = "var(--border)";
                  e.target.style.background = "var(--surface)";
                }
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {selectedAnswer && (
        <div
          style={{
            marginTop: "1rem",
            padding: "1rem 1.25rem",
            borderRadius: "var(--radius-sm)",
            background: isCorrect ? "var(--success-light)" : "var(--wrong-light)",
            border: `1.5px solid ${isCorrect ? "var(--success)" : "var(--wrong)"}`,
            color: isCorrect ? "#2e7d32" : "#c62828",
            fontSize: "0.95rem",
            lineHeight: 1.6,
          }}
        >
          {isCorrect
            ? "🎉 Great job! That is correct."
            : `Not quite — let's look at that together. ${q.hint || ""}`}
        </div>
      )}

      {/* Next / Retry */}
      {selectedAnswer && (
        <div className="btn-row" style={{ marginTop: "1rem" }}>
          {!isCorrect && (
            <button
              className="btn btn-ghost"
              onClick={() => { setSelectedAnswer(null); setIsCorrect(null); }}
            >
              Try Again
            </button>
          )}
          <button className="btn btn-primary" onClick={handleNext}>
            {currentQ < questions.length - 1 ? "Next Question →" : "See Results"}
          </button>
        </div>
      )}
    </div>
  );
}
