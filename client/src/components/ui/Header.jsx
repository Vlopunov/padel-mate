import React from 'react';
import { COLORS } from '../../config';

export function Header({ title, subtitle, leftAction, rightAction }) {
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
