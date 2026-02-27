import React from 'react';
import { COLORS } from '../../config';

export function MiniChart({ data, color = COLORS.accent, height = 120, label }) {
  if (!data || data.length < 2) {
    return (
      <div style={{ textAlign: 'center', padding: 20, color: COLORS.textDim, fontSize: 13 }}>
        Недостаточно данных для графика
      </div>
    );
  }

  const values = data.map((d) => d.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const range = rawMax - rawMin || 1;

  const minV = rawMin - range * 0.1;
  const maxV = rawMax + range * 0.1;

  const width = 400;
  const padding = { top: 20, right: 12, bottom: 28, left: 44 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = values.map((v, i) => ({
    x: padding.left + (i / (values.length - 1)) * chartW,
    y: padding.top + chartH - ((v - minV) / (maxV - minV)) * chartH,
    v,
  }));

  // Build smooth cubic bezier path
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    pathD += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  // Area fill path
  const areaD =
    pathD +
    ` L ${points[points.length - 1].x} ${height - padding.bottom}` +
    ` L ${points[0].x} ${height - padding.bottom} Z`;

  const gradientId = `miniGrad-${(label || 'default').replace(/\s/g, '')}-${color.replace('#', '')}`;

  // Y-axis: 3 labels (min, mid, max)
  const yMin = Math.floor(rawMin);
  const yMax = Math.ceil(rawMax);
  const yMid = Math.round((yMin + yMax) / 2);
  const yLabels = [yMin, yMid, yMax];

  // X-axis: first, middle, last labels
  const xIndices = [0, Math.floor(data.length / 2), data.length - 1];

  return (
    <div>
      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {yLabels.map((val, i) => {
          const y = padding.top + chartH - ((val - minV) / (maxV - minV)) * chartH;
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke={COLORS.border}
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 6}
                y={y + 3}
                fill={COLORS.textMuted}
                fontSize="9"
                textAnchor="end"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaD} fill={`url(#${gradientId})`} />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Last point dot */}
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="4"
          fill={color}
        />

        {/* Last value label */}
        <text
          x={points[points.length - 1].x}
          y={points[points.length - 1].y - 8}
          fill={color}
          fontSize="11"
          fontWeight="700"
          textAnchor="middle"
        >
          {values[values.length - 1]}
        </text>

        {/* X-axis labels */}
        {xIndices.map((i) => (
          <text
            key={i}
            x={points[i].x}
            y={height - 4}
            fill={COLORS.textMuted}
            fontSize="9"
            textAnchor="middle"
          >
            {data[i].label}
          </text>
        ))}
      </svg>
    </div>
  );
}
