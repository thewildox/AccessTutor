import { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
import { debugIngest } from "./debugIngest.js";
import {
  loadStudyCompanionPrefs,
  saveStudyCompanionPrefs,
  consumeLastEngagementHintForNextLesson,
} from "./lib/studyCompanionPrefs";
import { loadCompanionEnabled, saveCompanionEnabled } from "./lib/companionStorage";
import LearningCompanion from "./components/LearningCompanion";
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
  const [studyPeer, setStudyPeer] = useState(() => loadStudyCompanionPrefs().studyPeer);
  const [specialInterest, setSpecialInterest] = useState(
    () => loadStudyCompanionPrefs().specialInterest,
  );
  const [companionEnabled, setCompanionEnabled] = useState(() => loadCompanionEnabled());
  const [quizAnswerEvent, setQuizAnswerEvent] = useState(null);
  const [routeAnnouncement, setRouteAnnouncement] = useState("");
  const routeBootRef = useRef(true);

  const lessonKey = useMemo(() => {
    if (!lessonData) return "none";
    const t = lessonData.title || "";
    const c = lessonData.chunks?.length ?? 0;
    const q = lessonData.questions?.length ?? 0;
    return `${t}-${c}-${q}`;
  }, [lessonData]);

  const onQuizAnswerResult = useCallback(
    (correct) => {
      if (!companionEnabled) return;
      setQuizAnswerEvent({ correct, id: Date.now() });
    },
    [companionEnabled],
  );

  useEffect(() => {
    saveStudyCompanionPrefs({ studyPeer, specialInterest });
  }, [studyPeer, specialInterest]);

  useEffect(() => {
    saveA11yPrefs(a11y);
  }, [a11y]);

  useEffect(() => {
    saveCompanionEnabled(companionEnabled);
  }, [companionEnabled]);

  useEffect(() => {
    if (view === "lesson") setQuizAnswerEvent(null);
  }, [view]);

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
        // #region agent log
        debugIngest({
          runId: "post-fix",
          hypothesisId: "H2",
          location: "App.jsx:handleStart:validateFail",
          message: "attachment validation failed",
          data: { fileCount: attachedFiles.length },
          timestamp: Date.now(),
        });
        // #endregion
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
      const engagementHint = consumeLastEngagementHintForNextLesson();
      const data = await simplifyText(trimmedRaw, geminiKey, inlineParts, {
        studyPeer,
        specialInterest,
        engagementHint,
      });
      // #region agent log
      debugIngest({
        runId: "post-fix",
        hypothesisId: "H5",
        location: "App.jsx:handleStart:success",
        message: "lesson generated",
        data: {
          attachmentCount: inlineParts.length,
          chunkCount: data?.chunks?.length ?? 0,
          titleLen: data?.title ? String(data.title).length : 0,
        },
        timestamp: Date.now(),
      });
      // #endregion
      setLessonData(data);
      setAttachedFiles([]);
      setView("lesson");
    } catch (e) {
      // #region agent log
      debugIngest({
        runId: "post-fix",
        hypothesisId: "H6",
        location: "App.jsx:handleStart:catch",
        message: "start failed",
        data: { errSlice: String(e?.message || e).slice(0, 200) },
        timestamp: Date.now(),
      });
      // #endregion
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
            studyPeer={studyPeer}
            setStudyPeer={setStudyPeer}
            specialInterest={specialInterest}
            setSpecialInterest={setSpecialInterest}
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
            onAnswerResult={onQuizAnswerResult}
          />
        )}
        </main>
      </div>
      <LearningCompanion
        active={companionEnabled && (view === "lesson" || view === "quiz")}
        view={view}
        lessonKey={lessonKey}
        lastQuizAnswer={view === "quiz" ? quizAnswerEvent : null}
      />
      <AccessibilityBar
        a11y={a11y}
        toggleA11y={toggleA11y}
        onResetA11y={resetA11y}
        companionEnabled={companionEnabled}
        onCompanionToggle={setCompanionEnabled}
      />
    </div>
  );
}
