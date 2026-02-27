import React, { useEffect, useState } from 'react';
import { COLORS, CITIES, getLevel, getXpLevel } from '../config';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Header } from '../components/ui/Header';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { RatingChart } from '../components/ui/RatingChart';
import { api } from '../services/api';
import { useTelegram } from '../hooks/useTelegram';

const HAND_LABELS = { RIGHT: 'Правша', LEFT: 'Левша' };
const POSITION_LABELS = { DERECHA: 'Derecha', REVES: 'Revés', BOTH: 'Обе' };

export function PlayerProfile({ userId, currentUser, onBack, onNavigate }) {
  const { openTelegramLink } = useTelegram();
  const [player, setPlayer] = useState(null);
  const [stats, setStats] = useState(null);
  const [allAchievements, setAllAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  async function loadProfile() {
    setLoading(true);
    try {
      const [playerData, statsData, allAch] = await Promise.all([
        api.users.getById(userId),
        api.users.getStats(userId),
        api.achievements.all(),
      ]);
      setPlayer(playerData);
      setStats(statsData);
      setAllAchievements(allAch);
    } catch (err) {
      console.error('PlayerProfile load error:', err);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div style={{ paddingBottom: 80 }}>
        <Header title="Профиль" />
        <p style={{ textAlign: 'center', color: COLORS.textDim, padding: 40 }}>Загрузка...</p>
      </div>
    );
  }

  if (!player) {
    return (
      <div style={{ paddingBottom: 80 }}>
        <Header
          title="Профиль"
          leftAction={
            <button onClick={onBack} style={backBtnStyle}>
              {'\u2190'}
            </button>
          }
        />
        <div style={{ textAlign: 'center', padding: 40 }}>
          <span style={{ fontSize: 48 }}>{'\u{1F6AB}'}</span>
          <p style={{ color: COLORS.textDim, marginTop: 12 }}>Игрок не найден</p>
        </div>
      </div>
    );
  }

  const level = getLevel(player.rating);
  const xp = getXpLevel(player.xp || 0);
  const winRate = stats?.winRate || 0;
  const unlockedIds = new Set((stats?.achievements || []).map((a) => a.id));
  const cityLabel = CITIES.find((c) => c.value === player.city)?.label;
  const isMe = currentUser?.id === player.id;

  return (
    <div style={{ paddingBottom: 80 }}>
      <Header
        title={isMe ? 'Мой профиль' : 'Профиль игрока'}
        leftAction={
          <button onClick={onBack} style={backBtnStyle}>
            {'\u2190'}
          </button>
        }
      />

      {/* Avatar + Name */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <Avatar
          src={player.photoUrl}
          name={player.firstName}
          size={80}
          style={{ margin: '0 auto 12px' }}
        />
        <h2 style={{ fontSize: 22, fontWeight: 800, color: COLORS.text, margin: 0 }}>
          {player.firstName} {player.lastName || ''}
        </h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          <Badge variant="accent">{level.level} — {level.name}</Badge>
          {cityLabel && <Badge>{cityLabel}</Badge>}
          {player.hand && <Badge>{HAND_LABELS[player.hand]}</Badge>}
          {player.position && <Badge>{POSITION_LABELS[player.position]}</Badge>}
        </div>
      </div>

      {/* Rating chart */}
      <Card style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>Динамика рейтинга</p>
        {stats?.ratingHistory?.length >= 2 ? (
          <RatingChart data={stats.ratingHistory} currentRating={player.rating} />
        ) : (
          <p style={{ fontSize: 13, color: COLORS.textDim, textAlign: 'center', padding: 20 }}>
            Недостаточно данных для графика
          </p>
        )}
      </Card>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
        <Card style={{ textAlign: 'center', padding: 12 }}>
          <p style={{ fontSize: 22, fontWeight: 800, color: COLORS.text }}>{player.matchesPlayed || 0}</p>
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

      {/* W/L balance */}
      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 20, fontWeight: 700, color: COLORS.accent }}>{player.wins || 0}</p>
            <p style={{ fontSize: 12, color: COLORS.textDim }}>Побед</p>
          </div>
          <div style={{
            width: 1, height: 32, background: COLORS.border,
          }} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 20, fontWeight: 700, color: COLORS.danger }}>{player.losses || 0}</p>
            <p style={{ fontSize: 12, color: COLORS.textDim }}>Поражений</p>
          </div>
          <div style={{
            width: 1, height: 32, background: COLORS.border,
          }} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 20, fontWeight: 700, color: COLORS.purple }}>{stats?.maxWinStreak || 0}</p>
            <p style={{ fontSize: 12, color: COLORS.textDim }}>Макс. серия</p>
          </div>
        </div>
      </Card>

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
          <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.accent }}>{player.xp || 0} XP</span>
        </div>
        {xp.next && (
          <>
            <ProgressBar progress={xp.progress} />
            <p style={{ fontSize: 11, color: COLORS.textDim, marginTop: 4, textAlign: 'right' }}>
              До {xp.next.icon} {xp.next.name}: {xp.next.min - (player.xp || 0)} XP
            </p>
          </>
        )}
      </Card>

      {/* Achievements */}
      {allAchievements.length > 0 && (
        <>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 10 }}>Достижения</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {allAchievements.map((a) => {
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
        </>
      )}

      {/* Match history */}
      {stats?.matchHistory?.length > 0 && (
        <>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 10 }}>
            История матчей
          </h3>
          {stats.matchHistory.slice(0, 10).map((match) => {
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
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, color: COLORS.textDim }}>
                      {new Date(match.date).toLocaleDateString('ru-RU')}
                    </p>
                    <p style={{ fontSize: 13, color: COLORS.text, marginTop: 2 }}>
                      {renderTeamNames(team1, onNavigate, userId)}{' vs '}{renderTeamNames(team2, onNavigate, userId)}
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

      {/* Telegram DM button */}
      <div style={{ marginTop: 16 }}>
        {player.username && !isMe ? (
          <Button
            fullWidth
            variant="outline"
            size="lg"
            onClick={() => openTelegramLink(`https://t.me/${player.username}`)}
          >
            {'\u{1F4AC}'} Написать в Telegram
          </Button>
        ) : !isMe ? (
          <Button fullWidth variant="secondary" size="lg" disabled>
            Username скрыт
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function renderTeamNames(players, onNavigate, currentProfileId) {
  return players.map((p, idx) => {
    const isCurrentProfile = p.user.id === currentProfileId;
    return (
      <React.Fragment key={p.user.id}>
        {idx > 0 && ' & '}
        {isCurrentProfile ? (
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

const backBtnStyle = {
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
};
