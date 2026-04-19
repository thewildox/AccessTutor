/**
 * Friendly 2D study-buddy icon (not emoji). Mouth height follows audio amplitude 0–1.
 * @param {{ mouthOpen: number }} props
 */
export default function PeerAvatar({ mouthOpen = 0 }) {
  const m = Math.max(0, Math.min(1, mouthOpen));
  const mouthRy = 2.2 + m * 8.5;
  const mouthCy = 58 + (1 - m) * 1.2;

  return (
    <div className="peer-avatar peer-avatar--compact" aria-hidden="true">
      <svg className="peer-avatar__svg" viewBox="0 0 100 100" width="58" height="58">
        {/* Base fills survive if CSS fails; classes theme for HC / calm */}
        <circle className="peer-avatar__halo" cx="50" cy="50" r="40" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
        <ellipse className="peer-avatar__face" cx="50" cy="49" rx="34" ry="38" fill="#ffedd5" stroke="#d97706" strokeWidth="1.25" />
        {/* Eyes: sclera + pupil so it never reads as one black oval */}
        <ellipse className="peer-avatar__sclera" cx="36" cy="43" rx="7" ry="8" fill="#fffbeb" stroke="#ca8a04" strokeWidth="0.75" />
        <ellipse className="peer-avatar__sclera" cx="64" cy="43" rx="7" ry="8" fill="#fffbeb" stroke="#ca8a04" strokeWidth="0.75" />
        <circle className="peer-avatar__pupil" cx="36" cy="44" r="2.8" fill="#44403c" />
        <circle className="peer-avatar__pupil" cx="64" cy="44" r="2.8" fill="#44403c" />
        <ellipse className="peer-avatar__blush" cx="28" cy="54" rx="5" ry="3" fill="rgba(244, 63, 94, 0.15)" />
        <ellipse className="peer-avatar__blush" cx="72" cy="54" rx="5" ry="3" fill="rgba(244, 63, 94, 0.15)" />
        <ellipse
          className="peer-avatar__mouth"
          cx="50"
          cy={mouthCy}
          rx="10"
          ry={mouthRy}
          fill="#b91c1c"
        />
      </svg>
    </div>
  );
}
