const TOGGLES = [
  { key: "largeText",    label: "Large Text",   icon: "🔡" },
  { key: "focusMode",    label: "Focus Mode",   icon: "🎯" },
  { key: "slowAudio",    label: "Slow Audio",   icon: "🐢" },
  { key: "highContrast", label: "High Contrast",icon: "🌙" },
  { key: "dyslexicFont", label: "Easy Font",    icon: "📖" },
];

export default function AccessibilityBar({ a11y, toggleA11y }) {
  return (
    <div style={{
      position: "fixed",
      bottom: 0, left: 0, right: 0,
      background: "var(--surface)",
      borderTop: "1.5px solid var(--border)",
      display: "flex",
      justifyContent: "center",
      flexWrap: "wrap",
      gap: "6px",
      padding: "8px 12px",
      zIndex: 100,
    }}>
      {TOGGLES.map(({ key, label, icon }) => (
        <button
          key={key}
          onClick={() => toggleA11y(key)}
          style={{
            border: `1.5px solid ${a11y[key] ? "var(--primary)" : "var(--border)"}`,
            background: a11y[key] ? "var(--primary)" : "transparent",
            color: a11y[key] ? "#fff" : "var(--muted)",
            borderRadius: "20px",
            padding: "5px 12px",
            fontSize: "12px",
            fontFamily: "var(--font-main)",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s",
            whiteSpace: "nowrap",
          }}
        >
          {icon} {label}
        </button>
      ))}
    </div>
  );
}
