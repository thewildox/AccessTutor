/**
 * Split visible text into rough sentences for heuristic read-along timing.
 * @param {string} text
 * @returns {string[]}
 */
export function splitIntoSentences(text) {
  const t = text.trim();
  if (!t) return [];

  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    try {
      const seg = new Intl.Segmenter(undefined, { granularity: "sentence" });
      const out = [...seg.segment(t)]
        .filter((s) => s.isSentenceLike)
        .map((s) => s.segment.trim())
        .filter(Boolean);
      if (out.length) return out;
    } catch {
      /* fall through */
    }
  }

  const rough = t.split(/(?<=[.!?…])\s+/).map((s) => s.trim()).filter(Boolean);
  if (rough.length) return rough;
  return [t];
}

/** @param {string[]} strings */
export function charWeights(strings) {
  return strings.map((s) => Math.max(2, s.length));
}

/**
 * Cumulative end times in seconds (strictly increasing), scaled to totalDuration.
 * @param {number[]} weights
 * @param {number} totalDuration
 * @returns {number[]}
 */
export function buildCumulativeEnds(weights, totalDuration) {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0 || !Number.isFinite(totalDuration) || totalDuration <= 0) {
    return weights.map((_, i) => ((i + 1) / weights.length) * (totalDuration || 1));
  }
  let acc = 0;
  return weights.map((w) => {
    acc += (w / sum) * totalDuration;
    return acc;
  });
}

/** @param {number} t @param {number[]} ends */
export function indexForTime(t, ends) {
  if (!ends.length) return 0;
  const idx = ends.findIndex((e) => t < e);
  if (idx === -1) return ends.length - 1;
  return idx;
}
