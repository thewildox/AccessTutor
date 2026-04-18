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
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ textAlign: "center", padding: "4rem 0" }}>
      <div style={{
        width: "56px", height: "56px",
        borderRadius: "50%",
        border: "3px solid var(--primary-light)",
        borderTop: "3px solid var(--primary)",
        animation: "spin 1s linear infinite",
        margin: "0 auto 1.5rem",
      }} />
      <p style={{
        color: "var(--muted)",
        fontSize: "1rem",
        animation: "breathe 2s ease-in-out infinite",
      }}>
        {MESSAGES[msgIndex]}
      </p>
    </div>
  );
}
