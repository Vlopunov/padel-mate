import React from 'react';
import { COLORS } from '../../config';

export function Button({ children, onClick, variant = 'primary', disabled, style, fullWidth, size = 'md' }) {
  const variants = {
    primary: {
      background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentDim})`,
      color: '#000',
      fontWeight: 700,
    },
    secondary: {
      background: COLORS.surface,
      color: COLORS.text,
      border: `1px solid ${COLORS.border}`,
    },
    outline: {
      background: 'transparent',
      color: COLORS.accent,
      border: `1px solid ${COLORS.accent}`,
    },
    danger: {
      background: `${COLORS.danger}20`,
      color: COLORS.danger,
      border: `1px solid ${COLORS.danger}44`,
    },
    purple: {
      background: `linear-gradient(135deg, ${COLORS.purple}, #9333EA)`,
      color: '#fff',
      fontWeight: 700,
    },
    ghost: {
      background: 'transparent',
      color: COLORS.textDim,
    },
  };

  const sizes = {
    sm: { padding: '8px 14px', fontSize: 13 },
    md: { padding: '12px 20px', fontSize: 15 },
    lg: { padding: '16px 28px', fontSize: 16 },
  };

  const base = {
    borderRadius: 14,
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'opacity 0.15s, transform 0.1s',
    opacity: disabled ? 0.5 : 1,
    width: fullWidth ? '100%' : 'auto',
    WebkitTapHighlightColor: 'transparent',
    ...sizes[size],
    ...variants[variant],
    ...style,
  };

  return (
    <button
      type="button"
      style={base}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
