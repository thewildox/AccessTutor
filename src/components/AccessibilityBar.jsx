const TOGGLES = [
  { key: "largeText", label: "Large Text", hint: null },
  { key: "focusMode", label: "Focus Mode", hint: "Recommended for better learning" },
  { key: "slowAudio", label: "Slow Audio", hint: null },
  { key: "highContrast", label: "High Contrast", hint: null },
  { key: "dyslexicFont", label: "Easy Font", hint: "Clearer letters for reading" },
  { key: "calmMode", label: "Calm look", hint: "Softer colors and shadows" },
];

export default function AccessibilityBar({
  a11y,
  toggleA11y,
  onResetA11y,
  companionEnabled = true,
  onCompanionToggle,
}) {
  return (
    <nav className="a11y-bar" aria-label="Accessibility options">
      <div className="a11y-bar__chips">
        {TOGGLES.map(({ key, label, hint }) => {
          const on = a11y[key];
          return (
            <button
              key={key}
              type="button"
              className={`a11y-chip${on ? " a11y-chip--on" : ""}`}
              onClick={() => toggleA11y(key)}
              aria-pressed={on}
              title={hint || undefined}
            >
              {label}
            </button>
          );
        })}
        {typeof onCompanionToggle === "function" && (
          <button
            type="button"
            className={`a11y-chip${companionEnabled ? " a11y-chip--on" : ""}`}
            onClick={() => onCompanionToggle(!companionEnabled)}
            aria-pressed={companionEnabled}
            title="Small calm face during lesson and quiz. Off hides it completely."
          >
            Companion: {companionEnabled ? "On" : "Off"}
          </button>
        )}
      </div>
      {onResetA11y && (
        <button
          type="button"
          className="a11y-reset"
          onClick={onResetA11y}
        >
          Reset accessibility
        </button>
      )}
    </nav>
  );
}
