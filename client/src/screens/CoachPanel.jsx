import React, { useEffect, useState } from 'react';
import { COLORS, getLevel } from '../config';
import { Card } from '../components/ui/Card';
import { Header } from '../components/ui/Header';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { MiniChart } from '../components/ui/MiniChart';
import { api } from '../services/api';

export function CoachPanel({ user, onBack, onNavigate }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const data = await api.coach.dashboard();
      setDashboard(data);
    } catch (err) {
      console.error('Coach dashboard error:', err);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div>
        <Header title="Панель тренера" onBack={onBack} />
        <div style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: COLORS.textDim }}>Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div>
        <Header title="Панель тренера" onBack={onBack} />
        <div style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: COLORS.danger }}>Ошибка загрузки</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Обзор' },
    { id: 'students', label: 'Ученики' },
    { id: 'schedule', label: 'Расписание' },
    { id: 'payments', label: 'Оплаты' },
  ];

  return (
    <div>
      <Header title="Панель тренера" onBack={onBack} />

      {/* Tier badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Badge
          variant={dashboard.tier === 'PAID' ? 'accent' : 'default'}
          style={dashboard.tier === 'PAID' ? { background: `${COLORS.accent}20`, color: COLORS.accent } : {}}
        >
          {dashboard.tier === 'PAID' ? '\u2B50 PRO' : '\u{1F193} FREE'}
        </Badge>
        {dashboard.tier === 'FREE' && (
          <span style={{ fontSize: 12, color: COLORS.textDim }}>
            {dashboard.studentCount}/{dashboard.maxFreeStudents} учеников
          </span>
        )}
      </div>

      {/* Tab navigation */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, overflowX: 'auto' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              border: 'none',
              background: activeTab === tab.id ? COLORS.accent : COLORS.surface,
              color: activeTab === tab.id ? COLORS.bg : COLORS.textDim,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && <OverviewTab dashboard={dashboard} />}
      {activeTab === 'students' && <StudentsTab dashboard={dashboard} onNavigate={onNavigate} />}
      {activeTab === 'schedule' && <ScheduleTab dashboard={dashboard} onNavigate={onNavigate} />}
      {activeTab === 'payments' && <PaymentsTab dashboard={dashboard} />}
    </div>
  );
}

// === Overview Tab ===
function OverviewTab({ dashboard }) {
  return (
    <div>
      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <StatCard
          icon={'\u{1F393}'}
          label="Ученики"
          value={dashboard.studentCount}
          color={COLORS.accent}
        />
        <StatCard
          icon={'\u{1F4C5}'}
          label="Тренировки"
          value={dashboard.upcomingSessions}
          subtitle="предстоит"
          color={COLORS.purple}
        />
        <StatCard
          icon={'\u2705'}
          label="Проведено"
          value={dashboard.completedSessions}
          color={COLORS.accent}
        />
        <StatCard
          icon={'\u{1F4B0}'}
          label="Доход/мес"
          value={formatBYN(dashboard.revenueThisMonth)}
          color={COLORS.gold || '#FFD700'}
        />
      </div>

      {/* Pending payments alert */}
      {dashboard.pendingPayments > 0 && (
        <Card variant="warning" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>{'\u{1F4B3}'}</span>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.warning }}>
                Ожидают оплаты
              </p>
              <p style={{ fontSize: 13, color: COLORS.textDim }}>
                {formatBYN(dashboard.pendingPayments)} BYN
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Coach profile summary */}
      <Card style={{ marginBottom: 12 }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: COLORS.textDim, marginBottom: 10 }}>
          Профиль тренера
        </h4>
        {dashboard.coach.bio ? (
          <p style={{ fontSize: 13, color: COLORS.text, marginBottom: 8 }}>{dashboard.coach.bio}</p>
        ) : (
          <p style={{ fontSize: 13, color: COLORS.textMuted, fontStyle: 'italic', marginBottom: 8 }}>
            Заполните профиль, чтобы ученики могли вас найти
          </p>
        )}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {dashboard.coach.hourlyRate && (
            <Badge>{formatBYN(dashboard.coach.hourlyRate)} BYN/час</Badge>
          )}
          {dashboard.coach.specialization && (
            <Badge variant="accent">{dashboard.coach.specialization}</Badge>
          )}
          {dashboard.coach.rating && (
            <Badge style={{ background: `${COLORS.gold || '#FFD700'}20`, color: COLORS.gold || '#FFD700' }}>
              {'\u2B50'} {dashboard.coach.rating.toFixed(1)} ({dashboard.coach.reviewCount})
            </Badge>
          )}
        </div>
      </Card>

      {/* Free tier limit warning */}
      {dashboard.isLimited && (
        <Card style={{ marginBottom: 12, border: `1px solid ${COLORS.purple}40` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>{'\u{1F512}'}</span>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.purple }}>
                Лимит бесплатного тарифа
              </p>
              <p style={{ fontSize: 12, color: COLORS.textDim }}>
                Максимум {dashboard.maxFreeStudents} учеников. Перейдите на PRO для безлимита.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// === Students Tab ===
function StudentsTab({ dashboard, onNavigate }) {
  const [students, setStudents] = useState([]);
  const [cohort, setCohort] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [addError, setAddError] = useState('');

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    try {
      const [studentsList, cohortStats] = await Promise.all([
        api.coach.students(),
        api.coach.cohortStats(),
      ]);
      setStudents(studentsList);
      setCohort(cohortStats);
    } catch (err) {
      console.error('Load students error:', err);
    }
    setLoading(false);
  }

  async function handleSearch(q) {
    setSearchQuery(q);
    setAddError('');
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await api.users.search(q);
      // Filter out already-added students
      const studentIds = students.map((s) => s.id);
      setSearchResults(results.filter((r) => !studentIds.includes(r.id)));
    } catch (err) {
      console.error('Search error:', err);
    }
    setSearching(false);
  }

  async function handleAddStudent(userId) {
    setAddError('');
    try {
      await api.coach.addStudent(userId);
      setShowAddModal(false);
      setSearchQuery('');
      setSearchResults([]);
      await loadStudents();
    } catch (err) {
      setAddError(err.message || 'Ошибка добавления');
    }
  }

  async function handleRemoveStudent(studentId) {
    if (!confirm('Убрать ученика?')) return;
    try {
      await api.coach.removeStudent(studentId);
      await loadStudents();
    } catch (err) {
      console.error('Remove student error:', err);
    }
  }

  if (loading) {
    return <p style={{ color: COLORS.textDim, textAlign: 'center', padding: 20 }}>Загрузка...</p>;
  }

  return (
    <div>
      {/* Cohort summary */}
      {cohort && cohort.totalStudents > 0 && (
        <Card style={{ marginBottom: 12, background: `linear-gradient(135deg, ${COLORS.accent}08, ${COLORS.purple}08)` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
            <div>
              <p style={{ fontSize: 18, fontWeight: 800, color: COLORS.accent, margin: 0 }}>{cohort.avgRating}</p>
              <p style={{ fontSize: 11, color: COLORS.textDim, margin: 0 }}>Средний рейтинг</p>
            </div>
            <div>
              <p style={{ fontSize: 18, fontWeight: 800, color: cohort.avgRatingGrowth >= 0 ? COLORS.accent : COLORS.danger, margin: 0 }}>
                {cohort.avgRatingGrowth >= 0 ? '+' : ''}{cohort.avgRatingGrowth}
              </p>
              <p style={{ fontSize: 11, color: COLORS.textDim, margin: 0 }}>Рост рейтинга</p>
            </div>
            <div>
              <p style={{ fontSize: 18, fontWeight: 800, color: COLORS.purple, margin: 0 }}>{cohort.avgWinRate}%</p>
              <p style={{ fontSize: 11, color: COLORS.textDim, margin: 0 }}>Win rate</p>
            </div>
          </div>
        </Card>
      )}

      {/* Add student button */}
      {!dashboard.isLimited && (
        <Button fullWidth variant="secondary" onClick={() => setShowAddModal(true)} style={{ marginBottom: 12 }}>
          {'\u2795'} Добавить ученика
        </Button>
      )}

      {/* Student list */}
      {students.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 32 }}>
          <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>{'\u{1F393}'}</span>
          <p style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, marginBottom: 6 }}>
            Нет учеников
          </p>
          <p style={{ fontSize: 13, color: COLORS.textDim }}>
            Добавьте первого ученика, чтобы начать отслеживать его прогресс
          </p>
        </Card>
      ) : (
        students.map((s) => (
          <Card
            key={s.id}
            onClick={() => onNavigate('coachStudentDetail', { studentId: s.id })}
            style={{ marginBottom: 8, cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar src={s.photoUrl} name={s.firstName} size={42} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>
                    {s.firstName} {s.lastName || ''}
                  </span>
                  <Badge variant="accent" style={{ fontSize: 11 }}>
                    {s.levelCategory}
                  </Badge>
                </div>
                <div style={{ display: 'flex', gap: 10, fontSize: 12, color: COLORS.textDim }}>
                  <span>{s.rating} ELO</span>
                  <span style={{ color: s.ratingGrowth >= 0 ? COLORS.accent : COLORS.danger }}>
                    {s.ratingGrowth >= 0 ? '+' : ''}{s.ratingGrowth}
                  </span>
                  <span>{s.winRate}% побед</span>
                  <span>{s.matchesPlayed} матчей</span>
                </div>
              </div>
              {/* Mini sparkline */}
              {s.recentHistory && s.recentHistory.length > 1 && (
                <div style={{ width: 50, height: 24 }}>
                  <MiniChart data={s.recentHistory.map((h) => h.newRating)} color={COLORS.accent} />
                </div>
              )}
              <span style={{ color: COLORS.textDim, fontSize: 14 }}>{'\u2192'}</span>
            </div>
          </Card>
        ))
      )}

      {/* Add student modal */}
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); setSearchQuery(''); setSearchResults([]); setAddError(''); }} title="Добавить ученика">
        <Input
          label="Поиск по имени или @username"
          value={searchQuery}
          onChange={(v) => handleSearch(v)}
          placeholder="Введите имя..."
        />
        {addError && (
          <p style={{ color: COLORS.danger, fontSize: 13, marginTop: 4 }}>{addError}</p>
        )}
        {searching && <p style={{ color: COLORS.textDim, fontSize: 13, marginTop: 8 }}>Поиск...</p>}
        <div style={{ marginTop: 8, maxHeight: 300, overflowY: 'auto' }}>
          {searchResults.map((u) => (
            <div
              key={u.id}
              onClick={() => handleAddStudent(u.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 0',
                borderBottom: `1px solid ${COLORS.border}`,
                cursor: 'pointer',
              }}
            >
              <Avatar src={u.photoUrl} name={u.firstName} size={36} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 500, color: COLORS.text, margin: 0 }}>
                  {u.firstName} {u.lastName || ''}
                </p>
                <p style={{ fontSize: 12, color: COLORS.textDim, margin: 0 }}>
                  {u.rating} ELO {u.username ? `· @${u.username}` : ''}
                </p>
              </div>
              <span style={{ color: COLORS.accent, fontSize: 18 }}>{'\u2795'}</span>
            </div>
          ))}
          {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
            <p style={{ color: COLORS.textDim, fontSize: 13, textAlign: 'center', padding: 16 }}>
              Никого не найдено
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}

// === Schedule Tab ===
function ScheduleTab({ dashboard, onNavigate }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [venues, setVenues] = useState([]);
  const [filter, setFilter] = useState('upcoming'); // upcoming | past | all
  const [form, setForm] = useState({
    type: 'INDIVIDUAL',
    date: '',
    time: '',
    durationMin: 60,
    maxStudents: 1,
    price: '',
    venueId: '',
    notes: '',
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSessions();
    loadVenues();
  }, []);

  async function loadVenues() {
    try {
      const v = await api.venues.list();
      setVenues(v);
    } catch (err) {
      console.error('Load venues error:', err);
    }
  }

  async function loadSessions() {
    setLoading(true);
    try {
      const data = await api.coach.sessions();
      setSessions(data);
    } catch (err) {
      console.error('Load sessions error:', err);
    }
    setLoading(false);
  }

  async function handleCreate() {
    setFormError('');
    if (!form.date || !form.time) {
      setFormError('Укажите дату и время');
      return;
    }
    setSaving(true);
    try {
      const dateTime = new Date(`${form.date}T${form.time}`);
      await api.coach.createSession({
        type: form.type,
        date: dateTime.toISOString(),
        durationMin: parseInt(form.durationMin) || 60,
        maxStudents: form.type === 'GROUP' ? (parseInt(form.maxStudents) || 4) : 1,
        price: form.price ? Math.round(parseFloat(form.price) * 100) : 0,
        venueId: form.venueId ? parseInt(form.venueId) : null,
        notes: form.notes || null,
      });
      setShowCreateModal(false);
      setForm({ type: 'INDIVIDUAL', date: '', time: '', durationMin: 60, maxStudents: 1, price: '', venueId: '', notes: '' });
      await loadSessions();
    } catch (err) {
      setFormError(err.message || 'Ошибка');
    }
    setSaving(false);
  }

  async function handleCancel(sessionId) {
    if (!confirm('Отменить тренировку? Ученики получат уведомление.')) return;
    try {
      await api.coach.cancelSession(sessionId);
      await loadSessions();
    } catch (err) {
      console.error('Cancel session error:', err);
      alert(err.message || 'Ошибка');
    }
  }

  async function handleComplete(sessionId) {
    try {
      await api.coach.completeSession(sessionId);
      await loadSessions();
    } catch (err) {
      console.error('Complete session error:', err);
    }
  }

  async function handleDelete(sessionId) {
    if (!confirm('Удалить тренировку?')) return;
    try {
      await api.coach.deleteSession(sessionId);
      await loadSessions();
    } catch (err) {
      alert(err.message || 'Ошибка');
    }
  }

  if (loading) {
    return <p style={{ color: COLORS.textDim, textAlign: 'center', padding: 20 }}>Загрузка...</p>;
  }

  const now = new Date();
  const filtered = sessions.filter((s) => {
    if (filter === 'upcoming') return new Date(s.date) > now && s.status !== 'CANCELLED';
    if (filter === 'past') return new Date(s.date) <= now || s.status === 'COMPLETED' || s.status === 'CANCELLED';
    return true;
  });

  return (
    <div>
      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {[
          { id: 'upcoming', label: 'Предстоящие' },
          { id: 'past', label: 'Прошедшие' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: 'none',
              background: filter === f.id ? COLORS.purple : COLORS.surface,
              color: filter === f.id ? '#fff' : COLORS.textDim,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Create button */}
      <Button fullWidth variant="secondary" onClick={() => setShowCreateModal(true)} style={{ marginBottom: 12 }}>
        {'\u2795'} Создать тренировку
      </Button>

      {/* Session list */}
      {filtered.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 32 }}>
          <span style={{ fontSize: 40, display: 'block', marginBottom: 10 }}>{'\u{1F4C5}'}</span>
          <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>
            {filter === 'upcoming' ? 'Нет предстоящих тренировок' : 'Нет прошедших тренировок'}
          </p>
          <p style={{ fontSize: 13, color: COLORS.textDim }}>
            Создайте тренировку, ученики смогут записаться
          </p>
        </Card>
      ) : (
        filtered.map((s) => {
          const d = new Date(s.date);
          const dateStr = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
          const timeStr = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
          const isPast = d <= now;
          const statusColors = {
            OPEN: COLORS.accent,
            FULL: COLORS.purple,
            CONFIRMED: COLORS.accent,
            COMPLETED: COLORS.textDim,
            CANCELLED: COLORS.danger,
          };
          const statusLabels = {
            OPEN: 'Открыта',
            FULL: 'Заполнена',
            CONFIRMED: 'Подтверждена',
            COMPLETED: 'Завершена',
            CANCELLED: 'Отменена',
          };

          return (
            <Card
              key={s.id}
              style={{ marginBottom: 8, opacity: s.status === 'CANCELLED' ? 0.5 : 1 }}
              onClick={() => onNavigate('coachSessionDetail', { sessionId: s.id })}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 16 }}>
                    {s.type === 'GROUP' ? '\u{1F46B}' : '\u{1F464}'}
                  </span>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, margin: 0 }}>
                      {dateStr}, {timeStr}
                    </p>
                    <p style={{ fontSize: 12, color: COLORS.textDim, margin: 0 }}>
                      {s.type === 'GROUP' ? 'Групповая' : 'Индивидуальная'} · {s.durationMin} мин
                    </p>
                  </div>
                </div>
                <Badge style={{ background: `${statusColors[s.status]}20`, color: statusColors[s.status], fontSize: 11 }}>
                  {statusLabels[s.status]}
                </Badge>
              </div>

              {s.venue && (
                <p style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 4 }}>
                  {'\u{1F4CD}'} {s.venue.name}
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: COLORS.textDim }}>
                    {'\u{1F464}'} {s.bookedCount}/{s.maxStudents}
                  </span>
                  {s.price > 0 && (
                    <span style={{ fontSize: 12, color: COLORS.accent, fontWeight: 600 }}>
                      {formatBYN(s.price)} BYN
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                  {!isPast && s.status !== 'CANCELLED' && s.status !== 'COMPLETED' && (
                    <>
                      <button
                        onClick={() => handleComplete(s.id)}
                        style={{ background: 'none', border: 'none', color: COLORS.accent, fontSize: 18, cursor: 'pointer', padding: 4 }}
                        title="Завершить"
                      >{'\u2705'}</button>
                      <button
                        onClick={() => handleCancel(s.id)}
                        style={{ background: 'none', border: 'none', color: COLORS.danger, fontSize: 18, cursor: 'pointer', padding: 4 }}
                        title="Отменить"
                      >{'\u274C'}</button>
                    </>
                  )}
                  {(s.status === 'CANCELLED' || (s.status !== 'COMPLETED' && s.bookedCount === 0)) && (
                    <button
                      onClick={() => handleDelete(s.id)}
                      style={{ background: 'none', border: 'none', color: COLORS.textDim, fontSize: 16, cursor: 'pointer', padding: 4 }}
                      title="Удалить"
                    >{'\u{1F5D1}'}</button>
                  )}
                </div>
              </div>
            </Card>
          );
        })
      )}

      {/* Create session modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setFormError(''); }}
        title="Новая тренировка"
      >
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {[
            { value: 'INDIVIDUAL', label: '\u{1F464} Индивид.' },
            { value: 'GROUP', label: '\u{1F46B} Групповая' },
          ].map((t) => (
            <button
              key={t.value}
              onClick={() => setForm({ ...form, type: t.value, maxStudents: t.value === 'GROUP' ? 4 : 1 })}
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: 10,
                border: `1px solid ${form.type === t.value ? COLORS.purple : COLORS.border}`,
                background: form.type === t.value ? `${COLORS.purple}20` : COLORS.surface,
                color: form.type === t.value ? COLORS.purple : COLORS.textDim,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <Input
            label="Дата"
            type="date"
            value={form.date}
            onChange={(v) => setForm({ ...form, date: v })}
            style={{ flex: 1 }}
          />
          <Input
            label="Время"
            type="time"
            value={form.time}
            onChange={(v) => setForm({ ...form, time: v })}
            style={{ flex: 1 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <Input
            label="Длительность (мин)"
            type="number"
            value={String(form.durationMin)}
            onChange={(v) => setForm({ ...form, durationMin: v })}
            style={{ flex: 1 }}
          />
          <Input
            label="Цена (BYN)"
            type="number"
            value={form.price}
            onChange={(v) => setForm({ ...form, price: v })}
            placeholder="0"
            style={{ flex: 1 }}
          />
        </div>

        {form.type === 'GROUP' && (
          <Input
            label="Макс. учеников"
            type="number"
            value={String(form.maxStudents)}
            onChange={(v) => setForm({ ...form, maxStudents: v })}
          />
        )}

        {venues.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <p style={{ fontSize: 13, color: COLORS.text, marginBottom: 4, fontWeight: 500 }}>Площадка</p>
            <select
              value={form.venueId}
              onChange={(e) => setForm({ ...form, venueId: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: `1px solid ${COLORS.border}`,
                background: COLORS.surface,
                color: COLORS.text,
                fontSize: 14,
              }}
            >
              <option value="">Не указана</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
        )}

        <Input
          label="Заметка"
          value={form.notes}
          onChange={(v) => setForm({ ...form, notes: v })}
          placeholder="Что будем отрабатывать..."
        />

        {formError && (
          <p style={{ color: COLORS.danger, fontSize: 13, marginTop: 4 }}>{formError}</p>
        )}

        <Button
          fullWidth
          onClick={handleCreate}
          disabled={saving}
          style={{ marginTop: 8 }}
        >
          {saving ? 'Создание...' : 'Создать тренировку'}
        </Button>
      </Modal>
    </div>
  );
}

// === Payments Tab ===
function PaymentsTab({ dashboard }) {
  const [summary, setSummary] = useState(null);
  const [payments, setPayments] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState('overview'); // overview | payments | packages
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [students, setStudents] = useState([]);
  const [paymentForm, setPaymentForm] = useState({ studentId: '', amount: '', note: '', status: 'AWAITING' });
  const [packageForm, setPackageForm] = useState({ studentId: '', totalSessions: '', priceTotal: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPaymentData();
  }, []);

  async function loadPaymentData() {
    try {
      const [sum, pays, pkgs, studs] = await Promise.all([
        api.coach.paymentSummary(),
        api.coach.payments(),
        api.coach.packages(),
        api.coach.students(),
      ]);
      setSummary(sum);
      setPayments(pays);
      setPackages(pkgs);
      setStudents(studs);
    } catch (err) {
      console.error('Load payment data error:', err);
    }
    setLoading(false);
  }

  async function handleCreatePayment() {
    setFormError('');
    if (!paymentForm.studentId || !paymentForm.amount) {
      setFormError('Укажите ученика и сумму');
      return;
    }
    setSaving(true);
    try {
      await api.coach.createPayment({
        studentId: parseInt(paymentForm.studentId),
        amount: Math.round(parseFloat(paymentForm.amount) * 100),
        note: paymentForm.note || null,
        status: paymentForm.status,
      });
      setShowPaymentModal(false);
      setPaymentForm({ studentId: '', amount: '', note: '', status: 'AWAITING' });
      await loadPaymentData();
    } catch (err) {
      setFormError(err.message || 'Ошибка');
    }
    setSaving(false);
  }

  async function handleMarkPaid(paymentId) {
    try {
      await api.coach.updatePayment(paymentId, { status: 'PAID' });
      await loadPaymentData();
    } catch (err) {
      alert(err.message || 'Ошибка');
    }
  }

  async function handleDeletePayment(paymentId) {
    if (!confirm('Удалить запись об оплате?')) return;
    try {
      await api.coach.deletePayment(paymentId);
      await loadPaymentData();
    } catch (err) {
      alert(err.message || 'Ошибка');
    }
  }

  async function handleCreatePackage() {
    setFormError('');
    if (!packageForm.studentId || !packageForm.totalSessions || !packageForm.priceTotal) {
      setFormError('Заполните все поля');
      return;
    }
    setSaving(true);
    try {
      await api.coach.createPackage({
        studentId: parseInt(packageForm.studentId),
        totalSessions: parseInt(packageForm.totalSessions),
        priceTotal: Math.round(parseFloat(packageForm.priceTotal) * 100),
      });
      setShowPackageModal(false);
      setPackageForm({ studentId: '', totalSessions: '', priceTotal: '' });
      await loadPaymentData();
    } catch (err) {
      setFormError(err.message || 'Ошибка');
    }
    setSaving(false);
  }

  async function handleUsePackageSession(packageId) {
    try {
      await api.coach.usePackageSession(packageId);
      await loadPaymentData();
    } catch (err) {
      alert(err.message || 'Ошибка');
    }
  }

  async function handleDeactivatePackage(packageId) {
    if (!confirm('Деактивировать пакет?')) return;
    try {
      await api.coach.updatePackage(packageId, { active: false });
      await loadPaymentData();
    } catch (err) {
      alert(err.message || 'Ошибка');
    }
  }

  if (loading) {
    return <p style={{ color: COLORS.textDim, textAlign: 'center', padding: 20 }}>Загрузка...</p>;
  }

  return (
    <div>
      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {[
          { id: 'overview', label: '\u{1F4CA} Сводка' },
          { id: 'payments', label: '\u{1F4B3} Оплаты' },
          { id: 'packages', label: '\u{1F4E6} Пакеты' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: 'none',
              background: subTab === t.id ? COLORS.purple : COLORS.surface,
              color: subTab === t.id ? '#fff' : COLORS.textDim,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview sub-tab */}
      {subTab === 'overview' && summary && (
        <div>
          {/* Revenue cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <Card style={{ textAlign: 'center', padding: 14 }}>
              <p style={{ fontSize: 11, color: COLORS.textDim, margin: 0 }}>Этот месяц</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: COLORS.accent, margin: '4px 0' }}>
                {formatBYN(summary.thisMonth)}
              </p>
              <p style={{ fontSize: 11, color: COLORS.textDim, margin: 0 }}>BYN</p>
            </Card>
            <Card style={{ textAlign: 'center', padding: 14 }}>
              <p style={{ fontSize: 11, color: COLORS.textDim, margin: 0 }}>Прошлый месяц</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: COLORS.text, margin: '4px 0' }}>
                {formatBYN(summary.prevMonth)}
              </p>
              <p style={{ fontSize: 11, color: COLORS.textDim, margin: 0 }}>BYN</p>
            </Card>
          </div>

          {/* Trend */}
          {summary.prevMonth > 0 && (
            <Card style={{ marginBottom: 12, background: `linear-gradient(135deg, ${COLORS.accent}08, ${COLORS.purple}08)` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>
                  {summary.thisMonth >= summary.prevMonth ? '\u{1F4C8}' : '\u{1F4C9}'}
                </span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, margin: 0 }}>
                    {summary.thisMonth >= summary.prevMonth ? 'Рост' : 'Снижение'} дохода
                  </p>
                  <p style={{ fontSize: 12, color: COLORS.textDim, margin: 0 }}>
                    {summary.prevMonth > 0
                      ? `${Math.round(((summary.thisMonth - summary.prevMonth) / summary.prevMonth) * 100)}%`
                      : '—'} по сравнению с прошлым месяцем
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Awaiting alert */}
          {summary.totalAwaiting > 0 && (
            <Card variant="warning" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>{'\u23F3'}</span>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.warning, margin: 0 }}>
                    Ожидают оплаты: {formatBYN(summary.totalAwaiting)} BYN
                  </p>
                  <p style={{ fontSize: 12, color: COLORS.textDim, margin: 0 }}>
                    {summary.awaitingCount} записей
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* All-time */}
          <Card style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: COLORS.textDim }}>Всего заработано</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.accent }}>
                {formatBYN(summary.allTimeTotal)} BYN
              </span>
            </div>
          </Card>

          {/* Per-student balances */}
          {summary.studentBalances && summary.studentBalances.length > 0 && (
            <>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: COLORS.textDim, marginBottom: 8 }}>
                Балансы учеников
              </h4>
              {summary.studentBalances.map((s) => (
                <Card key={s.id} style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar src={s.photoUrl} name={s.firstName} size={32} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, margin: 0 }}>
                        {s.firstName} {s.lastName || ''}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {s.awaiting > 0 && (
                        <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.warning, margin: 0 }}>
                          {formatBYN(s.awaiting)} BYN
                        </p>
                      )}
                      {s.packageSessionsLeft > 0 && (
                        <p style={{ fontSize: 11, color: COLORS.purple, margin: 0 }}>
                          {'\u{1F4E6}'} {s.packageSessionsLeft} тр.
                        </p>
                      )}
                      {s.awaiting === 0 && s.packageSessionsLeft === 0 && (
                        <Badge variant="accent" style={{ fontSize: 10 }}>{'\u2705'}</Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </>
          )}
        </div>
      )}

      {/* Payments sub-tab */}
      {subTab === 'payments' && (
        <div>
          <Button fullWidth variant="secondary" onClick={() => setShowPaymentModal(true)} style={{ marginBottom: 12 }}>
            {'\u2795'} Записать оплату
          </Button>

          {payments.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: 32 }}>
              <span style={{ fontSize: 40, display: 'block', marginBottom: 10 }}>{'\u{1F4B3}'}</span>
              <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>Нет записей об оплатах</p>
              <p style={{ fontSize: 13, color: COLORS.textDim }}>
                Записывайте оплаты учеников для учёта
              </p>
            </Card>
          ) : (
            payments.map((p) => {
              const statusColor = p.status === 'PAID' ? COLORS.accent : p.status === 'AWAITING' ? COLORS.warning : COLORS.danger;
              const statusLabel = p.status === 'PAID' ? 'Оплачено' : p.status === 'AWAITING' ? 'Ожидает' : 'Возврат';
              return (
                <Card key={p.id} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar src={p.student?.photoUrl} name={p.student?.firstName} size={32} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>
                          {formatBYN(p.amount)} BYN
                        </span>
                        <Badge style={{ background: `${statusColor}20`, color: statusColor, fontSize: 10 }}>
                          {statusLabel}
                        </Badge>
                        {p.type === 'PACKAGE' && (
                          <Badge style={{ fontSize: 10 }}>{'\u{1F4E6}'}</Badge>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: COLORS.textDim, margin: 0 }}>
                        {p.student?.firstName} {p.student?.lastName || ''} · {new Date(p.createdAt).toLocaleDateString('ru-RU')}
                      </p>
                      {p.note && (
                        <p style={{ fontSize: 11, color: COLORS.textDim, margin: '2px 0 0', fontStyle: 'italic' }}>
                          {p.note}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {p.status === 'AWAITING' && (
                        <button
                          onClick={() => handleMarkPaid(p.id)}
                          style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4 }}
                          title="Отметить оплаченным"
                        >{'\u2705'}</button>
                      )}
                      <button
                        onClick={() => handleDeletePayment(p.id)}
                        style={{ background: 'none', border: 'none', color: COLORS.textDim, fontSize: 14, cursor: 'pointer', padding: 4 }}
                        title="Удалить"
                      >{'\u{1F5D1}'}</button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Packages sub-tab */}
      {subTab === 'packages' && (
        <div>
          <Button fullWidth variant="secondary" onClick={() => setShowPackageModal(true)} style={{ marginBottom: 12 }}>
            {'\u2795'} Создать пакет
          </Button>

          {packages.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: 32 }}>
              <span style={{ fontSize: 40, display: 'block', marginBottom: 10 }}>{'\u{1F4E6}'}</span>
              <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>Нет пакетов</p>
              <p style={{ fontSize: 13, color: COLORS.textDim }}>
                Создайте пакет тренировок для ученика со скидкой
              </p>
            </Card>
          ) : (
            packages.map((pkg) => {
              const progress = pkg.totalSessions > 0 ? pkg.usedSessions / pkg.totalSessions : 0;
              const remaining = pkg.totalSessions - pkg.usedSessions;
              return (
                <Card key={pkg.id} style={{ marginBottom: 8, opacity: pkg.active ? 1 : 0.5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <Avatar src={pkg.student?.photoUrl} name={pkg.student?.firstName} size={32} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>
                          {pkg.student?.firstName} {pkg.student?.lastName || ''}
                        </span>
                        {!pkg.active && <Badge variant="danger" style={{ fontSize: 10 }}>Закрыт</Badge>}
                      </div>
                      <p style={{ fontSize: 12, color: COLORS.textDim, margin: 0 }}>
                        {formatBYN(pkg.priceTotal)} BYN · {pkg.totalSessions} тренировок
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: COLORS.textDim }}>Использовано: {pkg.usedSessions}/{pkg.totalSessions}</span>
                      <span style={{ color: remaining > 0 ? COLORS.accent : COLORS.danger, fontWeight: 600 }}>
                        Осталось: {remaining}
                      </span>
                    </div>
                    <div style={{
                      height: 6,
                      borderRadius: 3,
                      background: COLORS.surface,
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(100, progress * 100)}%`,
                        borderRadius: 3,
                        background: remaining > 0 ? COLORS.purple : COLORS.danger,
                        transition: 'width 0.3s',
                      }} />
                    </div>
                  </div>

                  {pkg.active && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      {remaining > 0 && (
                        <Button size="sm" variant="outline" onClick={() => handleUsePackageSession(pkg.id)} style={{ flex: 1 }}>
                          {'\u2796'} Списать тренировку
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleDeactivatePackage(pkg.id)}>
                        {'\u274C'}
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Create payment modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => { setShowPaymentModal(false); setFormError(''); }}
        title="Записать оплату"
      >
        <div style={{ marginBottom: 8 }}>
          <p style={{ fontSize: 13, color: COLORS.text, marginBottom: 4, fontWeight: 500 }}>Ученик</p>
          <select
            value={paymentForm.studentId}
            onChange={(e) => setPaymentForm({ ...paymentForm, studentId: e.target.value })}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 10,
              border: `1px solid ${COLORS.border}`,
              background: COLORS.surface,
              color: COLORS.text,
              fontSize: 14,
            }}
          >
            <option value="">Выберите ученика</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.firstName} {s.lastName || ''}</option>
            ))}
          </select>
        </div>

        <Input
          label="Сумма (BYN)"
          type="number"
          value={paymentForm.amount}
          onChange={(v) => setPaymentForm({ ...paymentForm, amount: v })}
          placeholder="0.00"
        />

        <Input
          label="Заметка"
          value={paymentForm.note}
          onChange={(v) => setPaymentForm({ ...paymentForm, note: v })}
          placeholder="За что оплата..."
        />

        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          {[
            { value: 'AWAITING', label: '\u23F3 Ожидает' },
            { value: 'PAID', label: '\u2705 Оплачено' },
          ].map((s) => (
            <button
              key={s.value}
              onClick={() => setPaymentForm({ ...paymentForm, status: s.value })}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 8,
                border: `1px solid ${paymentForm.status === s.value ? COLORS.accent : COLORS.border}`,
                background: paymentForm.status === s.value ? `${COLORS.accent}20` : COLORS.surface,
                color: paymentForm.status === s.value ? COLORS.accent : COLORS.textDim,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {formError && <p style={{ color: COLORS.danger, fontSize: 13, marginTop: 4 }}>{formError}</p>}

        <Button fullWidth onClick={handleCreatePayment} disabled={saving} style={{ marginTop: 8 }}>
          {saving ? 'Сохранение...' : 'Записать'}
        </Button>
      </Modal>

      {/* Create package modal */}
      <Modal
        isOpen={showPackageModal}
        onClose={() => { setShowPackageModal(false); setFormError(''); }}
        title="Новый пакет"
      >
        <div style={{ marginBottom: 8 }}>
          <p style={{ fontSize: 13, color: COLORS.text, marginBottom: 4, fontWeight: 500 }}>Ученик</p>
          <select
            value={packageForm.studentId}
            onChange={(e) => setPackageForm({ ...packageForm, studentId: e.target.value })}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 10,
              border: `1px solid ${COLORS.border}`,
              background: COLORS.surface,
              color: COLORS.text,
              fontSize: 14,
            }}
          >
            <option value="">Выберите ученика</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.firstName} {s.lastName || ''}</option>
            ))}
          </select>
        </div>

        <Input
          label="Количество тренировок"
          type="number"
          value={packageForm.totalSessions}
          onChange={(v) => setPackageForm({ ...packageForm, totalSessions: v })}
          placeholder="8"
        />

        <Input
          label="Стоимость пакета (BYN)"
          type="number"
          value={packageForm.priceTotal}
          onChange={(v) => setPackageForm({ ...packageForm, priceTotal: v })}
          placeholder="200.00"
        />

        {packageForm.totalSessions && packageForm.priceTotal && (
          <p style={{ fontSize: 12, color: COLORS.accent, marginBottom: 4 }}>
            {'\u2248'} {(parseFloat(packageForm.priceTotal) / parseInt(packageForm.totalSessions || 1)).toFixed(2)} BYN за тренировку
          </p>
        )}

        {formError && <p style={{ color: COLORS.danger, fontSize: 13, marginTop: 4 }}>{formError}</p>}

        <Button fullWidth onClick={handleCreatePackage} disabled={saving} style={{ marginTop: 8 }}>
          {saving ? 'Создание...' : 'Создать пакет'}
        </Button>
      </Modal>
    </div>
  );
}

// === Helper components ===
function StatCard({ icon, label, value, subtitle, color }) {
  return (
    <Card style={{ textAlign: 'center', padding: 14 }}>
      <span style={{ fontSize: 22, display: 'block', marginBottom: 4 }}>{icon}</span>
      <p style={{ fontSize: 22, fontWeight: 800, color, margin: 0 }}>{value}</p>
      <p style={{ fontSize: 12, color: COLORS.textDim, margin: 0 }}>
        {label}{subtitle ? ` (${subtitle})` : ''}
      </p>
    </Card>
  );
}

function formatBYN(kopeks) {
  if (!kopeks) return '0';
  return (kopeks / 100).toFixed(kopeks % 100 === 0 ? 0 : 2);
}
