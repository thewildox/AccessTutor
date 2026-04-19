import { useState, useEffect } from "react";

const MESSAGES = [
  "Breaking this down for you...",
  "Making it easier to understand...",
  "Finding the key ideas...",
  "Almost ready...",
];

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return reduced;
}

export default function LoadingState() {
  const reducedMotion = usePrefersReducedMotion();
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [reducedMotion]);

  return (
    <div className="loading-state" role="status" aria-live="polite">
      <div className="loading-state__pulse" aria-hidden="true" />
      <p className="loading-state__text">
        {MESSAGES[reducedMotion ? 0 : msgIndex]}
      </p>
    </div>
  );
}
