import React from 'react';
import { COLORS } from '../../config';

export function Checkbox({ checked, onChange, label }) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        cursor: 'pointer',
        marginBottom: 12,
        fontSize: 15,
        color: COLORS.text,
        WebkitTapHighlightColor: 'transparent',
      }}
      onClick={() => onChange(!checked)}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          border: `2px solid ${checked ? COLORS.accent : COLORS.border}`,
          background: checked ? COLORS.accent : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s',
          flexShrink: 0,
        }}
      >
        {checked && (
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
            <path d="M1 5L4.5 8.5L11 1.5" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      {label}
    </label>
  );
}
