import { useState, useEffect, useRef } from "react";
import HomeScreen from "./components/HomeScreen";
import LessonScreen from "./components/LessonScreen";
import QuizScreen from "./components/QuizScreen";
import AccessibilityBar from "./components/AccessibilityBar";
import LoadingState from "./components/LoadingState";
import { simplifyText } from "./services/geminiService";
import {
  MAX_ATTACHMENT_COUNT,
  validateAttachmentFile,
  fileToInlineAttachment,
} from "./utils/inlineAttachments";
import {
  readSavedSession,
  writeSavedSession,
  clearSavedSession,
  loadRememberedKeys,
  saveRememberedKeys,
  clearRememberedKeys,
  REMEMBER_KEYS_FLAG,
} from "./lib/hackathonStorage";
import {
  loadA11yPrefs,
  saveA11yPrefs,
  mergeA11yPrefs,
  DEFAULT_A11Y,
} from "./lib/a11yStorage";
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
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [rememberKeys, setRememberKeys] = useState(
    () => typeof localStorage !== "undefined" && localStorage.getItem(REMEMBER_KEYS_FLAG) === "1"
  );
  const [a11y, setA11y] = useState(() => mergeA11yPrefs(loadA11yPrefs()));
  const [routeAnnouncement, setRouteAnnouncement] = useState("");
  const routeBootRef = useRef(true);

  useEffect(() => {
    saveA11yPrefs(a11y);
  }, [a11y]);

  useEffect(() => {
    if (isLoading) {
      setRouteAnnouncement("Loading your lesson. Please wait.");
      return;
    }
    const labels = { home: "Home", lesson: "Lesson screen", quiz: "Quiz" };
    if (routeBootRef.current) {
      routeBootRef.current = false;
      return;
    }
    setRouteAnnouncement(labels[view] || view);
  }, [view, isLoading]);

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

  const resetA11y = () => {
    setA11y({ ...DEFAULT_A11Y });
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
    const trimmedRaw = inputText.trim().slice(0, MAX_INPUT_CHARS);
    if (inputText.length > MAX_INPUT_CHARS) {
      setInputText(trimmedRaw);
    }
    if (!trimmedRaw && attachedFiles.length === 0) {
      setError("Paste some text or add at least one image or PDF.");
      return;
    }
    if (attachedFiles.length > MAX_ATTACHMENT_COUNT) {
      setError(`You can attach up to ${MAX_ATTACHMENT_COUNT} files. Remove some and try again.`);
      return;
    }
    for (const file of attachedFiles) {
      const attErr = validateAttachmentFile(file);
      if (attErr) {
        setError(attErr);
        return;
      }
    }
    setError(null);
    setIsLoading(true);
    setCurrentChunkIndex(0);
    try {
      const inlineParts = [];
      for (const file of attachedFiles) {
        inlineParts.push(await fileToInlineAttachment(file));
      }
      const data = await simplifyText(trimmedRaw, geminiKey, inlineParts);
      setLessonData(data);
      setAttachedFiles([]);
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
    a11y.calmMode ? "calm-mode" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClasses}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <div
        className="visually-hidden"
        aria-live="polite"
        aria-atomic="true"
      >
        {routeAnnouncement}
      </div>
      <div className="app-container">
        <main id="main-content">
        {isLoading ? (
          <LoadingState />
        ) : view === "home" ? (
          <HomeScreen
            inputText={inputText}
            setInputText={setInputText}
            attachedFiles={attachedFiles}
            setAttachedFiles={setAttachedFiles}
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
        </main>
      </div>
      <AccessibilityBar a11y={a11y} toggleA11y={toggleA11y} onResetA11y={resetA11y} />
    </div>
  );
}
