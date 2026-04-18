import { useState } from "react";
import { speakText } from "../services/elevenLabsService";

const SCORE_MESSAGES = {
  3: "Perfect score! You really understood this. Amazing work.",
  2: "Really solid work. You are getting it — keep going.",
  1: "Every try counts. You showed up and that is everything.",
  0: "No worries at all. Learning takes time. Let's try again.",
};

function optionClass(opt, q, selectedAnswer, isCorrect) {
  if (!selectedAnswer) return "quiz-option";
  if (opt === q.correct) return "quiz-option quiz-option--correct";
  if (opt === selectedAnswer && !isCorrect) return "quiz-option quiz-option--wrong";
  return "quiz-option quiz-option--dim";
}

export default function QuizScreen({ lessonData, onBack, a11y, elevenKey, voiceId }) {
  const questions = lessonData?.questions || [];
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [ttsError, setTtsError] = useState(null);

  const q = questions[currentQ];
  const pct = ((currentQ + 1) / questions.length) * 100;

  const handleSelect = async (opt) => {
    if (selectedAnswer) return;
    const correct = opt === q.correct;
    setSelectedAnswer(opt);
    setIsCorrect(correct);
    setTtsError(null);
    if (correct) {
      setScore((s) => s + 1);
    } else if (elevenKey && q.hint) {
      const { error } = await speakText(q.hint, elevenKey, voiceId, a11y.slowAudio);
      if (error) setTtsError(error);
    }
  };

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

      <p className="quiz-question">{q.question}</p>

      <div className="quiz-options">
        {(q.options || []).map((opt) => (
          <button
            key={opt}
            type="button"
            className={optionClass(opt, q, selectedAnswer, isCorrect)}
            onClick={() => handleSelect(opt)}
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
          <button type="button" className="btn btn-primary" onClick={handleNext}>
            {currentQ < questions.length - 1 ? "Next Question →" : "See Results"}
          </button>
        </div>
      )}
    </div>
  );
}
