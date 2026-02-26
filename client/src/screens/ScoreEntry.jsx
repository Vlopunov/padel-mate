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
          m.players.some((p) => p.user.id === user?.id)
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
    } catch (err) {
      console.error('Load match error:', err);
    }
  }

  const handleMatchSelect = (id) => {
    setSelectedMatchId(id);
    if (id) loadMatch(parseInt(id));
  };

  const updateSet = (idx, field, value) => {
    const newSets = [...sets];
    newSets[idx] = { ...newSets[idx], [field]: value };
    setSets(newSets);
  };

  const addSet = () => {
    if (sets.length < 3) {
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

    setLoading(true);
    try {
      const result = await api.matches.submitScore(id, validSets);
      setPreview(result);
    } catch (err) {
      alert(err.message || 'Ошибка записи счёта');
    }
    setLoading(false);
  };

  const scoreOptions = Array.from({ length: 8 }, (_, i) => ({ value: String(i), label: String(i) }));

  const team1 = match?.players?.filter((p) => p.team === 1) || [];
  const team2 = match?.players?.filter((p) => p.team === 2) || [];

  return (
    <div style={{ paddingBottom: 80 }}>
      <Header
        title="Записать счёт"
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

      {/* Match selector (if no matchId provided) */}
      {!matchId && allMatches.length > 0 && (
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

      {match && !preview && (
        <>
          {/* Teams */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            {/* Team 1 */}
            <Card style={{ flex: 1, borderLeft: `3px solid ${COLORS.accent}`, padding: 12 }}>
              <p style={{ fontSize: 12, color: COLORS.accent, fontWeight: 600, marginBottom: 8 }}>Команда 1</p>
              {team1.map((p) => (
                <div key={p.user.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Avatar src={p.user.photoUrl} name={p.user.firstName} size={24} />
                  <div>
                    <p style={{ fontSize: 13, color: COLORS.text }}>{p.user.firstName}</p>
                    <p style={{ fontSize: 11, color: COLORS.textDim }}>{p.user.rating}</p>
                  </div>
                </div>
              ))}
            </Card>

            {/* Team 2 */}
            <Card style={{ flex: 1, borderLeft: `3px solid ${COLORS.warning}`, padding: 12 }}>
              <p style={{ fontSize: 12, color: COLORS.warning, fontWeight: 600, marginBottom: 8 }}>Команда 2</p>
              {team2.map((p) => (
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

            {sets.length < 3 && (
              <Button variant="ghost" size="sm" onClick={addSet}>
                + Добавить сет
              </Button>
            )}
          </Card>

          <Button fullWidth onClick={handleSubmit} disabled={loading} size="lg">
            {loading ? 'Сохранение...' : '\u2705 Записать результат'}
          </Button>
        </>
      )}

      {/* Preview result */}
      {preview && (
        <Card variant="accent" style={{ textAlign: 'center' }}>
          <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>{'\u2705'}</span>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, marginBottom: 8 }}>
            Счёт записан!
          </h3>
          <p style={{ fontSize: 14, color: COLORS.textDim, marginBottom: 16 }}>
            Ожидается подтверждение от других игроков
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
