import React, { useEffect, useState } from 'react';
import { COLORS, APP_NAME, TG_CHANNEL, TG_CHAT, getLevel, getLevelByValue, getXpLevel } from '../config';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { ProgressBar } from '../components/ui/ProgressBar';
import { useTelegram } from '../hooks/useTelegram';
import { api } from '../services/api';

export function Home({ user, onNavigate }) {
  const { openTelegramLink } = useTelegram();
  const [matches, setMatches] = useState([]);
  const [pendingMatches, setPendingMatches] = useState([]);
  const [tournament, setTournament] = useState(null);
  const [bookableVenue, setBookableVenue] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    loadData();
  }, [user?.city]);

  async function loadData() {
    try {
      const cityFilter = user?.city || '';
      const [allMatches, tournaments] = await Promise.all([
        api.matches.list({ status: 'recruiting', ...(cityFilter && { city: cityFilter }) }),
        api.tournaments.list({ status: 'registration' }),
      ]);
      setMatches(allMatches.slice(0, 2));

      // Find pending score matches for this user
      const full = await api.matches.list({ status: 'full', ...(cityFilter && { city: cityFilter }) });
      const pending = full.filter(
        (m) => ['FULL', 'PENDING_SCORE'].includes(m.status) && m.players.some((p) => p.user.id === user?.id)
      );
      setPendingMatches(pending);

      if (tournaments.length > 0) setTournament(tournaments[0]);

      // Find bookable venue (with YClients)
      try {
        const allVenues = await api.venues.list(cityFilter);
        const bv = allVenues.find(v => v.yclientsCompanyId);
        if (bv) setBookableVenue(bv);
      } catch (e) { /* not critical */ }

      // HIDDEN: Coach features (training sessions & homework) — will enable later
      // try {
      //   const [mySessions, myHomework] = await Promise.all([
      //     api.training.my(),
      //     api.training.homework(),
      //   ]);
      //   setTrainingSessions(mySessions.slice(0, 3));
      //   setHomework(myHomework.slice(0, 3));
      // } catch (e) {
      //   // Not critical — may not have training sessions
      // }
    } catch (err) {
      console.error('Home load error:', err);
      setLoadError(err.message || 'Ошибка загрузки');
    }
  }

  if (!user) return null;

  if (loadError) {
    return (
      <div style={{ paddingBottom: 80, textAlign: 'center', paddingTop: 40 }}>
        <p style={{ fontSize: 16, color: COLORS.danger, marginBottom: 8 }}>Ошибка загрузки</p>
        <p style={{ fontSize: 13, color: COLORS.textDim, marginBottom: 16 }}>{loadError}</p>
        <button
          onClick={() => { setLoadError(null); loadData(); }}
          style={{ padding: '8px 20px', borderRadius: 10, background: COLORS.accent, color: '#000', border: 'none', fontWeight: 600, cursor: 'pointer' }}
        >
          Повторить
        </button>
      </div>
    );
  }

  const level = getLevel(user.rating);
  const xp = getXpLevel(user.xp || 0);
  const winRate = user.matchesPlayed > 0 ? Math.min(100, Math.round((user.wins / user.matchesPlayed) * 100)) : 0;

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar src={user.photoUrl} name={user.firstName} size={44} />
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>
              {user.firstName} {user.lastName || ''}
            </p>
            <p style={{ fontSize: 12, color: COLORS.textDim }}>
              {xp.current.icon} {xp.current.name}
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('profile')}
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 12,
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 16,
          }}
        >
          {'\u{1F514}'}
        </button>
      </div>

      {/* Rating card */}
      <Card glow style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 4 }}>Рейтинг</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: COLORS.accent }}>{user.rating}</span>
              {user.trend !== undefined && user.trend !== 0 && (
                <span style={{ fontSize: 14, fontWeight: 600, color: user.trend > 0 ? COLORS.accent : COLORS.danger }}>
                  {user.trend > 0 ? '+' : ''}{user.trend}
                </span>
              )}
            </div>
            <Badge variant="accent" style={{ marginTop: 4 }}>
              {level.category} — {level.name}
            </Badge>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 22, fontWeight: 700, color: COLORS.text }}>
              {user.wins}W / {user.losses}L
            </p>
            <p style={{ fontSize: 12, color: COLORS.textDim }}>{winRate}% побед</p>
          </div>
        </div>
        <ProgressBar
          progress={level.max ? (user.rating - level.min) / (level.max - level.min + 1) : 1}
          style={{ marginTop: 12 }}
        />
      </Card>

      {/* Pending score alert */}
      {pendingMatches.length > 0 && (
        <Card
          variant="warning"
          onClick={() => onNavigate('score', { matchId: pendingMatches[0].id })}
          style={{ marginBottom: 12, cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>{'\u270F\uFE0F'}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.warning }}>Запишите счёт!</p>
              <p style={{ fontSize: 12, color: COLORS.textDim }}>
                {pendingMatches[0].venue?.name} — {new Date(pendingMatches[0].date).toLocaleDateString('ru-RU')}
              </p>
            </div>
            <span style={{ color: COLORS.textDim }}>{'\u2192'}</span>
          </div>
        </Card>
      )}

      {/* Tournament promo */}
      {tournament && (
        <Card
          variant="purple"
          onClick={() => onNavigate('tournaments', { tournamentId: tournament.id })}
          style={{ marginBottom: 12, cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>{'\u{1F3C6}'}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: COLORS.purple }}>{tournament.name}</p>
              <p style={{ fontSize: 12, color: COLORS.textDim }}>
                {new Date(tournament.date).toLocaleDateString('ru-RU')} · {tournament.teamsRegistered || 0}/{tournament.maxTeams} команд
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          { icon: '\u2795', label: 'Создать матч', action: () => onNavigate('createMatch') },
          { icon: '\u{1F50D}', label: 'Найти игру', action: () => onNavigate('matches') },
          { icon: '\u270F\uFE0F', label: 'Записать счёт', action: () => onNavigate('score') },
          { icon: '\u{1F3C6}', label: 'Турниры', action: () => onNavigate('tournaments') },
        ].map((item) => (
          <Card key={item.label} onClick={item.action} style={{ cursor: 'pointer', textAlign: 'center', padding: 16 }}>
            <span style={{ fontSize: 24, display: 'block', marginBottom: 6 }}>{item.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>{item.label}</span>
          </Card>
        ))}
      </div>

      {/* Booking banner */}
      {bookableVenue && (
        <Card
          onClick={() => onNavigate('bookCourt', { venueId: bookableVenue.id })}
          style={{ marginBottom: 12, cursor: 'pointer', background: `linear-gradient(135deg, ${COLORS.accent}15, ${COLORS.accent}05)` }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>{'\uD83C\uDFBE'}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: COLORS.accent }}>Забронировать корт</p>
              <p style={{ fontSize: 12, color: COLORS.textDim }}>{bookableVenue.name} — посмотреть свободное время</p>
            </div>
            <span style={{ color: COLORS.textDim }}>{'\u2192'}</span>
          </div>
        </Card>
      )}

      {/* HIDDEN: Find a coach banner — will enable later */}

      {/* FAQ link */}
      <Card
        onClick={() => onNavigate('faq')}
        style={{ marginBottom: 16, cursor: 'pointer', background: `linear-gradient(135deg, ${COLORS.accent}08, ${COLORS.purple}08)` }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>{'\u2753'}</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>FAQ — Частые вопросы</p>
            <p style={{ fontSize: 12, color: COLORS.textDim }}>Рейтинг, матчи, достижения и другое</p>
          </div>
          <span style={{ color: COLORS.textDim }}>{'\u2192'}</span>
        </div>
      </Card>

      {/* HIDDEN: Training sessions & homework sections — will enable later */}

      {/* Upcoming match */}
      {matches.length > 0 && (
        <>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 10 }}>Ближайшие матчи</h3>
          {matches.map((match) => (
            <Card key={match.id} onClick={() => onNavigate('matches', { matchId: match.id })} style={{ marginBottom: 8, cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>
                    {new Date(match.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                  </span>
                  <span style={{ fontSize: 13, color: COLORS.textDim }}>
                    {new Date(match.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <Badge>{match.durationMin} мин</Badge>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <Badge variant="accent">{getLevelByValue(match.levelMin).category}-{getLevelByValue(match.levelMax).category}</Badge>
                  {match.courtBooked && <Badge variant="success">{'\u2705'}</Badge>}
                </div>
              </div>
              <p style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 6 }}>{match.venue?.name || '—'}</p>
              <div style={{ display: 'flex', gap: 4 }}>
                {match.players?.filter((p) => p.status === 'APPROVED').map((p) => (
                  <Avatar key={p.user.id} src={p.user.photoUrl} name={p.user.firstName} size={28} />
                ))}
                {Array.from({ length: Math.max(0, 4 - (match.players?.filter((p) => p.status === 'APPROVED').length || 0)) }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      border: `2px dashed ${COLORS.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      color: COLORS.textMuted,
                    }}
                  >
                    +
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
