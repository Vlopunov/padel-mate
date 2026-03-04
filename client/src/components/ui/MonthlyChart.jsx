import React from 'react';
import { COLORS } from '../../config';

const MONTH_NAMES = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

export function MonthlyChart({ data = [] }) {
  if (!data.length || data.every(d => d.matches === 0)) return null;

  const maxMatches = Math.max(...data.map(d => d.matches), 1);
  const W = 400;
  const H = 180;
  const padTop = 28;
  const padBottom = 40;
  const padLeft = 16;
  const padRight = 16;
  const chartW = W - padLeft - padRight;
  const chartH = H - padTop - padBottom;
  const barWidth = Math.min(40, (chartW / data.length) * 0.6);
  const gap = chartW / data.length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      {/* Grid lines */}
      {[0, 0.5, 1].map((pct) => {
        const y = padTop + chartH * (1 - pct);
        return (
          <line
            key={pct}
            x1={padLeft} x2={W - padRight}
            y1={y} y2={y}
            stroke={COLORS.border} strokeWidth={0.5} strokeDasharray="4,4"
          />
        );
      })}

      {data.map((d, i) => {
        const cx = padLeft + gap * i + gap / 2;
        const totalH = (d.matches / maxMatches) * chartH;
        const winH = d.matches > 0 ? (d.wins / d.matches) * totalH : 0;
        const lossH = totalH - winH;
        const barX = cx - barWidth / 2;
        const barY = padTop + chartH - totalH;

        const monthIdx = parseInt(d.month.split('-')[1]) - 1;

        return (
          <g key={d.month}>
            {/* Loss bar (bottom part = red) */}
            {lossH > 0 && (
              <rect
                x={barX} y={barY + winH}
                width={barWidth} height={lossH}
                rx={lossH === totalH ? 4 : 0}
                fill={COLORS.danger}
                opacity={0.8}
              />
            )}
            {/* Win bar (top part = green) */}
            {winH > 0 && (
              <rect
                x={barX} y={barY}
                width={barWidth} height={winH}
                rx={4}
                fill={COLORS.accent}
                opacity={0.9}
              />
            )}
            {/* Match count above bar */}
            {d.matches > 0 && (
              <text
                x={cx} y={barY - 5}
                textAnchor="middle" fontSize={10} fontWeight={700}
                fill={COLORS.text}
              >
                {d.matches}
              </text>
            )}
            {/* Rating change below bar */}
            {d.ratingChange !== 0 && (
              <text
                x={cx} y={padTop + chartH + 14}
                textAnchor="middle" fontSize={9} fontWeight={600}
                fill={d.ratingChange > 0 ? COLORS.accent : COLORS.danger}
              >
                {d.ratingChange > 0 ? '+' : ''}{d.ratingChange}
              </text>
            )}
            {/* Month label */}
            <text
              x={cx} y={H - 6}
              textAnchor="middle" fontSize={11} fontWeight={500}
              fill={COLORS.textDim}
            >
              {MONTH_NAMES[monthIdx]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
