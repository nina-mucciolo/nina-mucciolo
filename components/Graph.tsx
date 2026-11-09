"use client";

export type GraphPoint = {
  id: string;
  yum: number;
  dollars: number;
  label: string;
  series: "me" | "friend" | "preview";
};

type Props = {
  points: GraphPoint[];
  /** place_ids to connect me ↔ friend with a line */
  links?: string[];
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  showLabels?: boolean;
};

// Plot area in SVG units. The SVG scales to the container width.
const W = 320;
const H = 320;
const PAD_L = 34;
const PAD_B = 34;
const PAD_T = 10;
const PAD_R = 10;
const PW = W - PAD_L - PAD_R;
const PH = H - PAD_T - PAD_B;

const sx = (yum: number) => PAD_L + (yum / 10) * PW;
const sy = (dollars: number) => PAD_T + (1 - dollars / 10) * PH;

export default function Graph({ points, links = [], selectedId, onSelect, showLabels }: Props) {
  const byKey = new Map(points.map((p) => [`${p.series}:${p.id}`, p]));
  const ticks = [0, 2, 4, 6, 8, 10];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="graph"
      role="img"
      aria-label="Restaurants plotted by yum yums (across) and dollars (up)"
      onClick={() => onSelect?.(null)}
    >
      {/* value zones */}
      <polygon
        points={`${sx(0)},${sy(0)} ${sx(10)},${sy(0)} ${sx(10)},${sy(10)}`}
        className="zone-good"
      />
      <polygon
        points={`${sx(0)},${sy(0)} ${sx(0)},${sy(10)} ${sx(10)},${sy(10)}`}
        className="zone-bad"
      />
      <text x={sx(9.6)} y={sy(0.6)} className="zone-label" textAnchor="end">worth it</text>
      <text x={sx(0.4)} y={sy(9.4)} className="zone-label">overpriced</text>

      {/* grid */}
      {ticks.map((t) => (
        <g key={t}>
          <line x1={sx(t)} x2={sx(t)} y1={sy(0)} y2={sy(10)} className="grid" />
          <line x1={sx(0)} x2={sx(10)} y1={sy(t)} y2={sy(t)} className="grid" />
          <text x={sx(t)} y={sy(0) + 13} className="tick" textAnchor="middle">{t}</text>
          <text x={sx(0) - 6} y={sy(t) + 3.5} className="tick" textAnchor="end">{t}</text>
        </g>
      ))}

      {/* fair-price diagonal */}
      <line x1={sx(0)} y1={sy(0)} x2={sx(10)} y2={sy(10)} className="diagonal" />

      <text x={PAD_L + PW / 2} y={H - 4} className="axis-label" textAnchor="middle">yum yums →</text>
      <text
        x={10}
        y={PAD_T + PH / 2}
        className="axis-label"
        textAnchor="middle"
        transform={`rotate(-90 10 ${PAD_T + PH / 2})`}
      >
        dollars →
      </text>

      {/* friend links */}
      {links.map((id) => {
        const a = byKey.get(`me:${id}`);
        const b = byKey.get(`friend:${id}`);
        if (!a || !b) return null;
        return (
          <line
            key={`l-${id}`}
            x1={sx(a.yum)} y1={sy(a.dollars)} x2={sx(b.yum)} y2={sy(b.dollars)}
            className={`link ${selectedId === id ? "selected" : ""}`}
          />
        );
      })}

      {/* points: unselected first so the selected one draws on top */}
      {[...points]
        .sort((a, b) => Number(a.id === selectedId) - Number(b.id === selectedId))
        .map((p) => {
          const sel = p.id === selectedId;
          return (
            <g
              key={`${p.series}:${p.id}`}
              className={`pt pt-${p.series} ${sel ? "selected" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelect?.(p.id);
              }}
            >
              {/* big invisible hit target for fingers */}
              <circle cx={sx(p.yum)} cy={sy(p.dollars)} r={14} className="hit" />
              <circle cx={sx(p.yum)} cy={sy(p.dollars)} r={sel ? 7 : 5.5} className="dot" />
              {(showLabels || sel) && (
                <text x={sx(p.yum)} y={sy(p.dollars) - 10} textAnchor="middle" className="pt-label">
                  {p.label.length > 22 ? p.label.slice(0, 21) + "…" : p.label}
                </text>
              )}
            </g>
          );
        })}
    </svg>
  );
}
