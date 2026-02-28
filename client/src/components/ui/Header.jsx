import React from 'react';
import { COLORS } from '../../config';

export function Header({ title, subtitle, onBack, leftAction, rightAction }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 0',
        marginBottom: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 10,
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 16,
              color: COLORS.text,
              flexShrink: 0,
            }}
          >
            {'\u2190'}
          </button>
        )}
        {leftAction}
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: COLORS.text }}>{title}</h2>
          {subtitle && <p style={{ fontSize: 13, color: COLORS.textDim, marginTop: 2 }}>{subtitle}</p>}
        </div>
      </div>
      {rightAction}
    </div>
  );
}
