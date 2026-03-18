import React, { useEffect, useState } from 'react';
import { BarChart3, Star } from 'lucide-react';
import { COLORS, getLevel } from '../config';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Header } from '../components/ui/Header';
import { FilterTabs } from '../components/ui/ToggleGroup';
import { api } from '../services/api';

const HAND_LABELS = { RIGHT: 'Правша', LEFT: 'Левша' };
const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

export function Leaderboard({ user, onNavigate }) {
  const [period, setPeriod] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [regionId, setRegionId] = useState('all');
  const [countries, setCountries] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.regions.list().then((data) => {
      const list = data.countries || [];
      setCountries(list);
      // Initialize filters from user's regionId
      if (user?.regionId && list.length) {
        const found = list.find(c => c.regions.some(r => r.id === user.regionId));
        if (found) {
          setCountryFilter(String(found.id));
          if (found.regions.length > 1) {
            setRegionId(String(user.regionId));
          }
        }
      }
    });
  }, []);

  // Get regions for selected country
  const selectedCountryObj = countries.find((c) => String(c.id) === countryFilter);
  const countryRegions = selectedCountryObj?.regions || [];
  const showRegionFilter = countryFilter !== 'all' && countryRegions.length > 1;

  useEffect(() => {
    loadLeaderboard();
  }, [period, regionId, countryFilter]);

  async function loadLeaderboard() {
    setLoading(true);
    try {
      const params = {};
      if (period !== 'all') params.period = period;
      if (regionId !== 'all') {
        params.regionId = regionId;
      } else if (countryFilter !== 'all' && countryRegions.length === 1) {
        params.regionId = String(countryRegions[0].id);
      }
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

      {/* Country & Region dropdowns */}
      <div style={{ display: 'flex', gap: 8, marginTop: 10, marginBottom: 16 }}>
        <select
          value={countryFilter}
          onChange={(e) => { setCountryFilter(e.target.value); setRegionId('all'); }}
          style={{
            flex: 1,
            padding: '8px 32px 8px 10px',
            borderRadius: 12,
            border: `1px solid ${COLORS.border}`,
            background: COLORS.surface,
            color: COLORS.text,
            fontSize: 13,
            fontFamily: 'inherit',
            fontWeight: 600,
            outline: 'none',
            appearance: 'none',
            WebkitAppearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%237A8299' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 10px center',
          }}
        >
          <option value="all">Все страны</option>
          {countries.map(c => (
            <option key={c.id} value={String(c.id)}>{c.flag} {c.name}</option>
          ))}
        </select>
        {showRegionFilter && (
          <select
            value={regionId}
            onChange={(e) => setRegionId(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 32px 8px 10px',
              borderRadius: 12,
              border: `1px solid ${COLORS.border}`,
              background: COLORS.surface,
              color: COLORS.text,
              fontSize: 13,
              fontFamily: 'inherit',
              fontWeight: 600,
              outline: 'none',
              appearance: 'none',
              WebkitAppearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%237A8299' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 10px center',
            }}
          >
            <option value="all">Все города</option>
            {countryRegions.map(r => (
              <option key={r.id} value={String(r.id)}>{r.name}</option>
            ))}
          </select>
        )}
      </div>

      {loading && <p style={{ textAlign: 'center', color: COLORS.textDim, padding: 40 }}>Загрузка...</p>}

      {!loading && players.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <BarChart3 size={48} color={COLORS.textDim} />
          <p style={{ color: COLORS.textDim, marginTop: 12 }}>Рейтинг пока пуст</p>
        </div>
      )}

      {/* Top 3 Podium */}
      {!loading && players.length >= 3 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 8, marginBottom: 24, padding: '0 12px' }}>
          {players.slice(0, 3).map((p, idx) => {
            const place = idx + 1;
            const podiumHeight = place === 1 ? 44 : place === 2 ? 28 : 16;
            const avatarSize = place === 1 ? 72 : 56;
            const badgeSize = place === 1 ? 32 : 26;
            const badgeBg = MEDAL_COLORS[idx];
            return (
              <div
                key={p.id}
                onClick={() => openProfile(p)}
                style={{
                  textAlign: 'center',
                  cursor: 'pointer',
                  order: place === 1 ? 1 : place === 2 ? 0 : 2,
                  flex: 1,
                  maxWidth: place === 1 ? 130 : 110,
                }}
              >
                {/* Avatar + badge */}
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: 8 }}>
                  <div style={{
                    borderRadius: '50%',
                    padding: 3,
                    background: `linear-gradient(135deg, ${badgeBg}44, ${badgeBg})`,
                    display: 'inline-block',
                  }}>
                    <Avatar src={p.photoUrl} name={p.firstName} size={avatarSize} />
                  </div>
                  {/* Place badge */}
                  <div style={{
                    position: 'absolute',
                    bottom: -6,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: badgeSize,
                    height: badgeSize,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${badgeBg}, ${badgeBg}cc)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: place === 1 ? 16 : 13,
                    fontWeight: 900,
                    color: '#000',
                    border: `3px solid ${COLORS.bg}`,
                    boxShadow: `0 2px 10px ${badgeBg}88`,
                  }}>
                    {place}
                  </div>
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.firstName}</p>
                <p style={{ fontSize: place === 1 ? 18 : 15, fontWeight: 800, color: COLORS.accent }}>{p.rating}</p>
                {/* Podium bar */}
                <div style={{
                  height: podiumHeight,
                  borderRadius: '8px 8px 0 0',
                  background: `linear-gradient(180deg, ${badgeBg}33, ${badgeBg}11)`,
                  border: `1px solid ${badgeBg}44`,
                  borderBottom: 'none',
                  marginTop: 4,
                }} />
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
                        display: 'inline-flex', alignItems: 'center', gap: 2,
                      }}><Star size={10} fill={COLORS.gold} /> VIP</span>
                    )}
                    {p.hand && <Badge style={{ fontSize: 10, padding: '2px 6px' }}>{HAND_LABELS[p.hand]}</Badge>}
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                    <Badge style={{ fontSize: 10, padding: '2px 6px' }}>
                      {p.region?.country?.flag ? `${p.region.country.flag} ` : ''}{p.region?.name}
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
