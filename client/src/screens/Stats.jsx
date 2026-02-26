import React, { useEffect, useState } from 'react';
import { COLORS, getLevel, getXpLevel } from '../config';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Header } from '../components/ui/Header';
import { ProgressBar } from '../components/ui/ProgressBar';
import { FilterTabs } from '../components/ui/ToggleGroup';
import { api } from '../services/api';

function RatingChart({ data }) {
  if (!data || data.length < 2) return null;

  const width = 360;
  const height = 140;
  const padding = { top: 10, right: 10, bottom: 20, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const ratings = data.map((d) => d.newRating).reverse();
  const minR = Math.min(...ratings) - 20;
  const maxR = Math.max(...ratings) + 20;

  const points = ratings.map((r, i) => {
    const x = padding.left + (i / (ratings.length - 1)) * chartW;
    const y = padding.top + chartH - ((r - minR) / (maxR - minR)) * chartH;
    return { x, y, r };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = pathD + ` L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COLORS.accent} stopOpacity="0.3" />
          <stop offset="100%" stopColor={COLORS.accent} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
        const y = padding.top + chartH * (1 - pct);
        const val = Math.round(minR + (maxR - minR) * pct);
        return (
          <g key={pct}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke={COLORS.border} strokeWidth="0.5" />
            <text x={padding.left - 4} y={y + 3} fill={COLORS.textMuted} fontSize="9" textAnchor="end">{val}</text>
          </g>
        );
      })}

      {/* Area */}
      <path d={areaD} fill="url(#chartGrad)" />

      {/* Line */}
      <path d={pathD} fill="none" stroke={COLORS.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={COLORS.accent} />
      ))}
    </svg>
  );
}

const CATEGORY_LABELS = {
  all: 'Все',
  matches: 'Матчи',
  wins: 'Победы',
  rating: 'Рейтинг',
  social: 'Социальные',
  tournaments: 'Турниры',
};

export function Stats({ user, onBack }) {
  const [stats, setStats] = useState(null);
  const [allAchievements, setAllAchievements] = useState([]);
  const [myAchievements, setMyAchievements] = useState([]);
  const [achievementFilter, setAchievementFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [statsData, allAch, myAch] = await Promise.all([
        api.users.getStats(user.id),
        api.achievements.all(),
        api.achievements.my(),
      ]);
      setStats(statsData);
      setAllAchievements(allAch);
      setMyAchievements(myAch);
    } catch (err) {
      console.error('Stats load error:', err);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div style={{ paddingBottom: 80 }}>
        <Header title="Статистика" />
        <p style={{ textAlign: 'center', color: COLORS.textDim, padding: 40 }}>Загрузка...</p>
      </div>
    );
  }

  const xp = getXpLevel(user.xp || 0);
  const winRate = stats?.winRate || 0;
  const unlockedIds = new Set(myAchievements.map((a) => a.id));

  const filteredAchievements = achievementFilter === 'all'
    ? allAchievements
    : allAchievements.filter((a) => a.category === achievementFilter);

  return (
    <div style={{ paddingBottom: 80 }}>
      <Header
        title="Статистика"
        subtitle="Прогресс и достижения"
        leftAction={
          <button
            onClick={onBack}
            style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 10,
              width: 32,
              height: 32,
              cursor: 'pointer',
              color: COLORS.textDim,
              fontSize: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {'\u2190'}
          </button>
        }
      />

      {/* Rating chart */}
      <Card style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>Динамика рейтинга</p>
        {stats?.ratingHistory?.length >= 2 ? (
          <RatingChart data={stats.ratingHistory} />
        ) : (
          <p style={{ fontSize: 13, color: COLORS.textDim, textAlign: 'center', padding: 20 }}>
            Недостаточно данных для графика
          </p>
        )}
      </Card>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
        <Card style={{ textAlign: 'center', padding: 12 }}>
          <p style={{ fontSize: 22, fontWeight: 800, color: COLORS.text }}>{stats?.matchesPlayed || 0}</p>
          <p style={{ fontSize: 11, color: COLORS.textDim }}>Матчей</p>
        </Card>
        <Card style={{ textAlign: 'center', padding: 12 }}>
          <p style={{ fontSize: 22, fontWeight: 800, color: COLORS.accent }}>{winRate}%</p>
          <p style={{ fontSize: 11, color: COLORS.textDim }}>Побед</p>
        </Card>
        <Card style={{ textAlign: 'center', padding: 12 }}>
          <p style={{ fontSize: 22, fontWeight: 800, color: COLORS.warning }}>{stats?.winStreak || 0}</p>
          <p style={{ fontSize: 11, color: COLORS.textDim }}>Серия</p>
        </Card>
      </div>

      {/* XP Level */}
      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 24 }}>{xp.current.icon}</span>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>{xp.current.name}</p>
              <p style={{ fontSize: 12, color: COLORS.textDim }}>
                {unlockedIds.size} / {allAchievements.length} достижений
              </p>
            </div>
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.accent }}>{user.xp || 0} XP</span>
        </div>
        {xp.next && (
          <>
            <ProgressBar progress={xp.progress} />
            <p style={{ fontSize: 11, color: COLORS.textDim, marginTop: 4, textAlign: 'right' }}>
              До {xp.next.icon} {xp.next.name}: {xp.next.min - (user.xp || 0)} XP
            </p>
          </>
        )}
      </Card>

      {/* Achievements */}
      <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 10 }}>Достижения</h3>

      <FilterTabs
        options={Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }))}
        value={achievementFilter}
        onChange={setAchievementFilter}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
        {filteredAchievements.map((a) => {
          const unlocked = unlockedIds.has(a.id);
          return (
            <Card
              key={a.id}
              style={{
                padding: 12,
                opacity: unlocked ? 1 : 0.4,
                borderColor: unlocked ? `${COLORS.accent}44` : COLORS.border,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 20 }}>{a.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>{a.name}</span>
              </div>
              <p style={{ fontSize: 11, color: COLORS.textDim }}>{a.description}</p>
              <Badge
                variant={unlocked ? 'accent' : 'default'}
                style={{ marginTop: 6, fontSize: 10 }}
              >
                +{a.xp} XP
              </Badge>
            </Card>
          );
        })}
      </div>

      {/* Match history */}
      {stats?.matchHistory?.length > 0 && (
        <>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginTop: 20, marginBottom: 10 }}>
            История матчей
          </h3>
          {stats.matchHistory.map((match) => {
            const team1 = match.players?.filter((p) => p.team === 1) || [];
            const team2 = match.players?.filter((p) => p.team === 2) || [];
            const setsStr = match.sets?.map((s) => `${s.team1Score}:${s.team2Score}`).join(', ') || '';

            // Find rating change for this match
            const ratingChange = stats.ratingHistory?.find((r) => r.matchId === match.id);

            return (
              <Card key={match.id} style={{ marginBottom: 6, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 12, color: COLORS.textDim }}>
                      {new Date(match.date).toLocaleDateString('ru-RU')}
                    </p>
                    <p style={{ fontSize: 13, color: COLORS.text, marginTop: 2 }}>
                      {team1.map((p) => p.user.firstName).join(' & ')} vs {team2.map((p) => p.user.firstName).join(' & ')}
                    </p>
                    {setsStr && (
                      <p style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginTop: 2 }}>{setsStr}</p>
                    )}
                  </div>
                  {ratingChange && (
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: ratingChange.change > 0 ? COLORS.accent : COLORS.danger,
                      }}
                    >
                      {ratingChange.change > 0 ? '+' : ''}{ratingChange.change}
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
}
