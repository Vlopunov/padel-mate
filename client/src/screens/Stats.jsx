import React, { useEffect, useState } from 'react';
import { COLORS, getLevel, getXpLevel } from '../config';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Header } from '../components/ui/Header';
import { ProgressBar } from '../components/ui/ProgressBar';
import { FilterTabs } from '../components/ui/ToggleGroup';
import { api } from '../services/api';

function RatingChart({ data, currentRating }) {
  if (!data || data.length < 2) return null;

  const ratings = data.map((d) => d.newRating).reverse();
  const lastChange = data[0]?.change || 0;

  // Nice rounded axis bounds
  const rawMin = Math.min(...ratings);
  const rawMax = Math.max(...ratings);
  const range = rawMax - rawMin || 40;
  const step = range <= 30 ? 10 : range <= 80 ? 20 : range <= 200 ? 50 : 100;
  const minR = Math.floor((rawMin - 10) / step) * step;
  const maxR = Math.ceil((rawMax + 10) / step) * step;

  const width = 400;
  const height = 180;
  const padding = { top: 16, right: 16, bottom: 24, left: 52 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = ratings.map((r, i) => {
    const x = padding.left + (i / (ratings.length - 1)) * chartW;
    const y = padding.top + chartH - ((r - minR) / (maxR - minR)) * chartH;
    return { x, y, r };
  });

  // Smooth curve using cardinal spline
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    pathD += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  const areaD = pathD + ` L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;

  // Y-axis ticks (3–5 nice values)
  const ticks = [];
  for (let v = minR; v <= maxR; v += step) {
    ticks.push(v);
  }

  return (
    <div>
      {/* Current rating header */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 32, fontWeight: 800, color: COLORS.text }}>{currentRating || ratings[ratings.length - 1]}</span>
        {lastChange !== 0 && (
          <span style={{
            fontSize: 15, fontWeight: 700,
            color: lastChange > 0 ? COLORS.accent : COLORS.danger,
          }}>
            {lastChange > 0 ? '+' : ''}{lastChange}
          </span>
        )}
      </div>

      <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
        <defs>
          <linearGradient id="ratingGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.accent} stopOpacity="0.25" />
            <stop offset="100%" stopColor={COLORS.accent} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines + Y-axis labels */}
        {ticks.map((val) => {
          const y = padding.top + chartH - ((val - minR) / (maxR - minR)) * chartH;
          return (
            <g key={val}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y}
                stroke={COLORS.border} strokeWidth="0.5" strokeDasharray="4 3" />
              <text x={padding.left - 8} y={y + 4} fill={COLORS.textMuted}
                fontSize="10" textAnchor="end" fontFamily="system-ui">{val}</text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaD} fill="url(#ratingGrad)" />

        {/* Line */}
        <path d={pathD} fill="none" stroke={COLORS.accent} strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill={COLORS.bg} stroke={COLORS.accent} strokeWidth="2" />
          </g>
        ))}

        {/* Last point highlight */}
        {points.length > 0 && (() => {
          const last = points[points.length - 1];
          return (
            <g>
              <circle cx={last.x} cy={last.y} r="5" fill={COLORS.accent} />
              <text x={last.x} y={last.y - 10} fill={COLORS.accent}
                fontSize="11" fontWeight="700" textAnchor="middle" fontFamily="system-ui">
                {last.r}
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
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
          <RatingChart data={stats.ratingHistory} currentRating={user.rating} />
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
            const setsStr = match.sets?.map((s) => {
              let str = `${s.team1Score}:${s.team2Score}`;
              if (s.team1Tiebreak != null && s.team2Tiebreak != null) str += `(${s.team1Tiebreak}:${s.team2Tiebreak})`;
              return str;
            }).join(', ') || '';

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
