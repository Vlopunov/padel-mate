import React, { useEffect, useState } from 'react';
import { COLORS, CITIES, LEVELS, getLevel, getLevelByValue } from '../config';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Checkbox } from '../components/ui/Checkbox';
import { api } from '../services/api';
import { MiniChart } from '../components/ui/MiniChart';

const TOURNAMENT_STATUSES = [
  { value: 'UPCOMING', label: 'Скоро' },
  { value: 'REGISTRATION', label: 'Регистрация' },
  { value: 'IN_PROGRESS', label: 'Идёт' },
  { value: 'COMPLETED', label: 'Завершён' },
];

const T_STATUS_COLORS = {
  UPCOMING: COLORS.textDim,
  REGISTRATION: COLORS.accent,
  IN_PROGRESS: COLORS.warning,
  COMPLETED: '#4CAF50',
};

const T_STATUS_LABELS = {
  UPCOMING: 'Скоро',
  REGISTRATION: 'Регистрация',
  IN_PROGRESS: 'Идёт',
  COMPLETED: 'Завершён',
};

const FORMAT_OPTIONS = [
  { value: 'americano', label: 'Americano' },
  { value: 'mexicano', label: 'Mexicano' },
  { value: 'round_robin', label: 'Круговой' },
  { value: 'single_elimination', label: 'Олимпийская' },
  { value: 'double_elimination', label: 'Двойная элиминация' },
  { value: 'mixto', label: 'Микст' },
];

const FORMAT_LABELS = {
  americano: 'Americano',
  mexicano: 'Mexicano',
  round_robin: 'Круговой',
  single_elimination: 'Олимпийская',
  double_elimination: 'Двойная элиминация',
  mixto: 'Микст',
};

const POINTS_PER_MATCH_OPTIONS = [
  { value: '12', label: '12 очков' },
  { value: '16', label: '16 очков' },
  { value: '24', label: '24 очка' },
  { value: '32', label: '32 очка' },
];

const REGISTRATION_MODE_OPTIONS = [
  { value: 'INDIVIDUAL', label: 'Индивидуальная' },
  { value: 'TEAMS', label: 'Парная' },
];

// ─── Match constants ───

const MATCH_STATUS_LABELS = {
  RECRUITING: 'Набор', FULL: 'Собран', IN_PROGRESS: 'Играют',
  PENDING_SCORE: 'Счёт', PENDING_CONFIRMATION: 'Подтв.',
  COMPLETED: 'Завершён', CANCELLED: 'Отменён',
};

const MATCH_STATUS_COLORS = {
  RECRUITING: COLORS.accent, FULL: COLORS.purple, IN_PROGRESS: COLORS.warning,
  PENDING_SCORE: COLORS.warning, PENDING_CONFIRMATION: COLORS.warning,
  COMPLETED: '#4CAF50', CANCELLED: COLORS.danger,
};

const MATCH_STATUS_OPTIONS = [
  { value: 'RECRUITING', label: 'Набор' },
  { value: 'FULL', label: 'Собран' },
  { value: 'PENDING_CONFIRMATION', label: 'Подтверждение' },
  { value: 'COMPLETED', label: 'Завершён' },
  { value: 'CANCELLED', label: 'Отменён' },
];

const PLAYER_STATUS_COLORS = {
  APPROVED: '#4CAF50',
  PENDING: COLORS.warning,
  INVITED: COLORS.purple,
};

const PLAYER_STATUS_LABELS = {
  APPROVED: 'Принят',
  PENDING: 'Заявка',
  INVITED: 'Приглашён',
};

// Multi-court venues (same as CreateMatch)
const MULTI_COURT_VENUES = ['360 Padel Arena', '375 Padel Club', 'Padel Club Minsk'];

// Generate time slots every 30 min from 06:00 to 23:30
const TIME_SLOTS = [];
for (let h = 6; h <= 23; h++) {
  TIME_SLOTS.push({ value: `${String(h).padStart(2, '0')}:00`, label: `${String(h).padStart(2, '0')}:00` });
  TIME_SLOTS.push({ value: `${String(h).padStart(2, '0')}:30`, label: `${String(h).padStart(2, '0')}:30` });
}

export function Admin({ onBack }) {
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState([]);
  const [users, setUsers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [newRating, setNewRating] = useState('');

  // Match state
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showMatchEditForm, setShowMatchEditForm] = useState(false);
  const [matchFilter, setMatchFilter] = useState('all');

  // Tournament create/edit state
  const [showTournamentForm, setShowTournamentForm] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [tForm, setTForm] = useState({
    name: '', description: '', date: '', endDate: '', city: 'MINSK',
    venueId: '', format: 'americano', levelMin: '1.0', levelMax: '4.0',
    maxTeams: '16', price: '', ratingMultiplier: '1.0', status: 'REGISTRATION',
    pointsPerMatch: '24', courtsCount: '1', registrationMode: 'INDIVIDUAL',
  });

  useEffect(() => {
    loadData();
  }, [tab]);

  // Load venues for forms
  useEffect(() => {
    api.venues.list().then(setVenues).catch(console.error);
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      if (tab === 'stats') {
        const [statsData, analyticsData] = await Promise.all([
          api.admin.stats(),
          api.admin.analytics(30),
        ]);
        setStats(statsData);
        setAnalytics(analyticsData);
      } else if (tab === 'users') {
        const data = await api.admin.users();
        setUsers(data);
      } else if (tab === 'matches') {
        const data = await api.admin.matches();
        setMatches(data);
      } else if (tab === 'tournaments') {
        const [tournamentsData, usersData] = await Promise.all([
          api.admin.tournaments(),
          api.admin.users(),
        ]);
        setTournaments(tournamentsData);
        setUsers(usersData);
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

  async function handleToggleVip(userId, currentVip) {
    try {
      await api.admin.editUser(userId, { isVip: !currentVip });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleToggleCoach(userId, currentCoach) {
    try {
      await api.admin.editUser(userId, { isCoach: !currentCoach });
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
      setSelectedMatch(null);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleUpdateMatch(matchId, data) {
    try {
      const updated = await api.admin.updateMatch(matchId, data);
      // Update in matches list
      setMatches((prev) => prev.map((m) => (m.id === matchId ? updated : m)));
      setSelectedMatch(updated);
      return updated;
    } catch (err) {
      alert(err.message || 'Ошибка обновления');
    }
  }

  async function handleRemovePlayer(matchId, userId) {
    if (!confirm('Удалить игрока из матча?')) return;
    try {
      await api.admin.removePlayer(matchId, userId);
      // Reload match data
      const data = await api.admin.matches();
      setMatches(data);
      const updated = data.find((m) => m.id === matchId);
      if (updated) setSelectedMatch(updated);
    } catch (err) {
      alert(err.message);
    }
  }

  // ─── Tournament handlers ───

  function openCreateTournament() {
    setEditingTournament(null);
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setTForm({
      name: '', description: '', date: `${yyyy}-${mm}-${dd}`, endDate: '',
      city: 'MINSK', venueId: venues.length > 0 ? String(venues[0].id) : '',
      format: 'americano', levelMin: '1.0', levelMax: '4.0',
      maxTeams: '16', price: '', ratingMultiplier: '1.0', status: 'REGISTRATION',
      pointsPerMatch: '24', courtsCount: '1', registrationMode: 'INDIVIDUAL',
    });
    setShowTournamentForm(true);
  }

  function openEditTournament(t) {
    setEditingTournament(t);
    const d = new Date(t.date);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    let endDateStr = '';
    if (t.endDate) {
      const ed = new Date(t.endDate);
      endDateStr = `${ed.getFullYear()}-${String(ed.getMonth() + 1).padStart(2, '0')}-${String(ed.getDate()).padStart(2, '0')}`;
    }
    setTForm({
      name: t.name, description: t.description || '', date: dateStr, endDate: endDateStr,
      city: t.city, venueId: String(t.venueId), format: t.format,
      levelMin: String(t.levelMin), levelMax: String(t.levelMax),
      maxTeams: String(t.maxTeams), price: t.price || '',
      ratingMultiplier: String(t.ratingMultiplier), status: t.status,
      pointsPerMatch: String(t.pointsPerMatch || 24),
      courtsCount: String(t.courtsCount || 1),
      registrationMode: t.registrationMode || 'TEAMS',
    });
    setShowTournamentForm(true);
  }

  async function handleSaveTournament() {
    if (!tForm.name || !tForm.date || !tForm.venueId) {
      alert('Заполните название, дату и площадку');
      return;
    }
    try {
      if (editingTournament) {
        await api.admin.updateTournament(editingTournament.id, tForm);
      } else {
        await api.admin.createTournament(tForm);
      }
      setShowTournamentForm(false);
      setEditingTournament(null);
      loadData();
    } catch (err) {
      alert(err.message || 'Ошибка');
    }
  }

  async function handleDeleteTournament(id, name) {
    if (!confirm(`Удалить турнир "${name}"?`)) return;
    try {
      await api.admin.deleteTournament(id);
      setSelectedTournament(null);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDeleteRegistration(tournamentId, regId) {
    if (!confirm('Удалить регистрацию?')) return;
    try {
      await api.admin.deleteRegistration(tournamentId, regId);
      const data = await api.admin.tournaments();
      setTournaments(data);
      const updated = data.find((t) => t.id === selectedTournament?.id);
      if (updated) setSelectedTournament(updated);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleAddPlayer(tournamentId, userId) {
    try {
      await api.admin.addPlayerToTournament(tournamentId, userId);
      const data = await api.admin.tournaments();
      setTournaments(data);
      const updated = data.find((t) => t.id === selectedTournament?.id);
      if (updated) setSelectedTournament(updated);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleChangeStatus(tournamentId, newStatus) {
    try {
      await api.admin.updateTournament(tournamentId, { status: newStatus });
      loadData();
      if (selectedTournament?.id === tournamentId) {
        setSelectedTournament((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert(err.message);
    }
  }

  const levelOptions = LEVELS.map((l) => ({
    value: l.level.toFixed(1),
    label: `${l.category} — ${l.name}`,
  }));

  const filteredVenues = venues.filter((v) => v.city === tForm.city);

  // Match filter logic
  const filteredMatches = matchFilter === 'all'
    ? matches
    : matches.filter((m) => {
        if (matchFilter === 'active') return ['RECRUITING', 'FULL'].includes(m.status);
        if (matchFilter === 'completed') return m.status === 'COMPLETED';
        if (matchFilter === 'cancelled') return m.status === 'CANCELLED';
        if (matchFilter === 'pending') return ['PENDING_SCORE', 'PENDING_CONFIRMATION'].includes(m.status);
        return true;
      });

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
          { key: 'tournaments', label: 'Турниры', icon: '\uD83C\uDFC6' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key);
              setSelectedTournament(null);
              setShowTournamentForm(false);
              setSelectedMatch(null);
              setShowMatchEditForm(false);
            }}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 12, border: 'none',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
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

      {/* Stats — Analytics Dashboard */}
      {!loading && tab === 'stats' && stats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Totals grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <StatCard icon={'\uD83D\uDC65'} label="Игроков" value={stats.totalUsers} color={COLORS.accent} />
            <StatCard icon={'\uD83C\uDFBE'} label="Матчей" value={stats.totalMatches} color={COLORS.purple} />
            <StatCard icon={'\u{1F7E2}'} label="Активных" value={stats.activeMatches} color="#4CAF50" />
            <StatCard icon={'\u2705'} label="Завершённых" value={stats.completedMatches} color={COLORS.accent} />
          </div>

          {stats.totalTournaments > 0 && (
            <StatCard icon={'\uD83C\uDFC6'} label="Турниров" value={stats.totalTournaments} color={COLORS.warning} />
          )}

          {/* Today summary with comparison */}
          {stats.today && (
            <Card style={{ padding: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 12 }}>
                {'\uD83D\uDCC5'} Сегодня
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <TodayStat label="Новых" value={stats.today.newUsers} prev={stats.yesterday?.newUsers} />
                <TodayStat label="Матчей" value={stats.today.newMatches} prev={stats.yesterday?.newMatches} />
                <TodayStat label="Активных" value={stats.today.activeUsers} prev={stats.yesterday?.activeUsers} />
              </div>
              {stats.today.topRatingChange > 0 && (
                <div style={{ marginTop: 10, fontSize: 12, color: COLORS.textDim }}>
                  {'\uD83D\uDCC8'} Лучший рейтинг-скачок: <span style={{ color: COLORS.accent, fontWeight: 700 }}>+{stats.today.topRatingChange}</span>
                </div>
              )}
            </Card>
          )}

          {/* Users growth chart */}
          {analytics.length >= 2 && (
            <Card style={{ padding: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 8 }}>
                {'\uD83D\uDC65'} Рост игроков
              </div>
              <MiniChart
                data={analytics.map((d) => ({
                  label: new Date(d.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
                  value: d.totalUsers,
                }))}
                color={COLORS.accent}
              />
            </Card>
          )}

          {/* Matches per day chart */}
          {analytics.length >= 2 && (
            <Card style={{ padding: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 8 }}>
                {'\uD83C\uDFBE'} Матчей в день
              </div>
              <MiniChart
                data={analytics.map((d) => ({
                  label: new Date(d.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
                  value: d.newMatches,
                }))}
                color={COLORS.purple}
              />
            </Card>
          )}

          {/* City breakdown */}
          {stats.today?.cityCounts && Object.keys(stats.today.cityCounts).length > 0 && (
            <Card style={{ padding: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 10 }}>
                {'\uD83C\uDFD9\uFE0F'} По городам
              </div>
              {Object.entries(stats.today.cityCounts).map(([city, count]) => (
                <div key={city} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 0', borderBottom: `1px solid ${COLORS.border}`,
                }}>
                  <span style={{ fontSize: 13, color: COLORS.textDim }}>
                    {CITIES.find((c) => c.value === city)?.label || city}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>{count}</span>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}

      {/* Users */}
      {!loading && tab === 'users' && (
        <div>
          <div style={{
            fontSize: 13, color: COLORS.textDim, marginBottom: 12,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span>{'\uD83D\uDC65'} Всего: {users.length}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={async () => {
                  const count = prompt('Сколько тестовых юзеров создать?', '16');
                  if (!count) return;
                  try {
                    const res = await api.admin.createTestUsers(parseInt(count));
                    alert(`Создано ${res.created} тестовых юзеров`);
                    loadData();
                  } catch (e) { alert('Ошибка: ' + e.message); }
                }}
                style={{
                  padding: '6px 10px', borderRadius: 8, border: `1px solid ${COLORS.accent}40`,
                  background: `${COLORS.accent}15`, color: COLORS.accent,
                  fontSize: 11, fontWeight: 600, cursor: 'pointer',
                }}
              >
                + Тест юзеры
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!confirm('Удалить ВСЕ тестовые аккаунты?')) return;
                  try {
                    const res = await api.admin.deleteTestUsers();
                    alert(`Удалено ${res.deleted} тестовых юзеров`);
                    loadData();
                  } catch (e) { alert('Ошибка: ' + e.message); }
                }}
                style={{
                  padding: '6px 10px', borderRadius: 8, border: `1px solid ${COLORS.danger}40`,
                  background: `${COLORS.danger}15`, color: COLORS.danger,
                  fontSize: 11, fontWeight: 600, cursor: 'pointer',
                }}
              >
                {'\uD83D\uDDD1'} Удалить тест
              </button>
            </div>
          </div>
          {users.map((u) => {
            const level = getLevel(u.rating);
            return (
              <Card key={u.id} style={{ marginBottom: 10, padding: 14 }}>
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
                      {u.isVip && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 6,
                          background: `${COLORS.gold}25`, color: COLORS.gold,
                        }}>
                          {'\u2B50'} VIP
                        </span>
                      )}
                      {u.isCoach && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 6,
                          background: `${COLORS.purple}20`, color: COLORS.purple,
                        }}>
                          {'\u{1F3BE}'} ТРЕНЕР
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
                    onClick={() => handleToggleVip(u.id, u.isVip)}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 10, border: `1px solid ${COLORS.border}`,
                      background: 'transparent', color: u.isVip ? COLORS.warning : COLORS.gold,
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    {u.isVip ? '\u{1F6AB} VIP' : '\u2B50 VIP'}
                  </button>
                  <button
                    onClick={() => handleToggleCoach(u.id, u.isCoach)}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 10, border: `1px solid ${COLORS.border}`,
                      background: u.isCoach ? `${COLORS.purple}15` : 'transparent',
                      color: u.isCoach ? COLORS.warning : COLORS.purple,
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    {u.isCoach ? '\u{1F6AB} Тренер' : '\u{1F3BE} Тренер'}
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

      {/* ─── Matches ─── */}
      {!loading && tab === 'matches' && !selectedMatch && !showMatchEditForm && (
        <div>
          {/* Filter tabs */}
          <div style={{
            display: 'flex', gap: 4, marginBottom: 14, overflowX: 'auto',
            WebkitOverflowScrolling: 'touch', paddingBottom: 2,
          }}>
            {[
              { key: 'all', label: 'Все' },
              { key: 'active', label: 'Активные' },
              { key: 'pending', label: 'Подтв.' },
              { key: 'completed', label: 'Заверш.' },
              { key: 'cancelled', label: 'Отмен.' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setMatchFilter(f.key)}
                style={{
                  padding: '6px 14px', borderRadius: 10, border: 'none', whiteSpace: 'nowrap',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: matchFilter === f.key ? COLORS.accent : COLORS.surface,
                  color: matchFilter === f.key ? '#000' : COLORS.textDim,
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 13, color: COLORS.textDim, marginBottom: 12 }}>
            {'\uD83C\uDFBE'} {filteredMatches.length} {matchFilter === 'all' ? `из ${matches.length}` : ''} матчей
          </div>

          {filteredMatches.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: COLORS.textDim }}>Матчей пока нет</div>
          )}

          {filteredMatches.map((m) => {
            const statusColor = MATCH_STATUS_COLORS[m.status] || COLORS.textDim;
            const statusLabel = MATCH_STATUS_LABELS[m.status] || m.status;
            const date = new Date(m.date);
            const approvedPlayers = m.players?.filter((p) => p.status === 'APPROVED') || [];
            const endTime = new Date(date.getTime() + m.durationMin * 60000);

            return (
              <Card
                key={m.id}
                style={{ marginBottom: 10, padding: 14, cursor: 'pointer' }}
                onClick={() => setSelectedMatch(m)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>#{m.id}</span>
                    <span style={{ fontSize: 13, color: COLORS.textDim }}>
                      {date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                      {' '}
                      {date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      {' \u2014 '}
                      {endTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 8,
                    background: `${statusColor}20`, color: statusColor,
                  }}>
                    {statusLabel}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 10, fontSize: 12, color: COLORS.textDim, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span>{'\uD83D\uDCCD'} {m.venue?.name || '\u2014'}</span>
                  <span>{m.matchType === 'RATED' ? '\uD83C\uDFC6' : '\uD83D\uDE0A'} {m.matchType === 'RATED' ? 'Рейтинг' : 'Друж.'}</span>
                  <span>Ур. {getLevelByValue(m.levelMin).category}\u2014{getLevelByValue(m.levelMax).category}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ color: COLORS.textDim }}>
                    {'\uD83D\uDC65'} {approvedPlayers.length}/4
                  </span>
                  <span style={{ color: COLORS.textDim, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {approvedPlayers.map((p) => p.user.firstName).join(', ') || '\u2014'}
                  </span>
                  {m.sets?.length > 0 && (
                    <span style={{ color: COLORS.accent, fontWeight: 700, flexShrink: 0 }}>
                      {m.sets.map((s) => `${s.team1Score}:${s.team2Score}`).join(' ')}
                    </span>
                  )}
                  <span style={{ color: COLORS.textDim, fontSize: 16 }}>{'\u203A'}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Match Detail */}
      {!loading && tab === 'matches' && selectedMatch && !showMatchEditForm && (
        <MatchDetail
          match={selectedMatch}
          venues={venues}
          onBack={() => setSelectedMatch(null)}
          onEdit={() => setShowMatchEditForm(true)}
          onDelete={() => handleDeleteMatch(selectedMatch.id)}
          onChangeStatus={(status) => handleUpdateMatch(selectedMatch.id, { status })}
          onRemovePlayer={(userId) => handleRemovePlayer(selectedMatch.id, userId)}
        />
      )}

      {/* Match Edit Form */}
      {!loading && tab === 'matches' && showMatchEditForm && selectedMatch && (
        <MatchEditForm
          match={selectedMatch}
          venues={venues}
          onBack={() => setShowMatchEditForm(false)}
          onSave={async (data) => {
            const updated = await handleUpdateMatch(selectedMatch.id, data);
            if (updated) setShowMatchEditForm(false);
          }}
        />
      )}

      {/* Tournaments */}
      {!loading && tab === 'tournaments' && !showTournamentForm && !selectedTournament && (
        <div>
          <button
            onClick={openCreateTournament}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 14, border: 'none',
              background: COLORS.accent, color: '#000', fontSize: 15, fontWeight: 700,
              cursor: 'pointer', marginBottom: 16,
            }}
          >
            {'\u2795'} Создать турнир
          </button>

          {tournaments.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: COLORS.textDim }}>
              {'\uD83C\uDFC6'} Турниров пока нет
            </div>
          )}

          {tournaments.map((t) => {
            const statusColor = T_STATUS_COLORS[t.status] || COLORS.textDim;
            const statusLabel = T_STATUS_LABELS[t.status] || t.status;
            const date = new Date(t.date);
            return (
              <Card
                key={t.id}
                style={{ marginBottom: 10, padding: 14, cursor: 'pointer' }}
                onClick={() => setSelectedTournament(t)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: COLORS.text, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {'\uD83C\uDFC6'} {t.name}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 8,
                    background: `${statusColor}20`, color: statusColor, flexShrink: 0, marginLeft: 8,
                  }}>
                    {statusLabel}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: COLORS.textDim, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span>{'\uD83D\uDCC5'} {date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span>{'\uD83D\uDCCD'} {t.venue?.name || '\u2014'}</span>
                </div>

                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: COLORS.textDim }}>
                  <span>{'\uD83D\uDC65'} {t.teamsRegistered}/{t.maxTeams} пар</span>
                  <span>{'\uD83C\uDFBE'} {FORMAT_LABELS[t.format] || t.format}</span>
                  <span>Ур. {getLevelByValue(t.levelMin).category}\u2014{getLevelByValue(t.levelMax).category}</span>
                  {t.price && <span>{'\uD83D\uDCB0'} {t.price}</span>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tournament Detail */}
      {!loading && tab === 'tournaments' && selectedTournament && !showTournamentForm && (
        <TournamentDetail
          tournament={selectedTournament}
          allUsers={users}
          onBack={() => setSelectedTournament(null)}
          onEdit={() => openEditTournament(selectedTournament)}
          onDelete={() => handleDeleteTournament(selectedTournament.id, selectedTournament.name)}
          onDeleteReg={handleDeleteRegistration}
          onAddPlayer={handleAddPlayer}
          onChangeStatus={handleChangeStatus}
        />
      )}

      {/* Tournament Create/Edit Form */}
      {!loading && tab === 'tournaments' && showTournamentForm && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <button
              onClick={() => { setShowTournamentForm(false); setEditingTournament(null); }}
              style={{
                background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                borderRadius: 10, width: 32, height: 32, display: 'flex',
                alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                color: COLORS.textDim, fontSize: 16,
              }}
            >
              {'\u2190'}
            </button>
            <span style={{ fontSize: 17, fontWeight: 700, color: COLORS.text }}>
              {editingTournament ? '\u270F\uFE0F Редактирование' : '\u2795 Новый турнир'}
            </span>
          </div>

          <Card style={{ marginBottom: 12 }}>
            <Input
              label={'\uD83C\uDFC6 Название'}
              value={tForm.name}
              onChange={(v) => setTForm({ ...tForm, name: v })}
              placeholder="Название турнира"
            />
            <Textarea
              label="Описание"
              value={tForm.description}
              onChange={(v) => setTForm({ ...tForm, description: v })}
              placeholder="Подробности о турнире..."
              rows={3}
            />
          </Card>

          <Card style={{ marginBottom: 12 }}>
            <Input
              label={'\uD83D\uDCC5 Дата начала'}
              type="date"
              value={tForm.date}
              onChange={(v) => setTForm({ ...tForm, date: v })}
            />
            <Input
              label="Дата окончания (необязательно)"
              type="date"
              value={tForm.endDate}
              onChange={(v) => setTForm({ ...tForm, endDate: v })}
            />
          </Card>

          <Card style={{ marginBottom: 12 }}>
            <Select
              label={'\uD83C\uDFD9\uFE0F Город'}
              value={tForm.city}
              onChange={(v) => setTForm({ ...tForm, city: v, venueId: '' })}
              options={CITIES}
            />
            <Select
              label={'\uD83D\uDCCD Площадка'}
              value={tForm.venueId}
              onChange={(v) => setTForm({ ...tForm, venueId: v })}
              placeholder="Выберите площадку"
              options={filteredVenues.map((v) => ({ value: String(v.id), label: v.name }))}
            />
          </Card>

          <Card style={{ marginBottom: 12 }}>
            <Select
              label={'\uD83C\uDFBE Формат'}
              value={tForm.format}
              onChange={(v) => {
                const isLiveFormat = v === 'americano' || v === 'mexicano';
                setTForm({
                  ...tForm,
                  format: v,
                  registrationMode: isLiveFormat ? 'INDIVIDUAL' : 'TEAMS',
                });
              }}
              options={FORMAT_OPTIONS}
            />
            <Select
              label="Тип регистрации"
              value={tForm.registrationMode}
              onChange={(v) => setTForm({ ...tForm, registrationMode: v })}
              options={REGISTRATION_MODE_OPTIONS}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <Select
                label="Очков за матч"
                value={tForm.pointsPerMatch}
                onChange={(v) => setTForm({ ...tForm, pointsPerMatch: v })}
                options={POINTS_PER_MATCH_OPTIONS}
                style={{ flex: 1 }}
              />
              <Input
                label="Кортов"
                type="number"
                value={tForm.courtsCount}
                onChange={(v) => setTForm({ ...tForm, courtsCount: v })}
                placeholder="1"
                style={{ flex: 1 }}
              />
            </div>
            {/* Preview: estimated rounds/matches */}
            {(tForm.format === 'americano' || tForm.format === 'mexicano') && (() => {
              const players = parseInt(tForm.maxTeams) || 8;
              const courts = parseInt(tForm.courtsCount) || 1;
              const playersPerRound = Math.min(courts * 4, players);
              const matchesPerRound = Math.floor(playersPerRound / 4);
              const estRounds = tForm.format === 'americano' ? Math.max(players - 1, 1) : null;
              const estMatches = estRounds ? estRounds * matchesPerRound : null;
              const sitOuts = players - playersPerRound;
              return (
                <div style={{
                  padding: '10px 14px', borderRadius: 12, marginBottom: 6,
                  background: `${COLORS.accent}08`, border: `1px solid ${COLORS.accent}20`,
                }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.accent, marginBottom: 4 }}>
                    {'\uD83D\uDCCA'} Предпросмотр
                  </p>
                  <p style={{ fontSize: 12, color: COLORS.textDim, lineHeight: 1.6, margin: 0 }}>
                    {'\uD83D\uDC65'} {players} игроков, {courts} корт(ов)
                    {'\n'}{'\u{1F3BE}'} {matchesPerRound} матч(ей) за раунд
                    {estRounds && <>{'\n'}{'\uD83D\uDD04'} ~{estRounds} раундов, ~{estMatches} матчей всего</>}
                    {!estRounds && <>{'\n'}{'\uD83D\uDD04'} Раунды генерируются динамически (Mexicano)</>}
                    {sitOuts > 0 && <>{'\n'}{'\u23F8\uFE0F'} {sitOuts} игроков отдыхают каждый раунд</>}
                  </p>
                </div>
              );
            })()}
            <div style={{ display: 'flex', gap: 10 }}>
              <Select
                label="Уровень от"
                value={tForm.levelMin}
                onChange={(v) => setTForm({ ...tForm, levelMin: v })}
                options={levelOptions}
                style={{ flex: 1 }}
              />
              <Select
                label="Уровень до"
                value={tForm.levelMax}
                onChange={(v) => setTForm({ ...tForm, levelMax: v })}
                options={levelOptions}
                style={{ flex: 1 }}
              />
            </div>
          </Card>

          <Card style={{ marginBottom: 12 }}>
            <Input
              label={tForm.registrationMode === 'INDIVIDUAL' ? '\uD83D\uDC65 Макс. игроков' : '\uD83D\uDC65 Макс. пар'}
              type="number"
              value={tForm.maxTeams}
              onChange={(v) => setTForm({ ...tForm, maxTeams: v })}
              placeholder="16"
            />
            <Input
              label={'\uD83D\uDCB0 Цена (необязательно)'}
              value={tForm.price}
              onChange={(v) => setTForm({ ...tForm, price: v })}
              placeholder="Напр: 50 BYN / пара"
            />
            <Input
              label="Множитель рейтинга"
              type="number"
              value={tForm.ratingMultiplier}
              onChange={(v) => setTForm({ ...tForm, ratingMultiplier: v })}
              placeholder="1.0"
            />
            {editingTournament && (
              <Select
                label="Статус"
                value={tForm.status}
                onChange={(v) => setTForm({ ...tForm, status: v })}
                options={TOURNAMENT_STATUSES}
              />
            )}
          </Card>

          <button
            onClick={handleSaveTournament}
            disabled={!tForm.name || !tForm.date || !tForm.venueId}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 14, border: 'none',
              background: tForm.name && tForm.date && tForm.venueId ? COLORS.accent : COLORS.border,
              color: tForm.name && tForm.date && tForm.venueId ? '#000' : COLORS.textDim,
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {editingTournament ? '\u2705 Сохранить' : '\uD83C\uDFC6 Создать турнир'}
          </button>
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

// ─── Match Detail View ───

function MatchDetail({ match, venues, onBack, onEdit, onDelete, onChangeStatus, onRemovePlayer }) {
  const m = match;
  const date = new Date(m.date);
  const endTime = new Date(date.getTime() + m.durationMin * 60000);
  const statusColor = MATCH_STATUS_COLORS[m.status] || COLORS.textDim;
  const statusLabel = MATCH_STATUS_LABELS[m.status] || m.status;

  const approvedPlayers = m.players?.filter((p) => p.status === 'APPROVED') || [];
  const hasTeams = approvedPlayers.some((p) => p.team != null);
  const team1 = hasTeams ? approvedPlayers.filter((p) => p.team === 1) : [];
  const team2 = hasTeams ? approvedPlayers.filter((p) => p.team === 2) : [];
  const unassignedApproved = !hasTeams ? approvedPlayers : [];
  const pending = m.players?.filter((p) => p.status === 'PENDING') || [];
  const invited = m.players?.filter((p) => p.status === 'INVITED') || [];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button
          onClick={onBack}
          style={{
            background: COLORS.surface, border: `1px solid ${COLORS.border}`,
            borderRadius: 10, width: 32, height: 32, display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            color: COLORS.textDim, fontSize: 16,
          }}
        >
          {'\u2190'}
        </button>
        <span style={{ fontSize: 17, fontWeight: 700, color: COLORS.text, flex: 1 }}>
          Матч #{m.id}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 8,
          background: `${statusColor}20`, color: statusColor,
        }}>
          {statusLabel}
        </span>
      </div>

      {/* Info */}
      <Card style={{ marginBottom: 12, padding: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <InfoRow icon={'\uD83D\uDCC5'} label="Дата" value={date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })} />
          <InfoRow
            icon={'\uD83D\uDD52'}
            label="Время"
            value={`${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} \u2014 ${endTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} (${m.durationMin} мин)`}
          />
          <InfoRow icon={'\uD83D\uDCCD'} label="Площадка" value={m.venue?.name || '\u2014'} />
          {m.courtBooked && (
            <InfoRow icon={'\u2705'} label="Корт" value={m.courtNumber ? `#${m.courtNumber} (забронирован)` : 'Забронирован'} />
          )}
          <InfoRow icon={'\uD83D\uDCCA'} label="Уровень" value={`${getLevelByValue(m.levelMin).category} \u2014 ${getLevelByValue(m.levelMax).category}`} />
          <InfoRow icon={'\uD83C\uDFC6'} label="Тип" value={m.matchType === 'RATED' ? 'Рейтинговый' : 'Дружеский'} />
          <InfoRow icon={'\uD83D\uDC64'} label="Создатель" value={m.creator ? `${m.creator.firstName} ${m.creator.lastName || ''} (${m.creator.rating})` : `ID: ${m.creatorId}`} />
          {m.notes && <InfoRow icon={'\uD83D\uDCDD'} label="Заметки" value={m.notes} />}
          <InfoRow icon={'\uD83D\uDD50'} label="Создан" value={new Date(m.createdAt).toLocaleString('ru-RU')} />
        </div>
      </Card>

      {/* Status control */}
      <Card style={{ marginBottom: 12, padding: 14 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>Изменить статус</p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['RECRUITING', 'FULL', 'PENDING_CONFIRMATION', 'COMPLETED', 'CANCELLED'].map((s) => {
            const active = m.status === s;
            const clr = MATCH_STATUS_COLORS[s] || COLORS.textDim;
            return (
              <button
                key={s}
                onClick={() => !active && onChangeStatus(s)}
                style={{
                  padding: '6px 12px', borderRadius: 10, border: 'none',
                  background: active ? `${clr}30` : COLORS.surface,
                  color: active ? clr : COLORS.textDim,
                  fontSize: 11, fontWeight: 600, cursor: active ? 'default' : 'pointer',
                  opacity: active ? 1 : 0.8,
                }}
              >
                {MATCH_STATUS_LABELS[s]}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Players */}
      <Card style={{ marginBottom: 12, padding: 14 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 10 }}>
          {'\uD83D\uDC65'} Игроки ({m.players?.length || 0})
        </p>

        {/* Approved players (with or without teams) */}
        {unassignedApproved.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: COLORS.accent, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
              Игроки
            </p>
            {unassignedApproved.map((p) => (
              <PlayerRow key={p.id} player={p} onRemove={() => onRemovePlayer(p.user.id)} isCreator={p.user.id === m.creatorId} />
            ))}
          </div>
        )}

        {/* Team 1 */}
        {team1.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: COLORS.accent, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
              Команда 1
            </p>
            {team1.map((p) => (
              <PlayerRow key={p.id} player={p} onRemove={() => onRemovePlayer(p.user.id)} isCreator={p.user.id === m.creatorId} />
            ))}
          </div>
        )}

        {/* Team 2 */}
        {team2.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: COLORS.purple, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
              Команда 2
            </p>
            {team2.map((p) => (
              <PlayerRow key={p.id} player={p} onRemove={() => onRemovePlayer(p.user.id)} isCreator={p.user.id === m.creatorId} />
            ))}
          </div>
        )}

        {/* Pending */}
        {pending.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: COLORS.warning, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
              Ожидают одобрения
            </p>
            {pending.map((p) => (
              <PlayerRow key={p.id} player={p} onRemove={() => onRemovePlayer(p.user.id)} />
            ))}
          </div>
        )}

        {/* Invited */}
        {invited.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: COLORS.purple, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
              Приглашены
            </p>
            {invited.map((p) => (
              <PlayerRow key={p.id} player={p} onRemove={() => onRemovePlayer(p.user.id)} />
            ))}
          </div>
        )}

        {(!m.players || m.players.length === 0) && (
          <p style={{ fontSize: 13, color: COLORS.textDim, textAlign: 'center', padding: 20 }}>
            Нет игроков
          </p>
        )}
      </Card>

      {/* Score */}
      {m.sets && m.sets.length > 0 && (
        <Card style={{ marginBottom: 12, padding: 14 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 10 }}>
            {'\uD83D\uDCCB'} Счёт
          </p>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 0,
            background: COLORS.surface, borderRadius: 12, overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: COLORS.accent, textAlign: 'center' }}>
              Команда 1
            </div>
            <div style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: COLORS.textDim, textAlign: 'center' }}>
              Сет
            </div>
            <div style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: COLORS.purple, textAlign: 'center' }}>
              Команда 2
            </div>

            {m.sets.map((s) => {
              const t1Won = s.team1Score > s.team2Score;
              return (
                <React.Fragment key={s.setNumber}>
                  <div style={{
                    padding: '8px 12px', fontSize: 18, fontWeight: 700, textAlign: 'center',
                    color: t1Won ? COLORS.accent : COLORS.text,
                    borderTop: `1px solid ${COLORS.border}`,
                  }}>
                    {s.team1Score}
                    {s.team1Tiebreak != null && (
                      <sup style={{ fontSize: 10, color: COLORS.textDim }}>{s.team1Tiebreak}</sup>
                    )}
                  </div>
                  <div style={{
                    padding: '8px 12px', fontSize: 12, color: COLORS.textDim, textAlign: 'center',
                    borderTop: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {s.setNumber}
                  </div>
                  <div style={{
                    padding: '8px 12px', fontSize: 18, fontWeight: 700, textAlign: 'center',
                    color: !t1Won ? COLORS.purple : COLORS.text,
                    borderTop: `1px solid ${COLORS.border}`,
                  }}>
                    {s.team2Score}
                    {s.team2Tiebreak != null && (
                      <sup style={{ fontSize: 10, color: COLORS.textDim }}>{s.team2Tiebreak}</sup>
                    )}
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          {m.scoreSubmittedAt && (
            <p style={{ fontSize: 11, color: COLORS.textDim, marginTop: 8 }}>
              Счёт записан: {new Date(m.scoreSubmittedAt).toLocaleString('ru-RU')}
            </p>
          )}
        </Card>
      )}

      {/* Confirmations */}
      {m.confirmations && m.confirmations.length > 0 && (
        <Card style={{ marginBottom: 12, padding: 14 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 10 }}>
            {'\u2705'} Подтверждения ({m.confirmations.length})
          </p>
          {m.confirmations.map((c) => (
            <div key={c.id} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 10px', borderRadius: 8, background: COLORS.surface, marginBottom: 4,
            }}>
              <span style={{ fontSize: 14 }}>{c.confirmed ? '\u2705' : '\u23F3'}</span>
              <span style={{ fontSize: 13, color: COLORS.text }}>{c.user?.firstName || `ID: ${c.userId}`}</span>
              <span style={{ fontSize: 11, color: COLORS.textDim, marginLeft: 'auto' }}>
                {new Date(c.createdAt).toLocaleString('ru-RU')}
              </span>
            </div>
          ))}
        </Card>
      )}

      {/* Comments */}
      {m.comments && m.comments.length > 0 && (
        <Card style={{ marginBottom: 12, padding: 14 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 10 }}>
            {'\uD83D\uDCAC'} Комментарии ({m.comments.length})
          </p>
          {m.comments.map((c) => (
            <div key={c.id} style={{
              padding: '8px 10px', borderRadius: 10, background: COLORS.surface, marginBottom: 6,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.accent }}>
                  {c.user?.firstName || 'Пользователь'}
                </span>
                <span style={{ fontSize: 10, color: COLORS.textDim }}>
                  {new Date(c.createdAt).toLocaleString('ru-RU')}
                </span>
              </div>
              <p style={{ fontSize: 13, color: COLORS.text, margin: 0, lineHeight: 1.4 }}>{c.text}</p>
            </div>
          ))}
        </Card>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={onEdit}
          style={{
            flex: 1, padding: '12px 0', borderRadius: 14, border: `1px solid ${COLORS.border}`,
            background: 'transparent', color: COLORS.text,
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          {'\u270F\uFE0F'} Редактировать
        </button>
        <button
          onClick={onDelete}
          style={{
            padding: '12px 20px', borderRadius: 14, border: `1px solid ${COLORS.danger}30`,
            background: 'transparent', color: COLORS.danger,
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          {'\uD83D\uDDD1\uFE0F'} Удалить
        </button>
      </div>
    </div>
  );
}

// ─── Player Row (for MatchDetail) ───

function PlayerRow({ player, onRemove, isCreator }) {
  const u = player.user;
  const statusColor = PLAYER_STATUS_COLORS[player.status] || COLORS.textDim;
  const statusLabel = PLAYER_STATUS_LABELS[player.status] || player.status;
  const level = getLevel(u.rating);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 10px', borderRadius: 10, background: COLORS.surface, marginBottom: 4,
    }}>
      {/* Avatar */}
      {u.photoUrl ? (
        <img
          src={u.photoUrl}
          alt=""
          style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
        />
      ) : (
        <div style={{
          width: 32, height: 32, borderRadius: '50%', background: `${COLORS.accent}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, color: COLORS.accent,
        }}>
          {u.firstName?.[0] || '?'}
        </div>
      )}

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>
            {u.firstName} {u.lastName || ''}
          </span>
          {isCreator && (
            <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 4px', borderRadius: 4, background: `${COLORS.accent}20`, color: COLORS.accent }}>
              ORG
            </span>
          )}
          <span style={{
            fontSize: 9, fontWeight: 700, padding: '1px 4px', borderRadius: 4,
            background: `${statusColor}20`, color: statusColor,
          }}>
            {statusLabel}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, fontSize: 11, color: COLORS.textDim, marginTop: 2 }}>
          <span>{u.rating}</span>
          {level && <span>{level.name}</span>}
          {u.username && <span>@{u.username}</span>}
        </div>
      </div>

      {/* Remove button */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        style={{
          padding: '4px 8px', borderRadius: 6, border: `1px solid ${COLORS.danger}30`,
          background: 'transparent', color: COLORS.danger,
          fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
        }}
      >
        {'\u274C'}
      </button>
    </div>
  );
}

// ─── Match Edit Form ───

function MatchEditForm({ match, venues, onBack, onSave }) {
  const m = match;
  const d = new Date(m.date);
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  const [form, setForm] = useState({
    date: dateStr,
    time: timeStr,
    durationMin: String(m.durationMin),
    venueId: String(m.venueId),
    courtBooked: m.courtBooked,
    courtNumber: m.courtNumber ? String(m.courtNumber) : '',
    levelMin: String(m.levelMin),
    levelMax: String(m.levelMax),
    matchType: m.matchType,
    notes: m.notes || '',
    status: m.status,
  });
  const [saving, setSaving] = useState(false);

  const selectedVenue = venues.find((v) => String(v.id) === form.venueId);
  const isMultiCourt = selectedVenue && MULTI_COURT_VENUES.includes(selectedVenue.name);
  const showCourtNumber = form.courtBooked && isMultiCourt;

  const courtOptions = selectedVenue
    ? Array.from({ length: selectedVenue.courts || 1 }, (_, i) => ({
        value: String(i + 1),
        label: `Корт ${i + 1}`,
      }))
    : [];

  const levelOptions = LEVELS.map((l) => ({
    value: l.level.toFixed(1),
    label: `${l.category} — ${l.name}`,
  }));

  async function handleSave() {
    if (!form.date || !form.time || !form.venueId) {
      alert('Заполните дату, время и площадку');
      return;
    }
    setSaving(true);
    const dateTime = new Date(`${form.date}T${form.time}`);
    await onSave({
      venueId: parseInt(form.venueId),
      date: dateTime.toISOString(),
      durationMin: parseInt(form.durationMin),
      levelMin: parseFloat(form.levelMin),
      levelMax: parseFloat(form.levelMax),
      courtBooked: form.courtBooked,
      courtNumber: showCourtNumber && form.courtNumber ? parseInt(form.courtNumber) : null,
      matchType: form.matchType,
      notes: form.notes || null,
      status: form.status,
    });
    setSaving(false);
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button
          onClick={onBack}
          style={{
            background: COLORS.surface, border: `1px solid ${COLORS.border}`,
            borderRadius: 10, width: 32, height: 32, display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            color: COLORS.textDim, fontSize: 16,
          }}
        >
          {'\u2190'}
        </button>
        <span style={{ fontSize: 17, fontWeight: 700, color: COLORS.text }}>
          {'\u270F\uFE0F'} Редактирование матча #{m.id}
        </span>
      </div>

      {/* Date & Time */}
      <Card style={{ marginBottom: 12 }}>
        <Input
          label={'\uD83D\uDCC5 Дата'}
          type="date"
          value={form.date}
          onChange={(v) => setForm({ ...form, date: v })}
        />
        <Select
          label={'\uD83D\uDD52 Время начала'}
          value={form.time}
          onChange={(v) => setForm({ ...form, time: v })}
          options={TIME_SLOTS}
        />
        <Select
          label={'\u23F1\uFE0F Длительность'}
          value={form.durationMin}
          onChange={(v) => setForm({ ...form, durationMin: v })}
          options={[
            { value: '60', label: '1 час' },
            { value: '90', label: '1.5 часа' },
            { value: '120', label: '2 часа' },
            { value: '150', label: '2.5 часа' },
            { value: '180', label: '3 часа' },
          ]}
        />
      </Card>

      {/* Venue & Court */}
      <Card style={{ marginBottom: 12 }}>
        <Select
          label={'\uD83D\uDCCD Площадка'}
          value={form.venueId}
          onChange={(v) => { setForm({ ...form, venueId: v, courtNumber: '' }); }}
          options={venues.map((v) => ({ value: String(v.id), label: v.name }))}
        />
        <Checkbox
          checked={form.courtBooked}
          onChange={(v) => { setForm({ ...form, courtBooked: v, courtNumber: v ? form.courtNumber : '' }); }}
          label="Корт забронирован"
        />
        {showCourtNumber && (
          <Select
            label="Номер корта"
            value={form.courtNumber}
            onChange={(v) => setForm({ ...form, courtNumber: v })}
            placeholder="Выберите корт"
            options={courtOptions}
          />
        )}
      </Card>

      {/* Level & Type */}
      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <Select
            label="Уровень от"
            value={form.levelMin}
            onChange={(v) => setForm({ ...form, levelMin: v })}
            options={levelOptions}
            style={{ flex: 1 }}
          />
          <Select
            label="Уровень до"
            value={form.levelMax}
            onChange={(v) => setForm({ ...form, levelMax: v })}
            options={levelOptions}
            style={{ flex: 1 }}
          />
        </div>

        <Select
          label="Тип матча"
          value={form.matchType}
          onChange={(v) => setForm({ ...form, matchType: v })}
          options={[
            { value: 'RATED', label: '\uD83C\uDFC6 Рейтинговый' },
            { value: 'FRIENDLY', label: '\uD83D\uDE0A Дружеский' },
          ]}
        />
      </Card>

      {/* Status */}
      <Card style={{ marginBottom: 12 }}>
        <Select
          label="Статус матча"
          value={form.status}
          onChange={(v) => setForm({ ...form, status: v })}
          options={MATCH_STATUS_OPTIONS}
        />
      </Card>

      {/* Notes */}
      <Card style={{ marginBottom: 20 }}>
        <Textarea
          label="Комментарий"
          value={form.notes}
          onChange={(v) => setForm({ ...form, notes: v })}
          placeholder="Дополнительная информация..."
          rows={2}
        />
      </Card>

      <button
        onClick={handleSave}
        disabled={saving || !form.date || !form.time || !form.venueId}
        style={{
          width: '100%', padding: '14px 0', borderRadius: 14, border: 'none',
          background: !saving && form.date && form.time && form.venueId ? COLORS.accent : COLORS.border,
          color: !saving && form.date && form.time && form.venueId ? '#000' : COLORS.textDim,
          fontSize: 15, fontWeight: 700, cursor: 'pointer',
        }}
      >
        {saving ? 'Сохранение...' : '\u2705 Сохранить'}
      </button>
    </div>
  );
}

// ─── Tournament Detail View (Enhanced with Live Controls) ───

function TournamentDetail({ tournament, allUsers, onBack, onEdit, onDelete, onDeleteReg, onAddPlayer, onChangeStatus }) {
  const t = tournament;
  const date = new Date(t.date);
  const statusColor = T_STATUS_COLORS[t.status] || COLORS.textDim;
  const statusLabel = T_STATUS_LABELS[t.status] || t.status;

  const [liveData, setLiveData] = useState(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [selectedRound, setSelectedRound] = useState(null);
  const [scores, setScores] = useState({}); // matchId -> { team1: '', team2: '' }
  const [submittingScore, setSubmittingScore] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [playerSearch, setPlayerSearch] = useState('');
  const [addingPlayer, setAddingPlayer] = useState(false);

  const isLiveFormat = ['americano', 'mexicano'].includes(t.format?.toLowerCase());
  const isInProgress = t.status === 'IN_PROGRESS';
  const isCompleted = t.status === 'COMPLETED';
  const isRegistration = t.status === 'REGISTRATION';
  const isMexicano = t.format?.toLowerCase() === 'mexicano';
  const isIndividual = t.registrationMode === 'INDIVIDUAL';

  // Load live data for live-format tournaments
  useEffect(() => {
    if (isLiveFormat && (isInProgress || isCompleted)) {
      loadLiveData();
    }
  }, [t.id, t.status]);

  async function loadLiveData() {
    setLiveLoading(true);
    try {
      const data = await api.tournaments.live(t.id);
      setLiveData(data);
      if (selectedRound === null && data.currentRound > 0) {
        setSelectedRound(data.currentRound);
      }
    } catch (err) {
      console.error('Load live data error:', err);
    }
    setLiveLoading(false);
  }

  async function handleStartTournament() {
    if (!confirm('Запустить турнир? Это сгенерирует раунды и начнёт турнир.')) return;
    setActionLoading(true);
    try {
      await api.admin.startTournament(t.id);
      onChangeStatus(t.id, 'IN_PROGRESS');
      await loadLiveData();
    } catch (err) {
      alert(err.message || 'Ошибка запуска');
    }
    setActionLoading(false);
  }

  async function handleInlineScore(matchId) {
    const s = scores[matchId];
    if (!s) return;
    const s1 = parseInt(s.team1);
    const s2 = parseInt(s.team2);
    if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) {
      alert('Введите корректные очки');
      return;
    }
    const ppm = liveData?.pointsPerMatch || t.pointsPerMatch || 24;
    if (s1 + s2 !== ppm) {
      alert(`Сумма очков должна быть ${ppm}. Сейчас: ${s1 + s2}`);
      return;
    }
    setSubmittingScore(matchId);
    try {
      await api.admin.submitTournamentScore(t.id, matchId, s1, s2);
      setScores(prev => { const n = { ...prev }; delete n[matchId]; return n; });
      await loadLiveData();
    } catch (err) {
      alert(err.message || 'Ошибка записи счёта');
    }
    setSubmittingScore(null);
  }

  async function handleNextRound() {
    setActionLoading(true);
    try {
      await api.admin.nextTournamentRound(t.id);
      const data = await api.tournaments.live(t.id);
      setLiveData(data);
      setSelectedRound(data.currentRound);
    } catch (err) {
      alert(err.message || 'Ошибка генерации раунда');
    }
    setActionLoading(false);
  }

  async function handleCompleteTournament() {
    if (!confirm('Завершить турнир? Будут рассчитаны рейтинговые изменения.')) return;
    setActionLoading(true);
    try {
      await api.admin.completeTournament(t.id);
      onChangeStatus(t.id, 'COMPLETED');
      await loadLiveData();
    } catch (err) {
      alert(err.message || 'Ошибка завершения');
    }
    setActionLoading(false);
  }

  function updateScore(matchId, team, value) {
    setScores(prev => ({
      ...prev,
      [matchId]: { ...(prev[matchId] || { team1: '', team2: '' }), [team]: value },
    }));
  }

  const currentRoundData = liveData?.rounds?.find(r => r.roundNumber === selectedRound);
  const currentRoundPending = currentRoundData?.matches?.filter(m => m.status !== 'COMPLETED');
  const allCurrentRoundDone = currentRoundData && currentRoundPending?.length === 0;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button
          onClick={onBack}
          style={{
            background: COLORS.surface, border: `1px solid ${COLORS.border}`,
            borderRadius: 10, width: 32, height: 32, display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            color: COLORS.textDim, fontSize: 16,
          }}
        >
          {'\u2190'}
        </button>
        <span style={{ fontSize: 17, fontWeight: 700, color: COLORS.text, flex: 1 }}>
          {t.name}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 8,
          background: `${statusColor}20`, color: statusColor,
        }}>
          {statusLabel}
        </span>
      </div>

      {/* Status pipeline */}
      {isLiveFormat && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 0, marginBottom: 16,
          background: COLORS.surface, borderRadius: 14, padding: 4, overflow: 'hidden',
        }}>
          {['REGISTRATION', 'IN_PROGRESS', 'COMPLETED'].map((s, idx) => {
            const isCurrent = t.status === s;
            const isPast = (s === 'REGISTRATION' && (isInProgress || isCompleted)) ||
                           (s === 'IN_PROGRESS' && isCompleted);
            const clr = T_STATUS_COLORS[s];
            return (
              <div key={s} style={{
                flex: 1, textAlign: 'center', padding: '8px 4px',
                borderRadius: 10,
                background: isCurrent ? `${clr}25` : 'transparent',
                fontSize: 11, fontWeight: 700,
                color: isCurrent ? clr : isPast ? COLORS.accent : COLORS.textMuted,
              }}>
                {isPast ? '\u2705' : ''} {T_STATUS_LABELS[s]}
              </div>
            );
          })}
        </div>
      )}

      {/* Info */}
      <Card style={{ marginBottom: 12, padding: 14 }}>
        {t.description && (
          <p style={{ fontSize: 13, color: COLORS.textDim, marginBottom: 10, lineHeight: 1.4 }}>
            {t.description}
          </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <InfoRow icon={'\uD83D\uDCC5'} label="Дата" value={date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })} />
          {t.endDate && (
            <InfoRow icon={'\uD83D\uDCC5'} label="До" value={new Date(t.endDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })} />
          )}
          <InfoRow icon={'\uD83D\uDCCD'} label="Площадка" value={t.venue?.name || '\u2014'} />
          <InfoRow icon={'\uD83C\uDFBE'} label="Формат" value={FORMAT_LABELS[t.format] || t.format} />
          <InfoRow icon={'\uD83D\uDCCA'} label="Уровень" value={`${getLevelByValue(t.levelMin).category} \u2014 ${getLevelByValue(t.levelMax).category}`} />
          <InfoRow icon={'\uD83D\uDC65'} label={isIndividual ? 'Игроков' : 'Пар'} value={`${t.teamsRegistered}/${t.maxTeams}`} />
          {isLiveFormat && <InfoRow icon={'\u{1F3BE}'} label="Очков/матч" value={t.pointsPerMatch || 24} />}
          {isLiveFormat && <InfoRow icon={'\u{1F3DF}\uFE0F'} label="Кортов" value={t.courtsCount || 1} />}
          {t.price && <InfoRow icon={'\uD83D\uDCB0'} label="Цена" value={t.price} />}
          {t.ratingMultiplier !== 1.0 && <InfoRow icon={'\u2B50'} label="Множитель" value={`x${t.ratingMultiplier}`} />}
        </div>
      </Card>

      {/* ─── LIVE: Start Button ─── */}
      {isLiveFormat && isRegistration && (
        <Card style={{ marginBottom: 12, padding: 16, textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>
            {'\u{1F680}'} Готовы к старту?
          </p>
          <p style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 14 }}>
            {t.teamsRegistered} {isIndividual ? 'игроков' : 'пар'} зарегистрировано (минимум 4 игрока)
          </p>
          <button
            onClick={handleStartTournament}
            disabled={actionLoading || t.teamsRegistered < (isIndividual ? 4 : 2)}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 14, border: 'none',
              background: !actionLoading && t.teamsRegistered >= (isIndividual ? 4 : 2) ? COLORS.accent : COLORS.border,
              color: !actionLoading && t.teamsRegistered >= (isIndividual ? 4 : 2) ? '#000' : COLORS.textDim,
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {actionLoading ? 'Запуск...' : '\u{1F680} Запустить турнир'}
          </button>
        </Card>
      )}

      {/* ─── LIVE: Rounds & Matches (In Progress / Completed) ─── */}
      {isLiveFormat && (isInProgress || isCompleted) && (
        <>
          {liveLoading && !liveData && (
            <div style={{ textAlign: 'center', padding: 30, color: COLORS.textDim }}>
              Загрузка раундов...
            </div>
          )}

          {liveData && (
            <>
              {/* Round selector */}
              {liveData.rounds?.length > 0 && (
                <div style={{
                  display: 'flex', gap: 6, marginBottom: 12,
                  overflowX: 'auto', paddingBottom: 4,
                }}>
                  {liveData.rounds.map(round => {
                    const isActive = round.roundNumber === selectedRound;
                    const isCurrent = round.roundNumber === liveData.currentRound;
                    const isDone = round.status === 'COMPLETED';
                    return (
                      <button
                        key={round.id}
                        onClick={() => setSelectedRound(round.roundNumber)}
                        style={{
                          padding: '6px 14px', borderRadius: 20, whiteSpace: 'nowrap',
                          border: isActive ? 'none' : `1px solid ${COLORS.border}`,
                          background: isActive ? COLORS.accent : isDone ? `${COLORS.accent}10` : 'transparent',
                          color: isActive ? COLORS.bg : isDone ? COLORS.accent : COLORS.textDim,
                          fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          position: 'relative',
                        }}
                      >
                        {isDone && !isActive ? '\u2705 ' : ''}R{round.roundNumber}
                        {isCurrent && isInProgress && !isActive && (
                          <span style={{
                            position: 'absolute', top: -2, right: -2,
                            width: 6, height: 6, borderRadius: '50%',
                            background: COLORS.warning,
                          }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Inline matches with score entry */}
              {currentRoundData?.matches?.length > 0 && (
                <Card style={{ marginBottom: 12, padding: 12 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 10 }}>
                    {'\u{1F3BE}'} Раунд {selectedRound} — {currentRoundData.matches.length} матч(ей)
                    {currentRoundData.status === 'COMPLETED' && (
                      <span style={{ color: COLORS.accent, marginLeft: 6 }}>{'\u2705'}</span>
                    )}
                  </p>

                  {currentRoundData.matches.map(match => {
                    const isDone = match.status === 'COMPLETED';
                    const t1Won = isDone && match.team1Score > match.team2Score;
                    const t2Won = isDone && match.team2Score > match.team1Score;
                    const p1 = match.team1Player1;
                    const p2 = match.team1Player2;
                    const p3 = match.team2Player1;
                    const p4 = match.team2Player2;
                    const sc = scores[match.id] || { team1: '', team2: '' };
                    const ppm = liveData.pointsPerMatch || 24;
                    const scoreSum = (parseInt(sc.team1) || 0) + (parseInt(sc.team2) || 0);
                    const sumOk = scoreSum === ppm && sc.team1 !== '' && sc.team2 !== '';

                    return (
                      <div key={match.id} style={{
                        padding: '10px 12px', borderRadius: 12, marginBottom: 8,
                        background: isDone ? `${COLORS.surface}` : `${COLORS.warning}08`,
                        border: `1px solid ${isDone ? COLORS.border : `${COLORS.warning}30`}`,
                      }}>
                        {/* Court header */}
                        <div style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          marginBottom: 8, fontSize: 11, color: COLORS.textDim,
                        }}>
                          <span style={{ fontWeight: 600 }}>Корт {match.courtNumber}</span>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 6,
                            background: isDone ? `${COLORS.accent}15` : `${COLORS.warning}15`,
                            color: isDone ? COLORS.accent : COLORS.warning,
                          }}>
                            {isDone ? 'Завершён' : 'LIVE'}
                          </span>
                        </div>

                        {isDone ? (
                          /* Completed match display */
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <span style={{
                                fontSize: 13, fontWeight: t1Won ? 700 : 500,
                                color: t1Won ? COLORS.accent : COLORS.text,
                              }}>
                                {p1?.firstName} + {p2?.firstName}
                              </span>
                            </div>
                            <span style={{ fontSize: 18, fontWeight: 800, color: t1Won ? COLORS.accent : COLORS.text, minWidth: 28, textAlign: 'center' }}>
                              {match.team1Score}
                            </span>
                            <span style={{ fontSize: 11, color: COLORS.textMuted }}>:</span>
                            <span style={{ fontSize: 18, fontWeight: 800, color: t2Won ? COLORS.accent : COLORS.text, minWidth: 28, textAlign: 'center' }}>
                              {match.team2Score}
                            </span>
                            <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                              <span style={{
                                fontSize: 13, fontWeight: t2Won ? 700 : 500,
                                color: t2Won ? COLORS.accent : COLORS.text,
                              }}>
                                {p3?.firstName} + {p4?.firstName}
                              </span>
                            </div>
                          </div>
                        ) : (
                          /* Active match — inline score entry */
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>
                                  {p1?.firstName} + {p2?.firstName}
                                </span>
                              </div>
                              <input
                                type="number"
                                inputMode="numeric"
                                value={sc.team1}
                                onChange={e => updateScore(match.id, 'team1', e.target.value)}
                                placeholder="0"
                                style={{
                                  width: 52, padding: '8px 4px', borderRadius: 10,
                                  border: `1px solid ${COLORS.border}`, background: COLORS.bg,
                                  color: COLORS.text, fontSize: 18, fontWeight: 700,
                                  textAlign: 'center', fontFamily: 'inherit', outline: 'none',
                                }}
                              />
                              <span style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 600 }}>vs</span>
                              <input
                                type="number"
                                inputMode="numeric"
                                value={sc.team2}
                                onChange={e => updateScore(match.id, 'team2', e.target.value)}
                                placeholder="0"
                                style={{
                                  width: 52, padding: '8px 4px', borderRadius: 10,
                                  border: `1px solid ${COLORS.border}`, background: COLORS.bg,
                                  color: COLORS.text, fontSize: 18, fontWeight: 700,
                                  textAlign: 'center', fontFamily: 'inherit', outline: 'none',
                                }}
                              />
                              <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>
                                  {p3?.firstName} + {p4?.firstName}
                                </span>
                              </div>
                              <button
                                onClick={() => handleInlineScore(match.id)}
                                disabled={!sumOk || submittingScore === match.id}
                                style={{
                                  padding: '8px 10px', borderRadius: 10, border: 'none',
                                  background: sumOk ? COLORS.accent : COLORS.border,
                                  color: sumOk ? '#000' : COLORS.textDim,
                                  fontSize: 14, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
                                }}
                              >
                                {submittingScore === match.id ? '...' : '\u2713'}
                              </button>
                            </div>
                            {sc.team1 !== '' && sc.team2 !== '' && !sumOk && (
                              <p style={{ fontSize: 11, color: COLORS.danger, marginTop: 4, textAlign: 'center' }}>
                                Сумма: {scoreSum} / {ppm}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Round incomplete warning */}
                  {isInProgress && currentRoundPending?.length > 0 && (
                    <p style={{ fontSize: 12, color: COLORS.warning, textAlign: 'center', marginTop: 4 }}>
                      {'\u26A0\uFE0F'} Осталось {currentRoundPending.length} незавершённых матч(ей)
                    </p>
                  )}
                </Card>
              )}

              {/* Standings */}
              {liveData.standings?.length > 0 && (
                <Card style={{ marginBottom: 12, padding: 12 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 10 }}>
                    {'\uD83D\uDCCA'} Таблица
                  </p>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, display: 'grid', gridTemplateColumns: '28px 1fr 44px 44px 40px', gap: 0, padding: '4px 0', marginBottom: 4 }}>
                    <span>#</span><span>Игрок</span><span style={{ textAlign: 'center' }}>Очки</span><span style={{ textAlign: 'center' }}>W/L</span><span style={{ textAlign: 'center' }}>+/-</span>
                  </div>
                  {liveData.standings.map((s, idx) => {
                    const diff = s.pointsFor - s.pointsAgainst;
                    return (
                      <div key={s.id} style={{
                        display: 'grid', gridTemplateColumns: '28px 1fr 44px 44px 40px',
                        padding: '6px 0', alignItems: 'center',
                        borderTop: `1px solid ${COLORS.border}`,
                      }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: idx < 3 ? [COLORS.gold, '#C0C0C0', '#CD7F32'][idx] : COLORS.textDim }}>
                          {idx < 3 ? ['\u{1F947}', '\u{1F948}', '\u{1F949}'][idx] : idx + 1}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.user?.firstName}
                        </span>
                        <span style={{ textAlign: 'center', fontSize: 13, fontWeight: 800, color: COLORS.text }}>{s.points}</span>
                        <span style={{ textAlign: 'center', fontSize: 11, color: COLORS.textDim }}>{s.wins}/{s.losses}</span>
                        <span style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: diff > 0 ? COLORS.accent : diff < 0 ? COLORS.danger : COLORS.textDim }}>
                          {diff > 0 ? '+' : ''}{diff}
                        </span>
                      </div>
                    );
                  })}
                </Card>
              )}

              {/* Rating changes for completed tournaments */}
              {isCompleted && liveData.ratingChanges?.length > 0 && (
                <Card style={{ marginBottom: 12, padding: 12 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 10 }}>
                    {'\uD83D\uDCC8'} Рейтинговые изменения
                  </p>
                  {liveData.ratingChanges.map(rc => (
                    <div key={rc.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '6px 0', borderBottom: `1px solid ${COLORS.border}`,
                    }}>
                      <span style={{ fontSize: 12, color: COLORS.text }}>{rc.user?.firstName} {rc.user?.lastName || ''}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 11, color: COLORS.textDim }}>{rc.oldRating}</span>
                        <span style={{ fontSize: 11, color: COLORS.textDim }}>{'\u2192'}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.text }}>{rc.newRating}</span>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 6,
                          background: rc.change >= 0 ? `${COLORS.accent}15` : `${COLORS.danger}15`,
                          color: rc.change >= 0 ? COLORS.accent : COLORS.danger,
                        }}>
                          {rc.change > 0 ? '+' : ''}{rc.change}
                        </span>
                      </div>
                    </div>
                  ))}
                </Card>
              )}

              {/* Admin control buttons */}
              {isInProgress && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                  {/* Next round for Mexicano */}
                  {isMexicano && allCurrentRoundDone && (
                    <button
                      onClick={handleNextRound}
                      disabled={actionLoading}
                      style={{
                        width: '100%', padding: '12px 0', borderRadius: 14, border: 'none',
                        background: COLORS.purple, color: '#fff',
                        fontSize: 14, fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      {actionLoading ? 'Генерация...' : '\u27A1\uFE0F Следующий раунд'}
                    </button>
                  )}
                  <button
                    onClick={handleCompleteTournament}
                    disabled={actionLoading}
                    style={{
                      width: '100%', padding: '12px 0', borderRadius: 14,
                      border: `1px solid ${COLORS.warning}40`, background: 'transparent',
                      color: COLORS.warning, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    {actionLoading ? 'Завершение...' : '\u{1F3C1} Завершить турнир'}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Non-live status control */}
      {!isLiveFormat && (
        <Card style={{ marginBottom: 12, padding: 14 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>Изменить статус</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['UPCOMING', 'REGISTRATION', 'IN_PROGRESS', 'COMPLETED'].map((s) => {
              const active = t.status === s;
              const clr = T_STATUS_COLORS[s];
              return (
                <button
                  key={s}
                  onClick={() => !active && onChangeStatus(t.id, s)}
                  style={{
                    padding: '6px 12px', borderRadius: 10, border: 'none',
                    background: active ? `${clr}30` : COLORS.surface,
                    color: active ? clr : COLORS.textDim,
                    fontSize: 12, fontWeight: 600, cursor: active ? 'default' : 'pointer',
                    opacity: active ? 1 : 0.8,
                  }}
                >
                  {T_STATUS_LABELS[s]}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* Registrations */}
      <Card style={{ marginBottom: 12, padding: 14 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 10 }}>
          {'\uD83D\uDC65'} {isIndividual ? 'Участники' : 'Зарегистрированные пары'} ({t.registrations?.length || 0})
        </p>

        {/* Add player (admin) */}
        {isRegistration && allUsers && (
          <div style={{ marginBottom: 12 }}>
            <input
              type="text"
              placeholder="Поиск игрока по имени..."
              value={playerSearch}
              onChange={(e) => setPlayerSearch(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 12,
                border: `1px solid ${COLORS.border}`, background: COLORS.surface,
                color: COLORS.text, fontSize: 13, outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {playerSearch.length >= 2 && (() => {
              const registeredIds = new Set();
              (t.registrations || []).forEach(r => {
                if (r.player1?.id) registeredIds.add(r.player1.id);
                if (r.player2?.id) registeredIds.add(r.player2.id);
              });
              const filtered = allUsers
                .filter(u => !registeredIds.has(u.id))
                .filter(u => {
                  const q = playerSearch.toLowerCase();
                  return (u.firstName || '').toLowerCase().includes(q) ||
                    (u.lastName || '').toLowerCase().includes(q) ||
                    (u.username || '').toLowerCase().includes(q);
                })
                .slice(0, 6);
              if (filtered.length === 0) return (
                <p style={{ fontSize: 12, color: COLORS.textDim, padding: '8px 0', textAlign: 'center' }}>
                  Никого не найдено
                </p>
              );
              return (
                <div style={{
                  marginTop: 6, borderRadius: 12, border: `1px solid ${COLORS.border}`,
                  background: COLORS.card, overflow: 'hidden',
                }}>
                  {filtered.map(u => (
                    <button
                      key={u.id}
                      disabled={addingPlayer}
                      onClick={async () => {
                        setAddingPlayer(true);
                        await onAddPlayer(t.id, u.id);
                        setPlayerSearch('');
                        setAddingPlayer(false);
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        width: '100%', padding: '10px 12px', border: 'none',
                        borderBottom: `1px solid ${COLORS.border}20`,
                        background: 'transparent', color: COLORS.text,
                        fontSize: 13, cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      <span>
                        {u.firstName} {u.lastName || ''}
                        {u.username && <span style={{ color: COLORS.textDim, marginLeft: 6, fontSize: 11 }}>@{u.username}</span>}
                      </span>
                      <span style={{ color: COLORS.accent, fontSize: 12, fontWeight: 600 }}>
                        {u.rating} +
                      </span>
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {(!t.registrations || t.registrations.length === 0) && (
          <p style={{ fontSize: 13, color: COLORS.textDim, textAlign: 'center', padding: 20 }}>
            Пока никто не зарегистрирован
          </p>
        )}

        {t.registrations?.map((reg, idx) => (
          <div
            key={reg.id}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 12px', borderRadius: 12,
              background: COLORS.surface, marginBottom: 6,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>
                <span style={{ fontSize: 11, color: COLORS.textDim, marginRight: 6 }}>#{idx + 1}</span>
                {reg.player1?.firstName} {reg.player1?.lastName || ''}
                <span style={{ color: COLORS.accent, fontSize: 11, marginLeft: 4 }}>{reg.player1?.rating}</span>
              </div>
              {!isIndividual && reg.player2 && (
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, marginTop: 2 }}>
                  <span style={{ fontSize: 11, color: 'transparent', marginRight: 6 }}>#{idx + 1}</span>
                  {reg.player2?.firstName} {reg.player2?.lastName || ''}
                  <span style={{ color: COLORS.accent, fontSize: 11, marginLeft: 4 }}>{reg.player2?.rating}</span>
                </div>
              )}
            </div>
            {isRegistration && (
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteReg(t.id, reg.id); }}
                style={{
                  padding: '4px 10px', borderRadius: 8, border: `1px solid ${COLORS.danger}30`,
                  background: 'transparent', color: COLORS.danger,
                  fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
                }}
              >
                {'\u274C'}
              </button>
            )}
          </div>
        ))}
      </Card>

      {/* TV Link */}
      {(
        <Card style={{ marginBottom: 12, padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>{'\uD83D\uDCFA'}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>TV-экран</p>
              <p style={{ fontSize: 11, color: COLORS.textDim, wordBreak: 'break-all' }}>
                {window.location.origin}/tv/{t.id}
              </p>
              {!isInProgress && !isCompleted && (
                <p style={{ fontSize: 11, color: COLORS.warning, marginTop: 2 }}>
                  Заработает после старта турнира
                </p>
              )}
            </div>
            <button
              onClick={() => {
                const url = `${window.location.origin}/tv/${t.id}`;
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(url);
                  alert('Ссылка скопирована!');
                } else {
                  prompt('Скопируйте:', url);
                }
              }}
              style={{
                padding: '8px 14px', borderRadius: 10, border: `1px solid ${COLORS.accent}40`,
                background: `${COLORS.accent}15`, color: COLORS.accent,
                fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
              }}
            >
              {'\uD83D\uDD17'} Копировать
            </button>
          </div>
        </Card>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={onEdit}
          style={{
            flex: 1, padding: '12px 0', borderRadius: 14, border: `1px solid ${COLORS.border}`,
            background: 'transparent', color: COLORS.text,
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          {'\u270F\uFE0F'} Редактировать
        </button>
        <button
          onClick={onDelete}
          style={{
            padding: '12px 20px', borderRadius: 14, border: `1px solid ${COLORS.danger}30`,
            background: 'transparent', color: COLORS.danger,
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          {'\uD83D\uDDD1\uFE0F'} Удалить
        </button>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', gap: 8, fontSize: 13 }}>
      <span>{icon}</span>
      <span style={{ color: COLORS.textDim, minWidth: 80 }}>{label}</span>
      <span style={{ color: COLORS.text, fontWeight: 600 }}>{value}</span>
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

function TodayStat({ label, value, prev }) {
  const diff = prev != null ? value - prev : null;
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.text }}>{value}</div>
      <div style={{ fontSize: 11, color: COLORS.textDim }}>{label}</div>
      {diff != null && diff !== 0 && (
        <div style={{
          fontSize: 11, fontWeight: 700, marginTop: 2,
          color: diff > 0 ? COLORS.accent : COLORS.danger,
        }}>
          {diff > 0 ? `↑${diff}` : `↓${Math.abs(diff)}`}
        </div>
      )}
    </div>
  );
}
