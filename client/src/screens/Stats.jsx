import React, { useEffect, useState } from 'react';
import { COLORS, getLevel, getXpLevel } from '../config';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Header } from '../components/ui/Header';
import { ProgressBar } from '../components/ui/ProgressBar';
import { FilterTabs } from '../components/ui/ToggleGroup';
import { RatingChart } from '../components/ui/RatingChart';
import { api } from '../services/api';

const CATEGORY_LABELS = {
  all: 'Все',
  matches: 'Матчи',
  wins: 'Победы',
  rating: 'Рейтинг',
  social: 'Социальные',
  tournaments: 'Турниры',
};

export function Stats({ user, onBack, onNavigate }) {
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

  // Use XP from stats response (freshly checked) rather than stale user prop
  const freshXp = stats?.xp ?? user.xp ?? 0;
  const xp = getXpLevel(freshXp);
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
          <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.accent }}>{freshXp} XP</span>
        </div>
        {xp.next && (
          <>
            <ProgressBar progress={xp.progress} />
            <p style={{ fontSize: 11, color: COLORS.textDim, marginTop: 4, textAlign: 'right' }}>
              До {xp.next.icon} {xp.next.name}: {xp.next.min - freshXp} XP
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
            const hasTeams = match.players?.some((p) => p.team != null);
            const team1 = hasTeams ? (match.players?.filter((p) => p.team === 1) || []) : [];
            const team2 = hasTeams ? (match.players?.filter((p) => p.team === 2) || []) : [];
            const unassigned = !hasTeams ? (match.players || []) : [];
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
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, color: COLORS.textDim }}>
                      {new Date(match.date).toLocaleDateString('ru-RU')}
                    </p>
                    <p style={{ fontSize: 13, color: COLORS.text, marginTop: 2 }}>
                      {hasTeams ? (
                        <>{renderClickableTeam(team1, user.id, onNavigate)} vs {renderClickableTeam(team2, user.id, onNavigate)}</>
                      ) : (
                        renderClickableTeam(unassigned, user.id, onNavigate)
                      )}
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
                        marginLeft: 8,
                        flexShrink: 0,
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

function renderClickableTeam(players, currentUserId, onNavigate) {
  return players.map((p, idx) => {
    const isMe = p.user.id === currentUserId;
    return (
      <React.Fragment key={p.user.id}>
        {idx > 0 && ' & '}
        {isMe ? (
          <span style={{ fontWeight: 600 }}>{p.user.firstName}</span>
        ) : (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('playerProfile', { userId: p.user.id });
            }}
            style={{
              fontWeight: 600,
              color: COLORS.accent,
              cursor: 'pointer',
              textDecoration: 'underline',
              textDecorationColor: `${COLORS.accent}40`,
              textUnderlineOffset: 2,
            }}
          >
            {p.user.firstName}
          </span>
        )}
      </React.Fragment>
    );
  });
}
