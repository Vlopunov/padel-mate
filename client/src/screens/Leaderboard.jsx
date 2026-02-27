import React, { useEffect, useState } from 'react';
import { COLORS, CITIES, getLevel } from '../config';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Header } from '../components/ui/Header';
import { FilterTabs } from '../components/ui/ToggleGroup';
import { api } from '../services/api';

const HAND_LABELS = { RIGHT: 'Правша', LEFT: 'Левша' };

export function Leaderboard({ user, onNavigate }) {
  const [period, setPeriod] = useState('all');
  const [city, setCity] = useState('all');
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [period, city]);

  async function loadLeaderboard() {
    setLoading(true);
    try {
      const params = {};
      if (period !== 'all') params.period = period;
      if (city !== 'all') params.city = city;
      const data = await api.leaderboard.get(params);
      setPlayers(data);
    } catch (err) {
      console.error('Leaderboard error:', err);
    }
    setLoading(false);
  }

  const openProfile = (player) => {
    onNavigate('playerProfile', { userId: player.id });
  };

  const medals = ['\u{1F947}', '\u{1F948}', '\u{1F949}'];

  return (
    <div style={{ paddingBottom: 80 }}>
      <Header title="Рейтинг" subtitle="Лучшие игроки" />

      {/* Period filter */}
      <FilterTabs
        options={[
          { value: 'all', label: 'Общий' },
          { value: 'month', label: 'За месяц' },
          { value: 'week', label: 'За неделю' },
        ]}
        value={period}
        onChange={setPeriod}
      />

      {/* City filter */}
      <div style={{ marginTop: 8, marginBottom: 16 }}>
        <FilterTabs
          options={[
            { value: 'all', label: 'Все города' },
            ...CITIES,
          ]}
          value={city}
          onChange={setCity}
        />
      </div>

      {loading && <p style={{ textAlign: 'center', color: COLORS.textDim, padding: 40 }}>Загрузка...</p>}

      {!loading && players.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <span style={{ fontSize: 48 }}>{'\u{1F4CA}'}</span>
          <p style={{ color: COLORS.textDim, marginTop: 12 }}>Рейтинг пока пуст</p>
        </div>
      )}

      {/* Top 3 */}
      {!loading && players.length >= 3 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
          {players.slice(0, 3).map((p, idx) => {
            const isFirst = idx === 0;
            return (
              <div
                key={p.id}
                onClick={() => openProfile(p)}
                style={{
                  textAlign: 'center',
                  cursor: 'pointer',
                  transform: isFirst ? 'scale(1.1)' : 'none',
                  order: idx === 0 ? 1 : idx === 1 ? 0 : 2,
                }}
              >
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <Avatar src={p.photoUrl} name={p.firstName} size={isFirst ? 64 : 52} />
                  <span style={{ position: 'absolute', bottom: -4, right: -4, fontSize: 20 }}>
                    {medals[idx]}
                  </span>
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, marginTop: 6 }}>{p.firstName}</p>
                <p style={{ fontSize: 16, fontWeight: 800, color: COLORS.accent }}>{p.rating}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* List */}
      {!loading &&
        players.slice(3).map((p) => {
          const level = p.level || getLevel(p.rating);
          const isMe = p.id === user?.id;
          return (
            <Card
              key={p.id}
              onClick={() => openProfile(p)}
              variant={isMe ? 'accent' : 'default'}
              style={{ marginBottom: 6, cursor: 'pointer', padding: 12 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.textDim, width: 28, textAlign: 'center' }}>
                  #{p.position}
                </span>
                <Avatar src={p.photoUrl} name={p.firstName} size={36} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>
                      {p.firstName} {p.lastName || ''}
                    </span>
                    {p.isVip && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '1px 5px',
                        borderRadius: 4, background: `${COLORS.gold}25`, color: COLORS.gold,
                      }}>⭐ VIP</span>
                    )}
                    {p.hand && <Badge style={{ fontSize: 10, padding: '2px 6px' }}>{HAND_LABELS[p.hand]}</Badge>}
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                    <Badge style={{ fontSize: 10, padding: '2px 6px' }}>
                      {CITIES.find((c) => c.value === p.city)?.label}
                    </Badge>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 16, fontWeight: 800, color: COLORS.accent }}>{p.rating}</p>
                  {p.trend !== 0 && (
                    <p style={{ fontSize: 12, color: p.trend > 0 ? COLORS.accent : COLORS.danger }}>
                      {p.trend > 0 ? '+' : ''}{p.trend}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
    </div>
  );
}
