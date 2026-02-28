import React, { useId } from 'react';
import { COLORS } from '../../config';

export function RatingChart({ data, currentRating }) {
  const uniqueId = useId();
  if (!data || data.length < 2) return null;

  // Sort chronologically (data comes DESC from API) and deduplicate by timestamp
  const sorted = [...data].reverse();
  const seen = new Set();
  const unique = sorted.filter((d) => {
    const key = `${d.newRating}-${d.createdAt}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // If only 1 unique point, add current rating as second point
  const chartData = unique.length >= 2 ? unique : [unique[0], { newRating: currentRating, change: 0 }];

  const ratings = chartData.map((d) => d.newRating);
  const lastChange = data[0]?.change || 0;

  // Nice rounded axis bounds
  const rawMin = Math.min(...ratings);
  const rawMax = Math.max(...ratings);
  const range = rawMax - rawMin || 40;
  const step = range <= 30 ? 10 : range <= 80 ? 20 : range <= 200 ? 50 : 100;
  const minR = Math.floor((rawMin - 10) / step) * step;
  const maxR = Math.ceil((rawMax + 10) / step) * step;

  const width = 400;
  const height = 180;
  const padding = { top: 16, right: 16, bottom: 24, left: 52 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = ratings.map((r, i) => {
    const x = padding.left + (i / (ratings.length - 1)) * chartW;
    const y = padding.top + chartH - ((r - minR) / (maxR - minR)) * chartH;
    return { x, y, r };
  });

  // Smooth curve using cardinal spline
  let pathD = `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) {
    // Simple line for 2 points — no weird bezier overshoot
    pathD += ` L ${points[1].x} ${points[1].y}`;
  } else {
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      pathD += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
    }
  }
  const areaD = pathD + ` L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;

  // Y-axis ticks (3–5 nice values)
  const ticks = [];
  for (let v = minR; v <= maxR; v += step) {
    ticks.push(v);
  }

  // Unique gradient ID to avoid conflicts when multiple charts on page
  const gradientId = `ratingGrad${uniqueId.replace(/:/g, '')}`;

  return (
    <div>
      {/* Current rating header */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 32, fontWeight: 800, color: COLORS.text }}>{currentRating || ratings[ratings.length - 1]}</span>
        {lastChange !== 0 && (
          <span style={{
            fontSize: 15, fontWeight: 700,
            color: lastChange > 0 ? COLORS.accent : COLORS.danger,
          }}>
            {lastChange > 0 ? '+' : ''}{lastChange}
          </span>
        )}
      </div>

      <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.accent} stopOpacity="0.25" />
            <stop offset="100%" stopColor={COLORS.accent} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines + Y-axis labels */}
        {ticks.map((val) => {
          const y = padding.top + chartH - ((val - minR) / (maxR - minR)) * chartH;
          return (
            <g key={val}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y}
                stroke={COLORS.border} strokeWidth="0.5" strokeDasharray="4 3" />
              <text x={padding.left - 8} y={y + 4} fill={COLORS.textMuted}
                fontSize="10" textAnchor="end" fontFamily="system-ui">{val}</text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaD} fill={`url(#${gradientId})`} />

        {/* Line */}
        <path d={pathD} fill="none" stroke={COLORS.accent} strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill={COLORS.bg} stroke={COLORS.accent} strokeWidth="2" />
          </g>
        ))}

        {/* Last point highlight */}
        {points.length > 0 && (() => {
          const last = points[points.length - 1];
          return (
            <g>
              <circle cx={last.x} cy={last.y} r="5" fill={COLORS.accent} />
              <text x={last.x} y={last.y - 10} fill={COLORS.accent}
                fontSize="11" fontWeight="700" textAnchor="middle" fontFamily="system-ui">
                {last.r}
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
