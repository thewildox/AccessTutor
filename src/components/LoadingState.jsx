import { useState, useEffect } from "react";

const MESSAGES = [
  "Breaking this down for you...",
  "Making it easier to understand...",
  "Finding the key ideas...",
  "Almost ready...",
];

export default function LoadingState() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-state" role="status" aria-live="polite">
      <div className="loading-state__pulse" aria-hidden="true" />
      <p className="loading-state__text">{MESSAGES[msgIndex]}</p>
    </div>
  );
}
