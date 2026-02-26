import React from 'react';
import { COLORS } from '../../config';

export function ToggleGroup({ options, value, onChange, allowDeselect = false }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => {
              if (active && allowDeselect) onChange(null);
              else onChange(opt.value);
            }}
            style={{
              padding: '8px 16px',
              borderRadius: 14,
              border: `1px solid ${active ? COLORS.accent : COLORS.border}`,
              background: active ? COLORS.accentGlow : COLORS.surface,
              color: active ? COLORS.accent : COLORS.textDim,
              fontSize: 14,
              fontWeight: active ? 600 : 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function FilterTabs({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              padding: '8px 16px',
              borderRadius: 12,
              border: 'none',
              background: active ? COLORS.accent : COLORS.surface,
              color: active ? '#000' : COLORS.textDim,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
