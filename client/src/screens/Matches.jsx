import React, { useEffect, useState } from 'react';
import { COLORS, getLevel, BOT_USERNAME } from '../config';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Header } from '../components/ui/Header';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { FilterTabs } from '../components/ui/ToggleGroup';
import { api } from '../services/api';
import { useTelegram } from '../hooks/useTelegram';

export function Matches({ user, onNavigate, highlightMatchId }) {
  const { openTelegramLink } = useTelegram();
  const [filter, setFilter] = useState(highlightMatchId ? 'all' : 'recruiting');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingMatch, setEditingMatch] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    loadMatches();
  }, [filter]);

  async function loadMatches() {
    setLoading(true);
    try {
      const data = await api.matches.list({ status: filter === 'all' ? '' : filter });
      setMatches(data);
    } catch (err) {
      console.error('Load matches error:', err);
    }
    setLoading(false);
  }

  async function handleJoin(matchId) {
    try {
      await api.matches.join(matchId);
      loadMatches();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleLeave(matchId) {
    try {
      await api.matches.leave(matchId);
      loadMatches();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete(matchId) {
    if (!confirm('Удалить этот матч?')) return;
    try {
      await api.matches.delete(matchId);
      loadMatches();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleApprove(matchId, userId) {
    try {
      await api.matches.approvePlayer(matchId, userId);
      loadMatches();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleReject(matchId, userId) {
    try {
      await api.matches.rejectPlayer(matchId, userId);
      loadMatches();
    } catch (err) {
      alert(err.message);
    }
  }

  function handleShare(match) {
    const link = `https://t.me/${BOT_USERNAME}?start=match_${match.id}`;
    const text = `🎾 Матч в ${match.venue?.name || 'PadelMate'} — присоединяйся!`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
    openTelegramLink(shareUrl);
  }

  function openEdit(match) {
    setEditForm({
      date: new Date(match.date).toISOString().slice(0, 16),
      durationMin: match.durationMin,
      levelMin: match.levelMin,
      levelMax: match.levelMax,
      courtBooked: match.courtBooked,
      matchType: match.matchType,
      notes: match.notes || '',
    });
    setEditingMatch(match);
  }

  async function handleEditSave() {
    try {
      await api.matches.update(editingMatch.id, editForm);
      setEditingMatch(null);
      loadMatches();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div style={{ paddingBottom: 80 }}>
      <Header title="Матчи" subtitle="Найди игру или создай свою" />

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <FilterTabs
            options={[
              { value: 'recruiting', label: 'Идёт набор' },
              { value: 'full', label: 'Набраны' },
              { value: 'all', label: 'Все' },
            ]}
            value={filter}
            onChange={setFilter}
          />
        </div>
        <Button size="sm" onClick={() => onNavigate('createMatch')}>
          + Создать
        </Button>
      </div>

      {loading && (
        <p style={{ textAlign: 'center', color: COLORS.textDim, padding: 40 }}>Загрузка...</p>
      )}

      {!loading && matches.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <span style={{ fontSize: 48 }}>{'\u{1F3BE}'}</span>
          <p style={{ color: COLORS.textDim, marginTop: 12 }}>Матчей пока нет</p>
          <Button onClick={() => onNavigate('createMatch')} style={{ marginTop: 16 }}>
            Создать первый матч
          </Button>
        </div>
      )}

      {matches.map((match) => {
        const myPlayer = match.players?.find((p) => p.user.id === user?.id);
        const isInMatch = !!myPlayer;
        const isPending = myPlayer?.status === 'PENDING';
        const isCreator = match.creatorId === user?.id;
        const approvedPlayers = match.players?.filter((p) => p.status === 'APPROVED') || [];
        const pendingPlayers = match.players?.filter((p) => p.status === 'PENDING') || [];
        const isFull = approvedPlayers.length >= 4;
        const canJoin = !isInMatch && !isFull && match.status === 'RECRUITING';
        const canScore = ['FULL', 'PENDING_SCORE'].includes(match.status) && isInMatch && !isPending;

        const team1 = approvedPlayers.filter((p) => p.team === 1);
        const team2 = approvedPlayers.filter((p) => p.team === 2);

        const isHighlighted = highlightMatchId === match.id;

        return (
          <Card key={match.id} style={{ marginBottom: 10, ...(isHighlighted ? { border: `1px solid ${COLORS.accent}`, boxShadow: `0 0 12px ${COLORS.accent}30` } : {}) }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>
                  {new Date(match.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                </span>
                <span style={{ fontSize: 13, color: COLORS.textDim }}>
                  {new Date(match.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <Badge>{match.durationMin} мин</Badge>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <Badge variant="accent">{match.levelMin}-{match.levelMax}</Badge>
                {match.courtBooked && <Badge variant="success">{'\u2705'}</Badge>}
                {match.matchType === 'FRIENDLY' && <Badge variant="default">{'\u{1F60A}'}</Badge>}
              </div>
            </div>

            <p style={{ fontSize: 13, color: COLORS.textDim, marginBottom: 8 }}>
              {match.venue?.name}
            </p>

            {/* Players by team (approved only) */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                {/* Team 1 */}
                <div style={{ flex: 1 }}>
                  {team1.map((p) => (
                    <PlayerRow key={p.user.id} player={p} isCreator={p.user.id === match.creatorId} />
                  ))}
                  {team1.length < 2 && Array.from({ length: 2 - team1.length }).map((_, i) => (
                    <EmptySlot key={`e1-${i}`} />
                  ))}
                </div>
                {/* VS divider */}
                <div style={{ display: 'flex', alignItems: 'center', color: COLORS.textMuted, fontSize: 12, fontWeight: 700 }}>vs</div>
                {/* Team 2 */}
                <div style={{ flex: 1 }}>
                  {team2.map((p) => (
                    <PlayerRow key={p.user.id} player={p} isCreator={p.user.id === match.creatorId} />
                  ))}
                  {team2.length < 2 && Array.from({ length: 2 - team2.length }).map((_, i) => (
                    <EmptySlot key={`e2-${i}`} />
                  ))}
                </div>
              </div>
            </div>

            {/* Pending players (visible to creator) */}
            {isCreator && pendingPlayers.length > 0 && (
              <div style={{ marginBottom: 10, padding: 8, borderRadius: 10, background: 'rgba(255,193,7,0.08)', border: '1px solid rgba(255,193,7,0.2)' }}>
                <div style={{ fontSize: 12, color: '#FFC107', fontWeight: 600, marginBottom: 6 }}>
                  Заявки ({pendingPlayers.length})
                </div>
                {pendingPlayers.map((p) => (
                  <div key={p.user.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Avatar src={p.user.photoUrl} name={p.user.firstName} size={28} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: COLORS.text, fontWeight: 500 }}>{p.user.firstName}</div>
                      <div style={{ fontSize: 11, color: COLORS.textDim }}>{p.user.rating}</div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(match.id, p.user.id)}
                      style={{ padding: '4px 10px', fontSize: 12 }}
                    >
                      Принять
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleReject(match.id, p.user.id)}
                      style={{ padding: '4px 10px', fontSize: 12 }}
                    >
                      Отклонить
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Pending indicator for non-creator who applied */}
            {isPending && !isCreator && (
              <div style={{
                marginBottom: 10,
                padding: '8px 12px',
                borderRadius: 10,
                background: 'rgba(255,193,7,0.08)',
                border: '1px solid rgba(255,193,7,0.2)',
                fontSize: 13,
                color: '#FFC107',
                textAlign: 'center',
              }}>
                Заявка отправлена, ожидает одобрения
              </div>
            )}

            {match.notes && (
              <p style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 8, fontStyle: 'italic' }}>
                {match.notes}
              </p>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {canJoin && (
                <Button size="sm" onClick={() => handleJoin(match.id)} fullWidth>
                  Подать заявку
                </Button>
              )}
              {isPending && !isCreator && (
                <Button size="sm" variant="danger" onClick={() => handleLeave(match.id)}>
                  Отменить заявку
                </Button>
              )}
              {isInMatch && !isPending && match.status === 'RECRUITING' && (
                <Button size="sm" variant="danger" onClick={() => handleLeave(match.id)}>
                  {isCreator ? 'Удалить матч' : 'Покинуть'}
                </Button>
              )}
              {isCreator && ['RECRUITING', 'FULL'].includes(match.status) && (
                <>
                  <Button size="sm" variant="outline" onClick={() => openEdit(match)}>
                    Редактировать
                  </Button>
                  {match.status === 'FULL' && (
                    <Button size="sm" variant="danger" onClick={() => handleDelete(match.id)}>
                      Удалить
                    </Button>
                  )}
                </>
              )}
              {canScore && (
                <Button size="sm" variant="outline" onClick={() => onNavigate('score', { matchId: match.id })} fullWidth>
                  {'\u270F\uFE0F'} Записать счёт
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => handleShare(match)}
                style={{ padding: '4px 10px', fontSize: 12 }}>
                {'\u{1F517}'} Поделиться
              </Button>
            </div>
          </Card>
        );
      })}

      {/* Edit match modal */}
      <Modal isOpen={!!editingMatch} title="Редактировать матч" onClose={() => setEditingMatch(null)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input
            label="Дата и время"
            type="datetime-local"
            value={editForm.date || ''}
            onChange={(val) => setEditForm({ ...editForm, date: val })}
          />
          <Select
            label="Длительность"
            value={editForm.durationMin}
            onChange={(val) => setEditForm({ ...editForm, durationMin: parseInt(val) })}
            options={[
              { value: 60, label: '60 мин' },
              { value: 90, label: '90 мин' },
              { value: 120, label: '120 мин' },
            ]}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <Select
              label="Мин. уровень"
              value={editForm.levelMin}
              onChange={(val) => setEditForm({ ...editForm, levelMin: parseFloat(val) })}
              options={[1, 1.5, 2, 2.5, 3, 3.5, 4].map((v) => ({ value: v, label: String(v) }))}
            />
            <Select
              label="Макс. уровень"
              value={editForm.levelMax}
              onChange={(val) => setEditForm({ ...editForm, levelMax: parseFloat(val) })}
              options={[1, 1.5, 2, 2.5, 3, 3.5, 4].map((v) => ({ value: v, label: String(v) }))}
            />
          </div>
          <Select
            label="Тип матча"
            value={editForm.matchType}
            onChange={(val) => setEditForm({ ...editForm, matchType: val })}
            options={[
              { value: 'RATED', label: 'Рейтинговый' },
              { value: 'FRIENDLY', label: 'Дружеский' },
            ]}
          />
          <Input
            label="Заметки"
            value={editForm.notes || ''}
            onChange={(val) => setEditForm({ ...editForm, notes: val })}
            placeholder="Заметки..."
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Button onClick={handleEditSave} fullWidth>Сохранить</Button>
            <Button variant="outline" onClick={() => setEditingMatch(null)} fullWidth>Отмена</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function PlayerRow({ player, isCreator }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
      <Avatar src={player.user.photoUrl} name={player.user.firstName} size={28} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: COLORS.text, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {player.user.firstName}
          {isCreator && <span style={{ fontSize: 10, color: COLORS.accent, marginLeft: 4 }}>ORG</span>}
        </div>
        <div style={{ fontSize: 11, color: COLORS.textDim }}>{player.user.rating}</div>
      </div>
    </div>
  );
}

function EmptySlot() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          border: `2px dashed ${COLORS.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          color: COLORS.textMuted,
        }}
      >
        +
      </div>
      <span style={{ fontSize: 12, color: COLORS.textMuted }}>Свободно</span>
    </div>
  );
}
