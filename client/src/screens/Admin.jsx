import React, { useEffect, useState } from 'react';
import { COLORS, CITIES, getLevel } from '../config';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { api } from '../services/api';

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
  { value: 'round_robin', label: 'Круговой' },
  { value: 'single_elimination', label: 'Олимпийская' },
  { value: 'double_elimination', label: 'Двойная элиминация' },
  { value: 'americano', label: 'Американо' },
  { value: 'mixto', label: 'Микст' },
];

const FORMAT_LABELS = {
  round_robin: 'Круговой',
  single_elimination: 'Олимпийская',
  double_elimination: 'Двойная элиминация',
  americano: 'Американо',
  mixto: 'Микст',
};

export function Admin({ onBack }) {
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [newRating, setNewRating] = useState('');

  // Tournament create/edit state
  const [showTournamentForm, setShowTournamentForm] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [tForm, setTForm] = useState({
    name: '', description: '', date: '', endDate: '', city: 'MINSK',
    venueId: '', format: 'americano', levelMin: '1.0', levelMax: '4.0',
    maxTeams: '16', price: '', ratingMultiplier: '1.0', status: 'REGISTRATION',
  });

  useEffect(() => {
    loadData();
  }, [tab]);

  // Load venues for tournament form
  useEffect(() => {
    api.venues.list().then(setVenues).catch(console.error);
  }, []);

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
      } else if (tab === 'tournaments') {
        const data = await api.admin.tournaments();
        setTournaments(data);
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
      // Refresh tournament detail
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

  const STATUS_LABELS = {
    RECRUITING: 'Набор', FULL: 'Собран', IN_PROGRESS: 'Играют',
    PENDING_SCORE: 'Счёт', PENDING_CONFIRMATION: 'Подтв.',
    COMPLETED: 'Завершён', CANCELLED: 'Отменён',
  };

  const STATUS_COLORS = {
    RECRUITING: COLORS.accent, FULL: COLORS.purple,
    COMPLETED: '#4CAF50', CANCELLED: COLORS.danger,
  };

  const levelOptions = [];
  for (let l = 1.0; l <= 4.0; l += 0.5) {
    levelOptions.push({ value: l.toFixed(1), label: l.toFixed(1) });
  }

  const filteredVenues = venues.filter((v) => v.city === tForm.city);

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
            onClick={() => { setTab(t.key); setSelectedTournament(null); setShowTournamentForm(false); }}
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
                  <span>{'\uD83D\uDCCD'} {t.venue?.name || '—'}</span>
                </div>

                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: COLORS.textDim }}>
                  <span>{'\uD83D\uDC65'} {t.teamsRegistered}/{t.maxTeams} пар</span>
                  <span>{'\uD83C\uDFBE'} {FORMAT_LABELS[t.format] || t.format}</span>
                  <span>Ур. {t.levelMin}—{t.levelMax}</span>
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
          onBack={() => setSelectedTournament(null)}
          onEdit={() => openEditTournament(selectedTournament)}
          onDelete={() => handleDeleteTournament(selectedTournament.id, selectedTournament.name)}
          onDeleteReg={handleDeleteRegistration}
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
              onChange={(v) => setTForm({ ...tForm, format: v })}
              options={FORMAT_OPTIONS}
            />
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
              label={'\uD83D\uDC65 Макс. пар'}
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

// ─── Tournament Detail View ───

function TournamentDetail({ tournament, onBack, onEdit, onDelete, onDeleteReg, onChangeStatus }) {
  const t = tournament;
  const date = new Date(t.date);
  const statusColor = T_STATUS_COLORS[t.status] || COLORS.textDim;
  const statusLabel = T_STATUS_LABELS[t.status] || t.status;

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
          <InfoRow icon={'\uD83D\uDCCD'} label="Площадка" value={t.venue?.name || '—'} />
          <InfoRow icon={'\uD83C\uDFBE'} label="Формат" value={FORMAT_LABELS[t.format] || t.format} />
          <InfoRow icon={'\uD83D\uDCCA'} label="Уровень" value={`${t.levelMin} — ${t.levelMax}`} />
          <InfoRow icon={'\uD83D\uDC65'} label="Пар" value={`${t.teamsRegistered}/${t.maxTeams}`} />
          {t.price && <InfoRow icon={'\uD83D\uDCB0'} label="Цена" value={t.price} />}
          {t.ratingMultiplier !== 1.0 && <InfoRow icon={'\u2B50'} label="Множитель" value={`x${t.ratingMultiplier}`} />}
        </div>
      </Card>

      {/* Status control */}
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

      {/* Registrations */}
      <Card style={{ marginBottom: 12, padding: 14 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 10 }}>
          {'\uD83D\uDC65'} Зарегистрированные пары ({t.registrations?.length || 0})
        </p>

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
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, marginTop: 2 }}>
                <span style={{ fontSize: 11, color: 'transparent', marginRight: 6 }}>#{idx + 1}</span>
                {reg.player2?.firstName} {reg.player2?.lastName || ''}
                <span style={{ color: COLORS.accent, fontSize: 11, marginLeft: 4 }}>{reg.player2?.rating}</span>
              </div>
            </div>
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
          </div>
        ))}
      </Card>

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
