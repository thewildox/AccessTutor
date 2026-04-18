import { useState } from "react";
import HomeScreen from "./components/HomeScreen";
import LessonScreen from "./components/LessonScreen";
import QuizScreen from "./components/QuizScreen";
import AccessibilityBar from "./components/AccessibilityBar";
import LoadingState from "./components/LoadingState";
import { simplifyText } from "./services/geminiService";
import "./index.css";

export default function App() {
  const [view, setView] = useState("home");
  const [inputText, setInputText] = useState("");
  const [lessonData, setLessonData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [error, setError] = useState(null);
  const [geminiKey, setGeminiKey] = useState("");
  const [elevenKey, setElevenKey] = useState("");
  const [voiceId, setVoiceId] = useState("21m00Tcm4TlvDq8ikWAM");
  const [a11y, setA11y] = useState({
    largeText: false,
    focusMode: true,
    slowAudio: false,
    highContrast: false,
    dyslexicFont: false,
  });

  const toggleA11y = (key) => {
    setA11y((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleStart = async () => {
    if (!geminiKey) {
      setError("Please enter your Gemini API key first.");
      return;
    }
    setError(null);
    setIsLoading(true);
    setCurrentChunkIndex(0);
    try {
      const data = await simplifyText(inputText, geminiKey);
      setLessonData(data);
      setView("lesson");
    } catch (e) {
      setError("Something went wrong: " + e.message + ". Check your API key and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const rootClasses = [
    "app-root",
    a11y.largeText ? "large-text" : "",
    a11y.highContrast ? "high-contrast" : "",
    a11y.dyslexicFont ? "dyslexic-font" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClasses}>
      <div className="app-container">
        {isLoading ? (
          <LoadingState />
        ) : view === "home" ? (
          <HomeScreen
            inputText={inputText}
            setInputText={setInputText}
            onStart={handleStart}
            error={error}
            geminiKey={geminiKey}
            setGeminiKey={setGeminiKey}
            elevenKey={elevenKey}
            setElevenKey={setElevenKey}
            voiceId={voiceId}
            setVoiceId={setVoiceId}
          />
        ) : view === "lesson" ? (
          <LessonScreen
            lessonData={lessonData}
            currentChunkIndex={currentChunkIndex}
            setCurrentChunkIndex={setCurrentChunkIndex}
            onQuiz={() => setView("quiz")}
            onBack={() => setView("home")}
            a11y={a11y}
            elevenKey={elevenKey}
            voiceId={voiceId}
          />
        ) : (
          <QuizScreen
            lessonData={lessonData}
            onBack={() => setView("lesson")}
            a11y={a11y}
            elevenKey={elevenKey}
            voiceId={voiceId}
          />
        )}
      </div>
      <AccessibilityBar a11y={a11y} toggleA11y={toggleA11y} />
    </div>
  );
}
