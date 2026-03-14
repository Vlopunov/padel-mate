import React from 'react';
import { Home, CircleDot, Trophy, BarChart3, User } from 'lucide-react';
import { COLORS } from '../../config';

const tabs = [
  { id: 'home', Icon: Home, label: 'Главная' },
  { id: 'matches', Icon: CircleDot, label: 'Матчи' },
  { id: 'tournaments', Icon: Trophy, label: 'Турниры' },
  { id: 'leaderboard', Icon: BarChart3, label: 'Рейтинг' },
  { id: 'profile', Icon: User, label: 'Профиль' },
];

export function TabBar({ activeTab, onTabChange }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: COLORS.card,
        borderTop: `1px solid ${COLORS.border}`,
        display: 'flex',
        justifyContent: 'space-around',
        padding: '8px 0',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        zIndex: 100,
        maxWidth: 420,
        margin: '0 auto',
      }}
    >
      {tabs.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '4px 8px',
              WebkitTapHighlightColor: 'transparent',
              minWidth: 56,
            }}
          >
            <tab.Icon
              size={22}
              color={active ? COLORS.accent : COLORS.textMuted}
              strokeWidth={active ? 2.5 : 1.8}
              style={{
                transition: 'all 0.2s',
                transform: active ? 'scale(1.1)' : 'scale(1)',
              }}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: active ? 700 : 500,
                color: active ? COLORS.accent : COLORS.textMuted,
                transition: 'color 0.2s',
              }}
            >
              {tab.label}
            </span>
            {active && (
              <div style={{
                width: 4, height: 4, borderRadius: 2,
                background: COLORS.accent, marginTop: 1,
              }} />
            )}
          </button>
        );
      })}
    </div>
  );
}
