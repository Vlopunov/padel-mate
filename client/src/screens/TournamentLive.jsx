import React, { useEffect, useState, useCallback, useRef } from 'react';
import { COLORS, BOT_USERNAME } from '../config';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Header } from '../components/ui/Header';
import { Modal } from '../components/ui/Modal';
import { api } from '../services/api';
import { useTelegram } from '../hooks/useTelegram';

const POLL_INTERVAL = 5000;

export function TournamentLive({ tournamentId, user, onBack, onNavigate }) {
  const { hapticFeedback } = useTelegram();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('matches'); // matches | standings
  const [selectedRound, setSelectedRound] = useState(null);
  const [scoreModal, setScoreModal] = useState(null); // { match }
  const [team1Score, setTeam1Score] = useState('');
  const [team2Score, setTeam2Score] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const pollRef = useRef(null);
  const prevStandingsRef = useRef(null);

  const loadData = useCallback(async () => {
    try {
      const data = await api.tournaments.live(tournamentId);

      // Haptic feedback when standings change (position or points update)
      if (prevStandingsRef.current && data.standings && user?.id) {
        const prevMe = prevStandingsRef.current.find(s => s.userId === user.id);
        const newMe = data.standings.find(s => s.userId === user.id);
        if (prevMe && newMe && (prevMe.points !== newMe.points || prevMe.position !== newMe.position)) {
          hapticFeedback('notification', newMe.position < prevMe.position ? 'success' : 'warning');
        }
      }
      if (data.standings) {
        prevStandingsRef.current = data.standings;
      }

      setTournament(data);
      if (selectedRound === null && data.currentRound > 0) {
        setSelectedRound(data.currentRound);
      }
    } catch (err) {
      console.error('Live data error:', err);
    }
    setLoading(false);
  }, [tournamentId, selectedRound, user?.id, hapticFeedback]);

  useEffect(() => {
    loadData();
  }, []);

  // Polling for live updates
  useEffect(() => {
    if (tournament?.status === 'IN_PROGRESS') {
      pollRef.current = setInterval(loadData, POLL_INTERVAL);
      return () => clearInterval(pollRef.current);
    }
  }, [tournament?.status, loadData]);

  const isAdmin = user?.isAdmin;
  const isCompleted = tournament?.status === 'COMPLETED';
  const isInProgress = tournament?.status === 'IN_PROGRESS';
  const format = tournament?.format?.toLowerCase();

  // Current round data
  const currentRoundData = tournament?.rounds?.find((r) => r.roundNumber === selectedRound);
  const totalRounds = tournament?.rounds?.length || 0;

  // Admin: submit score
  async function handleSubmitScore() {
    if (!scoreModal) return;
    const s1 = parseInt(team1Score);
    const s2 = parseInt(team2Score);

    if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) {
      alert('Введите корректные очки');
      return;
    }

    if (s1 + s2 !== tournament.pointsPerMatch) {
      alert(`Сумма очков должна быть ${tournament.pointsPerMatch}`);
      return;
    }

    setSubmitting(true);
    try {
      await api.admin.submitTournamentScore(tournamentId, scoreModal.match.id, s1, s2);
      setScoreModal(null);
      setTeam1Score('');
      setTeam2Score('');
      await loadData();
    } catch (err) {
      alert(err.message || 'Ошибка записи счёта');
    }
    setSubmitting(false);
  }

  // Admin: start tournament
  async function handleStart() {
    if (!confirm('Запустить турнир? Это сгенерирует раунды и начнёт турнир.')) return;
    try {
      await api.admin.startTournament(tournamentId);
      await loadData();
    } catch (err) {
      alert(err.message || 'Ошибка запуска');
    }
  }

  // Admin: next round (Mexicano)
  async function handleNextRound() {
    try {
      await api.admin.nextTournamentRound(tournamentId);
      const data = await api.tournaments.live(tournamentId);
      setTournament(data);
      setSelectedRound(data.currentRound);
    } catch (err) {
      alert(err.message || 'Ошибка генерации раунда');
    }
  }

  // Admin: complete tournament
  async function handleComplete() {
    if (!confirm('Завершить турнир? Будут рассчитаны рейтинговые изменения.')) return;
    try {
      await api.admin.completeTournament(tournamentId);
      await loadData();
    } catch (err) {
      alert(err.message || 'Ошибка завершения');
    }
  }

  function openScoreModal(match) {
    setScoreModal({ match });
    setTeam1Score('');
    setTeam2Score('');
  }

  if (loading) {
    return (
      <div style={{ paddingBottom: 80 }}>
        <Header title="Турнир" onBack={onBack} />
        <div style={{ textAlign: 'center', padding: 60 }}>
          <span style={{ fontSize: 32, display: 'block', marginBottom: 12, animation: 'pulse 1.5s infinite' }}>{'\u{1F3C6}'}</span>
          <p style={{ color: COLORS.textDim, fontSize: 14 }}>Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div style={{ paddingBottom: 80 }}>
        <Header title="Турнир" onBack={onBack} />
        <Card style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: COLORS.textDim }}>Турнир не найден</p>
        </Card>
      </div>
    );
  }

  // Pre-tournament: not yet started
  if (tournament.status === 'REGISTRATION' || tournament.status === 'UPCOMING') {
    return (
      <div style={{ paddingBottom: 80 }}>
        <Header title={tournament.name} onBack={onBack} />
        <Card style={{ textAlign: 'center', padding: 40 }}>
          <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>{'\u{1F3BE}'}</span>
          <p style={{ fontSize: 16, fontWeight: 600, color: COLORS.text, marginBottom: 6 }}>
            Турнир ещё не начался
          </p>
          <p style={{ fontSize: 13, color: COLORS.textDim, marginBottom: 16 }}>
            {tournament.registrations?.length || 0} участников зарегистрировано
          </p>
          {isAdmin && tournament.status === 'REGISTRATION' && (
            <Button variant="accent" onClick={handleStart} fullWidth>
              {'\u{1F680}'} Запустить турнир
            </Button>
          )}
        </Card>
      </div>
    );
  }

  const formatLabel = format === 'americano' ? 'Americano' : format === 'mexicano' ? 'Mexicano' : tournament.format;

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Header */}
      <Header
        title={tournament.name}
        subtitle={`${formatLabel} \u00B7 ${tournament.pointsPerMatch} очков`}
        onBack={onBack}
      />

      {/* Status bar */}
      {isInProgress && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '8px 16px',
          marginBottom: 12,
          background: `${COLORS.accent}15`,
          borderRadius: 12,
          border: `1px solid ${COLORS.accent}30`,
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: COLORS.accent,
            animation: 'pulse 1.5s infinite',
          }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.accent }}>
            LIVE \u00B7 Раунд {tournament.currentRound}
          </span>
        </div>
      )}

      {isCompleted && (
        <div style={{
          padding: '8px 16px',
          marginBottom: 12,
          background: `${COLORS.purple}15`,
          borderRadius: 12,
          border: `1px solid ${COLORS.purple}30`,
          textAlign: 'center',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.purple }}>
            {'\u{1F3C6}'} Турнир завершён
          </span>
        </div>
      )}

      {/* Share button */}
      {(isInProgress || isCompleted) && (
        <button
          onClick={() => {
            hapticFeedback('selection');
            const tg = window.Telegram?.WebApp;
            const url = `https://t.me/${BOT_USERNAME}?startapp=tournament_${tournamentId}`;
            const text = isCompleted
              ? `\u{1F3C6} Результаты турнира "${tournament.name}"`
              : `\u{1F3BE} Live-турнир "${tournament.name}" — следи за ходом!`;
            if (tg?.openTelegramLink) {
              tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`);
            } else {
              navigator.clipboard?.writeText(`${text}\n${url}`);
              alert('Ссылка скопирована!');
            }
          }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            width: '100%', padding: '10px 0', marginBottom: 12,
            borderRadius: 12, border: `1px solid ${COLORS.border}`,
            background: 'transparent', color: COLORS.textDim,
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          {'\uD83D\uDD17'} Поделиться
        </button>
      )}

      {/* Podium for completed tournaments */}
      {isCompleted && tournament.standings?.length >= 3 && (
        <PodiumSection standings={tournament.standings} onNavigate={onNavigate} />
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, background: COLORS.surface, borderRadius: 14, padding: 3 }}>
        {['matches', 'standings'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: 12,
              border: 'none',
              background: activeTab === tab ? COLORS.card : 'transparent',
              color: activeTab === tab ? COLORS.text : COLORS.textDim,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {tab === 'matches' ? '\u{1F3BE} Матчи' : '\u{1F4CA} Таблица'}
          </button>
        ))}
      </div>

      {/* Matches tab */}
      {activeTab === 'matches' && (
        <div>
          {/* Round selector */}
          {totalRounds > 0 && (
            <div style={{
              display: 'flex',
              gap: 6,
              marginBottom: 16,
              overflowX: 'auto',
              paddingBottom: 4,
            }}>
              {tournament.rounds.map((round) => {
                const isActive = round.roundNumber === selectedRound;
                const isCurrent = round.roundNumber === tournament.currentRound;
                return (
                  <button
                    key={round.id}
                    onClick={() => setSelectedRound(round.roundNumber)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 20,
                      border: isActive ? 'none' : `1px solid ${COLORS.border}`,
                      background: isActive ? COLORS.accent : 'transparent',
                      color: isActive ? COLORS.bg : COLORS.textDim,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      position: 'relative',
                    }}
                  >
                    {round.roundNumber}
                    {isCurrent && isInProgress && !isActive && (
                      <span style={{
                        position: 'absolute', top: -2, right: -2,
                        width: 6, height: 6, borderRadius: '50%',
                        background: COLORS.accent,
                      }} />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Matches for selected round */}
          {currentRoundData?.matches?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {currentRoundData.matches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  isAdmin={isAdmin}
                  isInProgress={isInProgress}
                  onScoreClick={() => openScoreModal(match)}
                  onNavigate={onNavigate}
                  userId={user?.id}
                />
              ))}
            </div>
          ) : (
            <Card style={{ textAlign: 'center', padding: 30 }}>
              <p style={{ color: COLORS.textDim, fontSize: 14 }}>
                {totalRounds === 0 ? 'Матчи ещё не сгенерированы' : 'Выберите раунд'}
              </p>
            </Card>
          )}

          {/* Admin controls */}
          {isAdmin && isInProgress && (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {format === 'mexicano' && currentRoundData?.status === 'COMPLETED' && (
                <Button variant="purple" fullWidth onClick={handleNextRound}>
                  {'\u27A1\uFE0F'} Следующий раунд
                </Button>
              )}
              <Button
                variant="default"
                fullWidth
                onClick={handleComplete}
                style={{ borderColor: `${COLORS.warning}40`, color: COLORS.warning }}
              >
                {'\u{1F3C1}'} Завершить турнир
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Standings tab */}
      {activeTab === 'standings' && (
        <div>
          {tournament.standings?.length > 0 ? (
            <div style={{
              background: COLORS.card,
              borderRadius: 16,
              border: `1px solid ${COLORS.border}`,
              overflow: 'hidden',
            }}>
              {/* Table header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '36px 1fr 56px 56px 52px',
                padding: '10px 12px',
                background: COLORS.surface,
                fontSize: 11,
                fontWeight: 600,
                color: COLORS.textMuted,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}>
                <span>#</span>
                <span>Игрок</span>
                <span style={{ textAlign: 'center' }}>Очки</span>
                <span style={{ textAlign: 'center' }}>W/L</span>
                <span style={{ textAlign: 'center' }}>+/-</span>
              </div>

              {tournament.standings.map((standing, idx) => {
                const isMe = standing.userId === user?.id;
                const diff = standing.pointsFor - standing.pointsAgainst;
                return (
                  <div
                    key={standing.id}
                    onClick={() => onNavigate('playerProfile', { userId: standing.userId })}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '36px 1fr 56px 56px 52px',
                      padding: '10px 12px',
                      alignItems: 'center',
                      borderTop: `1px solid ${COLORS.border}`,
                      background: isMe ? `${COLORS.accent}08` : 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: idx < 3 ? [COLORS.gold, '#C0C0C0', '#CD7F32'][idx] : COLORS.textDim,
                    }}>
                      {idx < 3 ? ['\u{1F947}', '\u{1F948}', '\u{1F949}'][idx] : standing.position}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <Avatar src={standing.user?.photoUrl} name={standing.user?.firstName} size={28} />
                      <span style={{
                        fontSize: 13,
                        fontWeight: isMe ? 700 : 500,
                        color: isMe ? COLORS.accent : COLORS.text,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {standing.user?.firstName}
                      </span>
                    </div>
                    <span style={{
                      textAlign: 'center',
                      fontSize: 15,
                      fontWeight: 800,
                      color: COLORS.text,
                    }}>
                      {standing.points}
                    </span>
                    <span style={{
                      textAlign: 'center',
                      fontSize: 12,
                      color: COLORS.textDim,
                    }}>
                      {standing.wins}/{standing.losses}
                    </span>
                    <span style={{
                      textAlign: 'center',
                      fontSize: 12,
                      fontWeight: 600,
                      color: diff > 0 ? COLORS.accent : diff < 0 ? COLORS.danger : COLORS.textDim,
                    }}>
                      {diff > 0 ? '+' : ''}{diff}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <Card style={{ textAlign: 'center', padding: 30 }}>
              <p style={{ color: COLORS.textDim, fontSize: 14 }}>Таблица пока пуста</p>
            </Card>
          )}

          {/* Rating changes after completion */}
          {isCompleted && tournament.ratingChanges?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 10 }}>
                {'\u{1F4C8}'} Изменения рейтинга
              </p>
              <Card>
                {tournament.ratingChanges.map((rc) => (
                  <div
                    key={rc.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: `1px solid ${COLORS.border}`,
                    }}
                  >
                    <span style={{ fontSize: 13, color: COLORS.text }}>
                      {rc.user?.firstName} {rc.user?.lastName || ''}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: COLORS.textDim }}>{rc.oldRating}</span>
                      <span style={{ fontSize: 12, color: COLORS.textDim }}>{'\u2192'}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>{rc.newRating}</span>
                      <Badge variant={rc.change >= 0 ? 'success' : 'danger'} style={{ fontSize: 11 }}>
                        {rc.change > 0 ? '+' : ''}{rc.change}
                      </Badge>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Score input modal */}
      <Modal
        isOpen={!!scoreModal}
        onClose={() => setScoreModal(null)}
        title="Ввести счёт"
      >
        {scoreModal && (
          <div>
            {/* Team 1 */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Avatar src={scoreModal.match.team1Player1?.photoUrl} name={scoreModal.match.team1Player1?.firstName} size={28} />
                <Avatar src={scoreModal.match.team1Player2?.photoUrl} name={scoreModal.match.team1Player2?.firstName} size={28} />
                <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>
                  {scoreModal.match.team1Player1?.firstName} + {scoreModal.match.team1Player2?.firstName}
                </span>
              </div>
              <input
                type="number"
                inputMode="numeric"
                value={team1Score}
                onChange={(e) => setTeam1Score(e.target.value)}
                placeholder="0"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 14,
                  border: `1px solid ${COLORS.border}`,
                  background: COLORS.surface,
                  color: COLORS.text,
                  fontSize: 24,
                  fontWeight: 700,
                  textAlign: 'center',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ textAlign: 'center', color: COLORS.textDim, fontSize: 13, marginBottom: 16 }}>vs</div>

            {/* Team 2 */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Avatar src={scoreModal.match.team2Player1?.photoUrl} name={scoreModal.match.team2Player1?.firstName} size={28} />
                <Avatar src={scoreModal.match.team2Player2?.photoUrl} name={scoreModal.match.team2Player2?.firstName} size={28} />
                <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>
                  {scoreModal.match.team2Player1?.firstName} + {scoreModal.match.team2Player2?.firstName}
                </span>
              </div>
              <input
                type="number"
                inputMode="numeric"
                value={team2Score}
                onChange={(e) => setTeam2Score(e.target.value)}
                placeholder="0"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 14,
                  border: `1px solid ${COLORS.border}`,
                  background: COLORS.surface,
                  color: COLORS.text,
                  fontSize: 24,
                  fontWeight: 700,
                  textAlign: 'center',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
            </div>

            {/* Score sum hint */}
            <p style={{
              textAlign: 'center',
              fontSize: 12,
              color: team1Score && team2Score
                ? (parseInt(team1Score) + parseInt(team2Score) === tournament.pointsPerMatch ? COLORS.accent : COLORS.danger)
                : COLORS.textDim,
              marginBottom: 16,
            }}>
              Сумма: {(parseInt(team1Score) || 0) + (parseInt(team2Score) || 0)} / {tournament.pointsPerMatch}
            </p>

            <Button
              variant="accent"
              fullWidth
              size="lg"
              onClick={handleSubmitScore}
              disabled={submitting || !team1Score || !team2Score}
            >
              {submitting ? 'Сохранение...' : '\u2705 Сохранить счёт'}
            </Button>
          </div>
        )}
      </Modal>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

// ─── Match Card ────────────────────────────────────────────

function MatchCard({ match, isAdmin, isInProgress, onScoreClick, onNavigate, userId }) {
  const isCompleted = match.status === 'COMPLETED';
  const team1Won = isCompleted && match.team1Score > match.team2Score;
  const team2Won = isCompleted && match.team2Score > match.team1Score;

  // Check if current user is in this match
  const isMyMatch = [
    match.team1Player1Id, match.team1Player2Id,
    match.team2Player1Id, match.team2Player2Id,
  ].includes(userId);

  return (
    <div style={{
      background: COLORS.card,
      borderRadius: 16,
      border: `1px solid ${isMyMatch ? `${COLORS.accent}40` : COLORS.border}`,
      overflow: 'hidden',
    }}>
      {/* Court & status header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 14px',
        background: COLORS.surface,
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.textDim }}>
          {'\u{1F3BE}'} Корт {match.courtNumber}
        </span>
        {isCompleted ? (
          <Badge variant="default" style={{ fontSize: 10 }}>{'\u2705'} Завершён</Badge>
        ) : (
          <Badge variant="accent" style={{ fontSize: 10 }}>{'\u{1F534}'} LIVE</Badge>
        )}
      </div>

      <div style={{ padding: '12px 14px' }}>
        {/* Team 1 */}
        <TeamRow
          player1={match.team1Player1}
          player2={match.team1Player2}
          score={match.team1Score}
          won={team1Won}
          isCompleted={isCompleted}
          onNavigate={onNavigate}
        />

        <div style={{
          textAlign: 'center',
          fontSize: 11,
          color: COLORS.textMuted,
          padding: '4px 0',
          fontWeight: 600,
        }}>
          vs
        </div>

        {/* Team 2 */}
        <TeamRow
          player1={match.team2Player1}
          player2={match.team2Player2}
          score={match.team2Score}
          won={team2Won}
          isCompleted={isCompleted}
          onNavigate={onNavigate}
        />

        {/* Admin score button */}
        {isAdmin && isInProgress && !isCompleted && (
          <button
            onClick={onScoreClick}
            style={{
              width: '100%',
              marginTop: 10,
              padding: '8px',
              borderRadius: 10,
              border: `1px dashed ${COLORS.accent}60`,
              background: `${COLORS.accent}08`,
              color: COLORS.accent,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {'\u270F\uFE0F'} Ввести счёт
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Team Row ──────────────────────────────────────────────

function TeamRow({ player1, player2, score, won, isCompleted, onNavigate }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '6px 0',
      opacity: isCompleted && !won ? 0.5 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: -4 }}>
          <Avatar src={player1?.photoUrl} name={player1?.firstName} size={24} />
          <Avatar src={player2?.photoUrl} name={player2?.firstName} size={24} style={{ marginLeft: -6 }} />
        </div>
        <span
          onClick={(e) => { e.stopPropagation(); if (player1?.id) onNavigate('playerProfile', { userId: player1.id }); }}
          style={{
            fontSize: 13,
            fontWeight: won ? 700 : 500,
            color: won ? COLORS.accent : COLORS.text,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
          }}
        >
          {player1?.firstName} + {player2?.firstName}
        </span>
      </div>
      {score !== null && score !== undefined && (
        <span style={{
          fontSize: 20,
          fontWeight: 800,
          color: won ? COLORS.accent : COLORS.text,
          marginLeft: 8,
          minWidth: 32,
          textAlign: 'right',
        }}>
          {score}
        </span>
      )}
    </div>
  );
}

// ─── Podium ────────────────────────────────────────────────

function PodiumSection({ standings, onNavigate }) {
  const top3 = standings.slice(0, 3);
  // Reorder for visual podium: [2nd, 1st, 3rd]
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;
  const heights = [80, 110, 60];
  const medals = ['\u{1F948}', '\u{1F947}', '\u{1F949}'];
  const colors = ['#C0C0C0', COLORS.gold, '#CD7F32'];

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-end',
      gap: 8,
      marginBottom: 20,
      padding: '0 16px',
    }}>
      {podiumOrder.map((s, idx) => (
        <div
          key={s.id}
          onClick={() => onNavigate('playerProfile', { userId: s.userId })}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: idx === 1 ? 28 : 22, marginBottom: 4 }}>{medals[idx]}</span>
          <Avatar src={s.user?.photoUrl} name={s.user?.firstName} size={idx === 1 ? 52 : 40} />
          <span style={{
            fontSize: 12,
            fontWeight: 700,
            color: COLORS.text,
            marginTop: 4,
            textAlign: 'center',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {s.user?.firstName}
          </span>
          <span style={{ fontSize: 16, fontWeight: 800, color: colors[idx] }}>
            {s.points}
          </span>
          <div style={{
            width: '100%',
            height: heights[idx],
            background: `linear-gradient(180deg, ${colors[idx]}30, ${colors[idx]}10)`,
            borderRadius: '12px 12px 0 0',
            marginTop: 4,
          }} />
        </div>
      ))}
    </div>
  );
}
