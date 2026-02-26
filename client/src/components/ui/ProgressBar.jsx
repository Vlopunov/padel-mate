import React from 'react';
import { COLORS } from '../../config';

export function ProgressBar({ progress, color = COLORS.accent, height = 6, style }) {
  return (
    <div
      style={{
        width: '100%',
        height,
        borderRadius: height / 2,
        background: `${color}20`,
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          width: `${Math.min(100, Math.max(0, progress * 100))}%`,
          height: '100%',
          borderRadius: height / 2,
          background: color,
          transition: 'width 0.5s ease',
        }}
      />
    </div>
  );
}
