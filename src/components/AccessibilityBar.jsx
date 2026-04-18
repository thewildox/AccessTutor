const TOGGLES = [
  { key: "largeText",    label: "Large text" },
  { key: "focusMode",    label: "Focus" },
  { key: "slowAudio",    label: "Slow audio" },
  { key: "highContrast", label: "Contrast" },
  { key: "dyslexicFont", label: "Readable font" },
];

export default function AccessibilityBar({ a11y, toggleA11y }) {
  return (
    <nav className="a11y-bar" aria-label="Accessibility options">
      {TOGGLES.map(({ key, label }) => {
        const on = a11y[key];
        return (
          <button
            key={key}
            type="button"
            className={`a11y-chip${on ? " a11y-chip--on" : ""}`}
            onClick={() => toggleA11y(key)}
            aria-pressed={on}
          >
            {label}
          </button>
        );
      })}
    </nav>
  );
}
