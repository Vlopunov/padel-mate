import React, { useEffect, useState } from 'react';
import { COLORS } from '../config';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Header } from '../components/ui/Header';
import { api } from '../services/api';

export function Admin({ onBack }) {
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

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

  async function handleEditRating(userId, currentRating) {
    const newRating = prompt('Новый рейтинг:', currentRating);
    if (!newRating) return;
    try {
      await api.admin.editUser(userId, { rating: parseInt(newRating) });
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

  const tabStyle = (active) => ({
    padding: '8px 16px',
    borderRadius: 20,
    border: 'none',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    background: active ? COLORS.accent : COLORS.surface,
    color: active ? '#000' : COLORS.textDim,
  });

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Button size="sm" variant="outline" onClick={onBack}>Назад</Button>
        <Header title="Админ-панель" subtitle="Управление PadelMate" />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button style={tabStyle(tab === 'stats')} onClick={() => setTab('stats')}>Статистика</button>
        <button style={tabStyle(tab === 'users')} onClick={() => setTab('users')}>Игроки</button>
        <button style={tabStyle(tab === 'matches')} onClick={() => setTab('matches')}>Матчи</button>
      </div>

      {loading && <p style={{ textAlign: 'center', color: COLORS.textDim, padding: 40 }}>Загрузка...</p>}

      {/* Stats */}
      {!loading && tab === 'stats' && stats && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <StatCard label="Всего игроков" value={stats.totalUsers} />
          <StatCard label="Всего матчей" value={stats.totalMatches} />
          <StatCard label="Активных матчей" value={stats.activeMatches} />
          <StatCard label="Завершённых" value={stats.completedMatches} />
          <StatCard label="Турниров" value={stats.totalTournaments} />
        </div>
      )}

      {/* Users */}
      {!loading && tab === 'users' && (
        <div>
          <p style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 8 }}>Всего: {users.length}</p>
          {users.map((u) => (
            <Card key={u.id} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>
                    {u.firstName} {u.lastName || ''}
                  </span>
                  {u.username && <span style={{ fontSize: 12, color: COLORS.textDim, marginLeft: 6 }}>@{u.username}</span>}
                  {u.isAdmin && <Badge variant="accent" style={{ marginLeft: 6 }}>ADMIN</Badge>}
                </div>
                <Badge variant="default">{u.rating}</Badge>
              </div>
              <div style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 8 }}>
                {u.city} | {u.matchesPlayed}M {u.wins}W {u.losses}L | XP: {u.xp}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Button size="sm" variant="outline" onClick={() => handleEditRating(u.id, u.rating)}
                  style={{ padding: '4px 8px', fontSize: 11 }}>
                  Рейтинг
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleToggleAdmin(u.id, u.isAdmin)}
                  style={{ padding: '4px 8px', fontSize: 11 }}>
                  {u.isAdmin ? 'Убрать админа' : 'Сделать админом'}
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleDeleteUser(u.id, u.firstName)}
                  style={{ padding: '4px 8px', fontSize: 11 }}>
                  Удалить
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Matches */}
      {!loading && tab === 'matches' && (
        <div>
          <p style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 8 }}>Последние 50 матчей</p>
          {matches.map((m) => (
            <Card key={m.id} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ fontSize: 13, color: COLORS.text }}>
                  <span style={{ fontWeight: 600 }}>#{m.id}</span>
                  {' '}
                  {new Date(m.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                  {' '}
                  {new Date(m.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <Badge variant={m.status === 'COMPLETED' ? 'success' : m.status === 'RECRUITING' ? 'accent' : 'default'}>
                  {m.status}
                </Badge>
              </div>
              <div style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 4 }}>
                {m.venue?.name} | {m.players?.length || 0} игроков
              </div>
              <div style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 6 }}>
                {m.players?.map((p) => p.user.firstName).join(', ')}
              </div>
              <Button size="sm" variant="danger" onClick={() => handleDeleteMatch(m.id)}
                style={{ padding: '4px 8px', fontSize: 11 }}>
                Удалить
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <Card style={{ textAlign: 'center', padding: 16 }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.accent }}>{value}</div>
      <div style={{ fontSize: 12, color: COLORS.textDim, marginTop: 4 }}>{label}</div>
    </Card>
  );
}
