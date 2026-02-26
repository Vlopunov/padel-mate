import React from 'react';
import { COLORS } from '../../config';

export function Badge({ children, variant = 'default', style }) {
  const variants = {
    default: { background: `${COLORS.textMuted}30`, color: COLORS.textDim },
    accent: { background: COLORS.accentGlow, color: COLORS.accent },
    warning: { background: `${COLORS.warning}20`, color: COLORS.warning },
    danger: { background: `${COLORS.danger}20`, color: COLORS.danger },
    purple: { background: `${COLORS.purple}20`, color: COLORS.purple },
    success: { background: `${COLORS.accent}20`, color: COLORS.accent },
  };

  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 10px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    ...(variants[variant] || variants.default),
    ...style,
  };

  return <span style={base}>{children}</span>;
}
