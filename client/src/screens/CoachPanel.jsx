import React, { useEffect, useState } from 'react';
import { COLORS } from '../config';
import { Card } from '../components/ui/Card';
import { Header } from '../components/ui/Header';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
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
      {activeTab === 'students' && <StudentsTab dashboard={dashboard} />}
      {activeTab === 'schedule' && <ScheduleTab dashboard={dashboard} />}
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

// === Students Tab (placeholder) ===
function StudentsTab({ dashboard }) {
  return (
    <div>
      <Card style={{ textAlign: 'center', padding: 32 }}>
        <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>{'\u{1F393}'}</span>
        <p style={{ fontSize: 16, fontWeight: 600, color: COLORS.text, marginBottom: 6 }}>
          Управление учениками
        </p>
        <p style={{ fontSize: 13, color: COLORS.textDim, marginBottom: 16 }}>
          Добавляйте учеников, отслеживайте их прогресс, рейтинг и статистику матчей
        </p>
        <Badge variant="accent">Скоро</Badge>
      </Card>
    </div>
  );
}

// === Schedule Tab (placeholder) ===
function ScheduleTab({ dashboard }) {
  return (
    <div>
      <Card style={{ textAlign: 'center', padding: 32 }}>
        <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>{'\u{1F4C5}'}</span>
        <p style={{ fontSize: 16, fontWeight: 600, color: COLORS.text, marginBottom: 6 }}>
          Расписание тренировок
        </p>
        <p style={{ fontSize: 13, color: COLORS.textDim, marginBottom: 16 }}>
          Создавайте слоты тренировок, ученики смогут записываться через приложение
        </p>
        <Badge variant="accent">Скоро</Badge>
      </Card>
    </div>
  );
}

// === Payments Tab (placeholder) ===
function PaymentsTab({ dashboard }) {
  return (
    <div>
      <Card style={{ textAlign: 'center', padding: 32 }}>
        <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>{'\u{1F4B0}'}</span>
        <p style={{ fontSize: 16, fontWeight: 600, color: COLORS.text, marginBottom: 6 }}>
          Учёт оплат
        </p>
        <p style={{ fontSize: 13, color: COLORS.textDim, marginBottom: 16 }}>
          Отслеживайте оплаты учеников, создавайте пакеты тренировок
        </p>
        <Badge variant="accent">Скоро</Badge>
      </Card>
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
