export type Rating = { place_id: string; yum: number; dollars: number };

export type Shared = { place_id: string; mine: Rating; theirs: Rating };

export type Comparison = {
  shared: Shared[];
  /** 0–100, or null when there is nothing in common yet. */
  matchScore: number | null;
  /** How much higher (+) or lower (−) the friend scores yum yums than you, on average. */
  yumBias: number;
  tryNext: { place_id: string; friendYum: number; friendDollars: number; predictedYum: number }[];
};

/**
 * Taste match: for each place you've both rated, distance =
 * 0.75·|Δyum| + 0.25·|Δdollars| (yum yums matter most; price is fairly objective).
 * Score = 100 × (1 − mean distance / 10).
 *
 * Try next: places the friend rated that you haven't. We correct for the friend's
 * habit of rating high or low (yumBias) to predict your yum score, then rank by
 * predicted yum with a small bonus for good value (below the fair-price line).
 */
export function compare(mine: Rating[], theirs: Rating[], limit = 5): Comparison {
  const myMap = new Map(mine.map((r) => [r.place_id, r]));
  const shared: Shared[] = [];
  for (const t of theirs) {
    const m = myMap.get(t.place_id);
    if (m) shared.push({ place_id: t.place_id, mine: m, theirs: t });
  }

  let matchScore: number | null = null;
  let yumBias = 0;
  if (shared.length > 0) {
    let dist = 0;
    let bias = 0;
    for (const s of shared) {
      dist += 0.75 * Math.abs(s.mine.yum - s.theirs.yum) + 0.25 * Math.abs(s.mine.dollars - s.theirs.dollars);
      bias += s.theirs.yum - s.mine.yum;
    }
    matchScore = Math.round(100 * (1 - dist / shared.length / 10));
    // Shrink the bias toward 0 when there are few shared places.
    yumBias = (bias / shared.length) * (shared.length / (shared.length + 2));
  }

  const clamp = (n: number) => Math.min(10, Math.max(0, n));
  const tryNext = theirs
    .filter((t) => !myMap.has(t.place_id))
    .map((t) => ({
      place_id: t.place_id,
      friendYum: t.yum,
      friendDollars: t.dollars,
      predictedYum: Math.round(clamp(t.yum - yumBias) * 10) / 10,
    }))
    .filter((t) => t.predictedYum >= 5)
    .sort((a, b) => {
      const sa = a.predictedYum + 0.3 * (a.predictedYum - a.friendDollars);
      const sb = b.predictedYum + 0.3 * (b.predictedYum - b.friendDollars);
      return sb - sa;
    })
    .slice(0, limit);

  return { shared, matchScore, yumBias: Math.round(yumBias * 10) / 10, tryNext };
}

/** Positive = more yum than you paid for (below the diagonal). */
export function valueOf(r: { yum: number; dollars: number }) {
  return r.yum - r.dollars;
}

export function valueLabel(r: { yum: number; dollars: number }) {
  const v = valueOf(r);
  if (v >= 2) return "Steal";
  if (v >= 0.5) return "Good value";
  if (v > -0.5) return "Fair price";
  if (v > -2) return "Pricey";
  return "Rip-off";
}
