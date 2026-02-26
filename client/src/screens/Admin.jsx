import React, { useEffect, useState } from 'react';
import { COLORS, getLevel } from '../config';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { api } from '../services/api';

export function Admin({ onBack }) {
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [newRating, setNewRating] = useState('');

  useEffect(() => {
    loadData();
  }, [tab]);

  async function loadData() {
    setLoading(true);
    try {
      if (tab === 'stats') {
        const data = await api.admin.stats();
        setStats(data);
      } else if (tab === 'users') {
        const data = await api.admin.users();
        setUsers(data);
      } else if (tab === 'matches') {
        const data = await api.admin.matches();
        setMatches(data);
      }
    } catch (err) {
      console.error('Admin load error:', err);
    }
    setLoading(false);
  }

  async function handleSaveRating() {
    if (!editingUser || !newRating) return;
    const val = parseInt(newRating);
    if (isNaN(val) || val < 500 || val > 5000) return;
    try {
      await api.admin.editUser(editingUser.id, { rating: val });
      setEditingUser(null);
      setNewRating('');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleToggleAdmin(userId, currentAdmin) {
    try {
      await api.admin.editUser(userId, { isAdmin: !currentAdmin });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDeleteUser(userId, name) {
    if (!confirm(`Удалить ${name}?`)) return;
    try {
      await api.admin.deleteUser(userId);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDeleteMatch(matchId) {
    if (!confirm(`Удалить матч #${matchId}?`)) return;
    try {
      await api.admin.deleteMatch(matchId);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  }

  const STATUS_LABELS = {
    RECRUITING: 'Набор',
    FULL: 'Собран',
    IN_PROGRESS: 'Играют',
    PENDING_SCORE: 'Счёт',
    PENDING_CONFIRMATION: 'Подтв.',
    COMPLETED: 'Завершён',
    CANCELLED: 'Отменён',
  };

  const STATUS_COLORS = {
    RECRUITING: COLORS.accent,
    FULL: COLORS.purple,
    COMPLETED: '#4CAF50',
    CANCELLED: COLORS.danger,
  };

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: 'none', color: COLORS.accent,
            fontSize: 20, cursor: 'pointer', padding: '4px 8px',
          }}
        >
          {'\u2190'}
        </button>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: COLORS.text, margin: 0 }}>
            {'\u2699\uFE0F'} Админ-панель
          </h2>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 20, background: COLORS.surface,
        borderRadius: 14, padding: 4,
      }}>
        {[
          { key: 'stats', label: 'Обзор', icon: '\uD83D\uDCCA' },
          { key: 'users', label: 'Игроки', icon: '\uD83D\uDC65' },
          { key: 'matches', label: 'Матчи', icon: '\uD83C\uDFBE' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 12, border: 'none',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: tab === t.key ? COLORS.accent : 'transparent',
              color: tab === t.key ? '#000' : COLORS.textDim,
              transition: 'all 0.2s',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 60, color: COLORS.textDim }}>
          <span style={{ fontSize: 32, display: 'block', marginBottom: 8 }}>{'\u23F3'}</span>
          Загрузка...
        </div>
      )}

      {/* Stats */}
      {!loading && tab === 'stats' && stats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <StatCard icon={'\uD83D\uDC65'} label="Игроков" value={stats.totalUsers} color={COLORS.accent} />
            <StatCard icon={'\uD83C\uDFBE'} label="Матчей" value={stats.totalMatches} color={COLORS.purple} />
            <StatCard icon={'\u{1F7E2}'} label="Активных" value={stats.activeMatches} color="#4CAF50" />
            <StatCard icon={'\u2705'} label="Завершённых" value={stats.completedMatches} color={COLORS.accent} />
          </div>
          {stats.totalTournaments > 0 && (
            <StatCard icon={'\uD83C\uDFC6'} label="Турниров" value={stats.totalTournaments} color={COLORS.warning} />
          )}
        </div>
      )}

      {/* Users */}
      {!loading && tab === 'users' && (
        <div>
          <div style={{
            fontSize: 13, color: COLORS.textDim, marginBottom: 12,
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span>{'\uD83D\uDC65'} Всего: {users.length}</span>
          </div>
          {users.map((u) => {
            const level = getLevel(u.rating);
            return (
              <Card key={u.id} style={{ marginBottom: 10, padding: 14 }}>
                {/* Top row: name + rating */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>
                        {u.firstName} {u.lastName || ''}
                      </span>
                      {u.isAdmin && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 6,
                          background: `${COLORS.accent}20`, color: COLORS.accent,
                        }}>
                          ADMIN
                        </span>
                      )}
                    </div>
                    {u.username && (
                      <div style={{ fontSize: 12, color: COLORS.textDim, marginTop: 2 }}>@{u.username}</div>
                    )}
                  </div>
                  <div style={{
                    textAlign: 'right', padding: '4px 10px', borderRadius: 10,
                    background: `${COLORS.accent}15`,
                  }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.accent }}>{u.rating}</div>
                    <div style={{ fontSize: 10, color: COLORS.textDim }}>{level?.name || ''}</div>
                  </div>
                </div>

                {/* Stats row */}
                <div style={{
                  display: 'flex', gap: 12, fontSize: 12, color: COLORS.textDim, marginBottom: 10,
                  padding: '6px 10px', background: `${COLORS.bg}80`, borderRadius: 8,
                }}>
                  <span>{'\uD83C\uDFD9\uFE0F'} {u.city}</span>
                  <span>{'\uD83C\uDFBE'} {u.matchesPlayed}</span>
                  <span style={{ color: '#4CAF50' }}>{'\u2705'} {u.wins}</span>
                  <span style={{ color: COLORS.danger }}>{'\u274C'} {u.losses}</span>
                  <span>{'\u2B50'} {u.xp}</span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => { setEditingUser(u); setNewRating(String(u.rating)); }}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 10, border: `1px solid ${COLORS.border}`,
                      background: 'transparent', color: COLORS.text, fontSize: 12, fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {'\u270F\uFE0F'} Рейтинг
                  </button>
                  <button
                    onClick={() => handleToggleAdmin(u.id, u.isAdmin)}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 10, border: `1px solid ${COLORS.border}`,
                      background: 'transparent', color: u.isAdmin ? COLORS.warning : COLORS.purple,
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    {u.isAdmin ? '\uD83D\uDEAB Убрать' : '\uD83D\uDC51 Админ'}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(u.id, u.firstName)}
                    style={{
                      padding: '8px 12px', borderRadius: 10, border: `1px solid ${COLORS.danger}30`,
                      background: 'transparent', color: COLORS.danger,
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    {'\uD83D\uDDD1\uFE0F'}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Matches */}
      {!loading && tab === 'matches' && (
        <div>
          <div style={{ fontSize: 13, color: COLORS.textDim, marginBottom: 12 }}>
            {'\uD83C\uDFBE'} Последние 50 матчей
          </div>
          {matches.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: COLORS.textDim }}>Матчей пока нет</div>
          )}
          {matches.map((m) => {
            const statusColor = STATUS_COLORS[m.status] || COLORS.textDim;
            const statusLabel = STATUS_LABELS[m.status] || m.status;
            const date = new Date(m.date);
            return (
              <Card key={m.id} style={{ marginBottom: 10, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>#{m.id}</span>
                    <span style={{ fontSize: 13, color: COLORS.textDim }}>
                      {date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                      {' '}
                      {date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 8,
                    background: `${statusColor}20`, color: statusColor,
                  }}>
                    {statusLabel}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: COLORS.textDim, marginBottom: 4 }}>
                  {'\uD83D\uDCCD'} {m.venue?.name || '—'}
                </div>
                {m.players?.length > 0 && (
                  <div style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 8 }}>
                    {'\uD83D\uDC65'} {m.players.map((p) => p.user.firstName).join(', ')}
                  </div>
                )}
                <button
                  onClick={() => handleDeleteMatch(m.id)}
                  style={{
                    padding: '6px 12px', borderRadius: 8, border: `1px solid ${COLORS.danger}30`,
                    background: 'transparent', color: COLORS.danger,
                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {'\uD83D\uDDD1\uFE0F'} Удалить
                </button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Rating Edit Modal */}
      {editingUser && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000, padding: 20,
          }}
          onClick={() => setEditingUser(null)}
        >
          <div
            style={{
              background: COLORS.card, borderRadius: 20, padding: 24,
              width: '100%', maxWidth: 340,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>
              {'\u270F\uFE0F'} Изменить рейтинг
            </h3>
            <p style={{ fontSize: 13, color: COLORS.textDim, marginBottom: 20 }}>
              {editingUser.firstName} {editingUser.lastName || ''} — текущий: {editingUser.rating}
            </p>

            <input
              type="number"
              value={newRating}
              onChange={(e) => setNewRating(e.target.value)}
              min={500}
              max={5000}
              placeholder="500 — 5000"
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 14,
                border: `1px solid ${COLORS.border}`, background: COLORS.surface,
                color: COLORS.text, fontSize: 18, fontWeight: 700,
                fontFamily: 'inherit', outline: 'none', textAlign: 'center',
                boxSizing: 'border-box',
              }}
              autoFocus
            />

            {newRating && (parseInt(newRating) < 500 || parseInt(newRating) > 5000) && (
              <p style={{ color: COLORS.danger, fontSize: 12, marginTop: 6, textAlign: 'center' }}>
                Допустимый диапазон: 500 — 5000
              </p>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                onClick={() => setEditingUser(null)}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 14, border: `1px solid ${COLORS.border}`,
                  background: 'transparent', color: COLORS.textDim, fontSize: 14,
                  fontWeight: 600, cursor: 'pointer',
                }}
              >
                Отмена
              </button>
              <button
                onClick={handleSaveRating}
                disabled={!newRating || parseInt(newRating) < 500 || parseInt(newRating) > 5000}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 14, border: 'none',
                  background: newRating && parseInt(newRating) >= 500 && parseInt(newRating) <= 5000
                    ? COLORS.accent : COLORS.border,
                  color: newRating && parseInt(newRating) >= 500 && parseInt(newRating) <= 5000
                    ? '#000' : COLORS.textDim,
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <Card style={{ textAlign: 'center', padding: 16 }}>
      <div style={{ fontSize: 24, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: color || COLORS.accent }}>{value}</div>
      <div style={{ fontSize: 12, color: COLORS.textDim, marginTop: 2 }}>{label}</div>
    </Card>
  );
}
