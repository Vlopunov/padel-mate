import React from 'react';
import { COLORS } from '../../config';

export function Card({ children, style, onClick, variant, glow }) {
  const variants = {
    default: { background: COLORS.card },
    accent: { background: COLORS.accentGlow, border: `1px solid ${COLORS.accent}33` },
    warning: { background: `${COLORS.warning}15`, border: `1px solid ${COLORS.warning}33` },
    purple: { background: `${COLORS.purple}15`, border: `1px solid ${COLORS.purple}33` },
    danger: { background: `${COLORS.danger}15`, border: `1px solid ${COLORS.danger}33` },
    surface: { background: COLORS.surface },
  };

  const base = {
    borderRadius: 18,
    padding: 16,
    border: `1px solid ${COLORS.border}`,
    cursor: onClick ? 'pointer' : 'default',
    transition: 'transform 0.15s, box-shadow 0.15s',
    ...(glow ? { boxShadow: `0 0 20px ${COLORS.accent}20` } : {}),
    ...(variants[variant] || variants.default),
    ...style,
  };

  return (
    <div style={base} onClick={onClick}>
      {children}
    </div>
  );
}
