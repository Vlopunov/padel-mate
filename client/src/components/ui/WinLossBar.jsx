import React from 'react';
import { COLORS } from '../../config';

export function WinLossBar({ wins = 0, losses = 0 }) {
  const total = wins + losses;
  if (total === 0) return null;

  const winPct = (wins / total) * 100;
  const lossPct = (losses / total) * 100;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.accent }}>{wins} W</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.danger }}>{losses} L</span>
      </div>
      <div style={{
        display: 'flex', height: 28, borderRadius: 8, overflow: 'hidden',
        background: COLORS.surface,
      }}>
        {wins > 0 && (
          <div style={{
            width: `${winPct}%`, background: COLORS.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'width 0.3s',
          }}>
            {winPct >= 15 && (
              <span style={{ fontSize: 11, fontWeight: 700, color: '#000' }}>{Math.round(winPct)}%</span>
            )}
          </div>
        )}
        {losses > 0 && (
          <div style={{
            width: `${lossPct}%`, background: COLORS.danger,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'width 0.3s',
          }}>
            {lossPct >= 15 && (
              <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{Math.round(lossPct)}%</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
