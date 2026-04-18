import { useState, useEffect } from "react";
import HomeScreen from "./components/HomeScreen";
import LessonScreen from "./components/LessonScreen";
import QuizScreen from "./components/QuizScreen";
import AccessibilityBar from "./components/AccessibilityBar";
import LoadingState from "./components/LoadingState";
import { simplifyText } from "./services/geminiService";
import {
  readSavedSession,
  writeSavedSession,
  clearSavedSession,
  loadRememberedKeys,
  saveRememberedKeys,
  clearRememberedKeys,
  REMEMBER_KEYS_FLAG,
} from "./lib/hackathonStorage";
import "./index.css";

const MAX_INPUT_CHARS = 32000;

export default function App() {
  const remembered = loadRememberedKeys();
  const [view, setView] = useState("home");
  const [inputText, setInputText] = useState("");
  const [lessonData, setLessonData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [error, setError] = useState(null);
  const [geminiKey, setGeminiKey] = useState(remembered?.geminiKey || "");
  const [elevenKey, setElevenKey] = useState(remembered?.elevenKey || "");
  const [voiceId, setVoiceId] = useState(remembered?.voiceId || "21m00Tcm4TlvDq8ikWAM");
  const [rememberKeys, setRememberKeys] = useState(
    () => typeof localStorage !== "undefined" && localStorage.getItem(REMEMBER_KEYS_FLAG) === "1"
  );
  const [a11y, setA11y] = useState({
    largeText: false,
    focusMode: true,
    slowAudio: false,
    highContrast: false,
    dyslexicFont: false,
  });

  useEffect(() => {
    const saved = readSavedSession();
    if (!saved) return;
    if (saved.view === "lesson" || saved.view === "quiz") {
      setLessonData(saved.lessonData);
      setView(saved.view);
      setCurrentChunkIndex(saved.currentChunkIndex ?? 0);
      if (saved.inputText) setInputText(saved.inputText);
    }
  }, []);

  useEffect(() => {
    if (view !== "lesson" && view !== "quiz") return;
    if (!lessonData?.chunks?.length) return;
    writeSavedSession({ view, lessonData, currentChunkIndex, inputText });
  }, [view, lessonData, currentChunkIndex, inputText]);

  useEffect(() => {
    if (!rememberKeys) {
      clearRememberedKeys();
      return;
    }
    saveRememberedKeys({ geminiKey, elevenKey, voiceId });
  }, [rememberKeys, geminiKey, elevenKey, voiceId]);

  const toggleA11y = (key) => {
    setA11y((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const leaveLessonToHome = () => {
    clearSavedSession();
    setView("home");
  };

  const handleStart = async () => {
    if (!geminiKey) {
      setError("Please enter your Gemini API key first.");
      return;
    }
    const trimmed = inputText.slice(0, MAX_INPUT_CHARS);
    if (inputText.length > MAX_INPUT_CHARS) {
      setInputText(trimmed);
    }
    setError(null);
    setIsLoading(true);
    setCurrentChunkIndex(0);
    try {
      const data = await simplifyText(trimmed, geminiKey);
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
            rememberKeys={rememberKeys}
            setRememberKeys={setRememberKeys}
            longInputWarning={inputText.length > 28000}
          />
        ) : view === "lesson" ? (
          <LessonScreen
            lessonData={lessonData}
            currentChunkIndex={currentChunkIndex}
            setCurrentChunkIndex={setCurrentChunkIndex}
            onQuiz={() => setView("quiz")}
            onBack={leaveLessonToHome}
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
