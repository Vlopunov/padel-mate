import React, { useState, useEffect } from 'react';
import { COLORS } from '../config';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Header } from '../components/ui/Header';
import { Select } from '../components/ui/Select';
import { api } from '../services/api';

export function ScoreEntry({ user, matchId, onBack, onDone }) {
  const [match, setMatch] = useState(null);
  const [step, setStep] = useState('teams'); // 'teams' | 'score' | 'preview'
  const [teams, setTeams] = useState({}); // { [userId]: 1 | 2 }
  const [sets, setSets] = useState([{ team1Score: '', team2Score: '' }]);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [allMatches, setAllMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState(matchId || '');

  useEffect(() => {
    if (matchId) {
      loadMatch(matchId);
    } else {
      loadEligibleMatches();
    }
  }, [matchId]);

  async function loadEligibleMatches() {
    try {
      const data = await api.matches.list({ status: 'full' });
      const eligible = data.filter(
        (m) =>
          ['FULL', 'PENDING_SCORE'].includes(m.status) &&
          m.players.some((p) => p.user.id === user?.id && p.status === 'APPROVED')
      );
      setAllMatches(eligible);
      if (eligible.length === 1) {
        setSelectedMatchId(String(eligible[0].id));
        loadMatch(eligible[0].id);
      }
    } catch (err) {
      console.error('Load matches error:', err);
    }
  }

  async function loadMatch(id) {
    try {
      const data = await api.matches.getById(id);
      setMatch(data);
      // Initialize team assignments from existing data
      const initialTeams = {};
      const approved = (data.players || []).filter((p) => p.status === 'APPROVED');
      approved.forEach((p) => {
        initialTeams[p.user.id] = p.team || 0;
      });
      setTeams(initialTeams);
    } catch (err) {
      console.error('Load match error:', err);
    }
  }

  const handleMatchSelect = (id) => {
    setSelectedMatchId(id);
    if (id) loadMatch(parseInt(id));
  };

  const approvedPlayers = (match?.players || []).filter((p) => p.status === 'APPROVED');
  const team1Players = approvedPlayers.filter((p) => teams[p.user.id] === 1);
  const team2Players = approvedPlayers.filter((p) => teams[p.user.id] === 2);
  const unassigned = approvedPlayers.filter((p) => !teams[p.user.id] || teams[p.user.id] === 0);

  const toggleTeam = (userId, team) => {
    setTeams((prev) => ({
      ...prev,
      [userId]: prev[userId] === team ? 0 : team,
    }));
  };

  const teamsReady = team1Players.length === 2 && team2Players.length === 2;

  const updateSet = (idx, field, value) => {
    const newSets = [...sets];
    newSets[idx] = { ...newSets[idx], [field]: value };
    setSets(newSets);
  };

  const addSet = () => {
    if (sets.length < 10) {
      setSets([...sets, { team1Score: '', team2Score: '' }]);
    }
  };

  const removeSet = (idx) => {
    if (sets.length > 1) {
      setSets(sets.filter((_, i) => i !== idx));
    }
  };

  const handleSubmit = async () => {
    const id = selectedMatchId || matchId;
    if (!id) return;

    const validSets = sets.filter((s) => s.team1Score !== '' && s.team2Score !== '');
    if (validSets.length === 0) {
      alert('Введите счёт хотя бы одного сета');
      return;
    }

    // Build teams array for backend
    const teamsArray = approvedPlayers.map((p) => ({
      userId: p.user.id,
      team: teams[p.user.id],
    }));

    setLoading(true);
    try {
      const result = await api.matches.submitScore(id, validSets, teamsArray);
      setPreview(result);
      setStep('preview');
    } catch (err) {
      alert(err.message || 'Ошибка записи счёта');
    }
    setLoading(false);
  };

  const scoreOptions = Array.from({ length: 8 }, (_, i) => ({ value: String(i), label: String(i) }));

  // Player card for team selection
  const PlayerDragItem = ({ player, currentTeam }) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        background: COLORS.surface,
        borderRadius: 10,
        marginBottom: 6,
        border: `1px solid ${COLORS.border}`,
      }}
    >
      <Avatar src={player.user.photoUrl} name={player.user.firstName} size={32} />
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, color: COLORS.text, fontWeight: 500 }}>
          {player.user.firstName} {player.user.lastName || ''}
        </p>
        <p style={{ fontSize: 12, color: COLORS.textDim }}>{player.user.rating}</p>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button
          onClick={() => toggleTeam(player.user.id, 1)}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            border: currentTeam === 1 ? `2px solid ${COLORS.accent}` : `1px solid ${COLORS.border}`,
            background: currentTeam === 1 ? `${COLORS.accent}22` : 'transparent',
            color: currentTeam === 1 ? COLORS.accent : COLORS.textDim,
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          1
        </button>
        <button
          onClick={() => toggleTeam(player.user.id, 2)}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            border: currentTeam === 2 ? `2px solid ${COLORS.warning}` : `1px solid ${COLORS.border}`,
            background: currentTeam === 2 ? `${COLORS.warning}22` : 'transparent',
            color: currentTeam === 2 ? COLORS.warning : COLORS.textDim,
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          2
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ paddingBottom: 80 }}>
      <Header
        title="Записать счёт"
        leftAction={
          <button
            onClick={() => {
              if (step === 'score') {
                setStep('teams');
              } else {
                onBack();
              }
            }}
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

      {/* Match selector (if no matchId provided) */}
      {!matchId && allMatches.length > 0 && !match && (
        <Select
          label="Выберите матч"
          value={selectedMatchId}
          onChange={handleMatchSelect}
          placeholder="Выберите матч"
          options={allMatches.map((m) => ({
            value: String(m.id),
            label: `${new Date(m.date).toLocaleDateString('ru-RU')} — ${m.venue?.name}`,
          }))}
        />
      )}

      {!matchId && allMatches.length === 0 && !match && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <span style={{ fontSize: 48 }}>{'\u270F\uFE0F'}</span>
          <p style={{ color: COLORS.textDim, marginTop: 12 }}>Нет матчей для записи счёта</p>
          <p style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 4 }}>
            Создайте матч и дождитесь набора 4 игроков
          </p>
        </div>
      )}

      {/* Step 1: Team Selection */}
      {match && step === 'teams' && (
        <>
          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, justifyContent: 'center' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: COLORS.accent, color: '#000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 13,
            }}>1</div>
            <div style={{ width: 40, height: 2, background: COLORS.border, alignSelf: 'center' }} />
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: COLORS.border, color: COLORS.textDim,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 13,
            }}>2</div>
          </div>

          <Card style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>
              Кто играл?
            </p>
            <p style={{ fontSize: 13, color: COLORS.textDim, marginBottom: 16 }}>
              Распределите игроков по командам. Нажмите 1 или 2 рядом с каждым игроком.
            </p>

            {approvedPlayers.map((p) => (
              <PlayerDragItem
                key={p.user.id}
                player={p}
                currentTeam={teams[p.user.id] || 0}
              />
            ))}
          </Card>

          {/* Team preview */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <Card style={{
              flex: 1,
              borderLeft: `3px solid ${COLORS.accent}`,
              padding: 12,
              opacity: team1Players.length > 0 ? 1 : 0.5,
            }}>
              <p style={{ fontSize: 12, color: COLORS.accent, fontWeight: 600, marginBottom: 8 }}>
                Команда 1 ({team1Players.length}/2)
              </p>
              {team1Players.map((p) => (
                <p key={p.user.id} style={{ fontSize: 13, color: COLORS.text, marginBottom: 2 }}>
                  {p.user.firstName} {p.user.lastName || ''}
                </p>
              ))}
              {team1Players.length === 0 && (
                <p style={{ fontSize: 12, color: COLORS.textMuted }}>Выберите 2 игроков</p>
              )}
            </Card>

            <Card style={{
              flex: 1,
              borderLeft: `3px solid ${COLORS.warning}`,
              padding: 12,
              opacity: team2Players.length > 0 ? 1 : 0.5,
            }}>
              <p style={{ fontSize: 12, color: COLORS.warning, fontWeight: 600, marginBottom: 8 }}>
                Команда 2 ({team2Players.length}/2)
              </p>
              {team2Players.map((p) => (
                <p key={p.user.id} style={{ fontSize: 13, color: COLORS.text, marginBottom: 2 }}>
                  {p.user.firstName} {p.user.lastName || ''}
                </p>
              ))}
              {team2Players.length === 0 && (
                <p style={{ fontSize: 12, color: COLORS.textMuted }}>Выберите 2 игроков</p>
              )}
            </Card>
          </div>

          <Button
            fullWidth
            size="lg"
            onClick={() => setStep('score')}
            disabled={!teamsReady}
          >
            {teamsReady ? 'Далее — Ввести счёт' : 'Выберите по 2 игрока в каждую команду'}
          </Button>
        </>
      )}

      {/* Step 2: Score Input */}
      {match && step === 'score' && (
        <>
          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, justifyContent: 'center' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: COLORS.accent, color: '#000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 13,
            }}>{'\u2713'}</div>
            <div style={{ width: 40, height: 2, background: COLORS.accent, alignSelf: 'center' }} />
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: COLORS.accent, color: '#000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 13,
            }}>2</div>
          </div>

          {/* Teams summary */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <Card style={{ flex: 1, borderLeft: `3px solid ${COLORS.accent}`, padding: 12 }}>
              <p style={{ fontSize: 12, color: COLORS.accent, fontWeight: 600, marginBottom: 8 }}>Команда 1</p>
              {team1Players.map((p) => (
                <div key={p.user.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Avatar src={p.user.photoUrl} name={p.user.firstName} size={24} />
                  <div>
                    <p style={{ fontSize: 13, color: COLORS.text }}>{p.user.firstName}</p>
                    <p style={{ fontSize: 11, color: COLORS.textDim }}>{p.user.rating}</p>
                  </div>
                </div>
              ))}
            </Card>

            <Card style={{ flex: 1, borderLeft: `3px solid ${COLORS.warning}`, padding: 12 }}>
              <p style={{ fontSize: 12, color: COLORS.warning, fontWeight: 600, marginBottom: 8 }}>Команда 2</p>
              {team2Players.map((p) => (
                <div key={p.user.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Avatar src={p.user.photoUrl} name={p.user.firstName} size={24} />
                  <div>
                    <p style={{ fontSize: 13, color: COLORS.text }}>{p.user.firstName}</p>
                    <p style={{ fontSize: 11, color: COLORS.textDim }}>{p.user.rating}</p>
                  </div>
                </div>
              ))}
            </Card>
          </div>

          {/* Sets */}
          <Card style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 12 }}>Счёт по сетам</p>

            {sets.map((set, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: COLORS.textDim, width: 50 }}>Сет {idx + 1}</span>
                <Select
                  value={set.team1Score}
                  onChange={(v) => updateSet(idx, 'team1Score', v)}
                  options={scoreOptions}
                  placeholder="-"
                  style={{ flex: 1, marginBottom: 0 }}
                />
                <span style={{ color: COLORS.textMuted, fontWeight: 700 }}>:</span>
                <Select
                  value={set.team2Score}
                  onChange={(v) => updateSet(idx, 'team2Score', v)}
                  options={scoreOptions}
                  placeholder="-"
                  style={{ flex: 1, marginBottom: 0 }}
                />
                {sets.length > 1 && (
                  <button
                    onClick={() => removeSet(idx)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: COLORS.danger,
                      cursor: 'pointer',
                      fontSize: 16,
                    }}
                  >
                    {'\u2715'}
                  </button>
                )}
              </div>
            ))}

            {sets.length < 10 && (
              <Button variant="ghost" size="sm" onClick={addSet}>
                + Добавить сет
              </Button>
            )}
          </Card>

          <Button fullWidth onClick={handleSubmit} disabled={loading} size="lg">
            {loading ? 'Сохранение...' : 'Записать результат'}
          </Button>
        </>
      )}

      {/* Step 3: Preview result */}
      {step === 'preview' && preview && (
        <Card variant="accent" style={{ textAlign: 'center' }}>
          <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>{'\u2705'}</span>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, marginBottom: 8 }}>
            Счёт записан!
          </h3>
          <p style={{ fontSize: 14, color: COLORS.textDim, marginBottom: 6 }}>
            Ожидается подтверждение от соперника
          </p>
          <p style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 16 }}>
            Один из соперников должен подтвердить в течение 7 дней
          </p>

          {preview.ratingPreview && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: COLORS.textDim, marginBottom: 8 }}>Предварительный расчёт Elo</p>
              {preview.ratingPreview.map((c) => {
                const player = match?.players?.find((p) => p.user.id === c.userId);
                return (
                  <div key={c.userId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: COLORS.text }}>{player?.user.firstName}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: c.change > 0 ? COLORS.accent : COLORS.danger }}>
                      {c.change > 0 ? '+' : ''}{c.change} ({c.oldRating} {'\u2192'} {c.newRating})
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <Button fullWidth onClick={onDone}>
            Готово
          </Button>
        </Card>
      )}
    </div>
  );
}
