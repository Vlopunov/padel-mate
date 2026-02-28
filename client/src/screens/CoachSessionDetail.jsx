import React, { useEffect, useState } from 'react';
import { COLORS } from '../config';
import { Card } from '../components/ui/Card';
import { Header } from '../components/ui/Header';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { api } from '../services/api';

export function CoachSessionDetail({ sessionId, onBack, onNavigate }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  async function loadSession() {
    try {
      const data = await api.coach.sessionDetail(sessionId);
      setSession(data);
    } catch (err) {
      console.error('Load session error:', err);
    }
    setLoading(false);
  }

  async function handleCancel() {
    if (!confirm('Отменить тренировку? Ученики получат уведомление.')) return;
    try {
      await api.coach.cancelSession(sessionId);
      await loadSession();
    } catch (err) {
      alert(err.message || 'Ошибка');
    }
  }

  async function handleComplete() {
    try {
      await api.coach.completeSession(sessionId);
      await loadSession();
    } catch (err) {
      alert(err.message || 'Ошибка');
    }
  }

  async function handleDelete() {
    if (!confirm('Удалить тренировку?')) return;
    try {
      await api.coach.deleteSession(sessionId);
      onBack();
    } catch (err) {
      alert(err.message || 'Ошибка');
    }
  }

  if (loading) {
    return (
      <div>
        <Header title="Тренировка" onBack={onBack} />
        <div style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: COLORS.textDim }}>Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div>
        <Header title="Тренировка" onBack={onBack} />
        <div style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: COLORS.danger }}>Тренировка не найдена</p>
        </div>
      </div>
    );
  }

  const d = new Date(session.date);
  const dateStr = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const isPast = d <= new Date();
  const isActive = !['CANCELLED', 'COMPLETED'].includes(session.status);

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

  const activeBookings = session.bookings?.filter((b) => b.status === 'CONFIRMED' || b.status === 'PENDING') || [];
  const cancelledBookings = session.bookings?.filter((b) => b.status === 'CANCELLED') || [];

  return (
    <div>
      <Header title="Тренировка" onBack={onBack} />

      {/* Session info */}
      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <p style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, margin: 0 }}>
              {dateStr}
            </p>
            <p style={{ fontSize: 15, color: COLORS.textDim, margin: 0 }}>
              {timeStr} · {session.durationMin} мин
            </p>
          </div>
          <Badge style={{ background: `${statusColors[session.status]}20`, color: statusColors[session.status] }}>
            {statusLabels[session.status]}
          </Badge>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 16 }}>
              {session.type === 'GROUP' ? '\u{1F46B}' : '\u{1F464}'}
            </span>
            <span style={{ fontSize: 13, color: COLORS.text }}>
              {session.type === 'GROUP' ? 'Групповая' : 'Индивидуальная'}
            </span>
          </div>
          {session.venue && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 16 }}>{'\u{1F4CD}'}</span>
              <span style={{ fontSize: 13, color: COLORS.text }}>{session.venue.name}</span>
            </div>
          )}
          {session.price > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 16 }}>{'\u{1F4B0}'}</span>
              <span style={{ fontSize: 13, color: COLORS.accent, fontWeight: 600 }}>
                {(session.price / 100).toFixed(session.price % 100 === 0 ? 0 : 2)} BYN
              </span>
            </div>
          )}
        </div>

        {session.notes && (
          <div style={{ background: COLORS.surface, borderRadius: 10, padding: 12, marginBottom: 12 }}>
            <p style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 4 }}>Заметка</p>
            <p style={{ fontSize: 13, color: COLORS.text, margin: 0 }}>{session.notes}</p>
          </div>
        )}

        {/* Capacity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            flex: 1,
            height: 6,
            borderRadius: 3,
            background: COLORS.surface,
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${(activeBookings.length / session.maxStudents) * 100}%`,
              height: '100%',
              borderRadius: 3,
              background: activeBookings.length >= session.maxStudents ? COLORS.purple : COLORS.accent,
              transition: 'width 0.3s',
            }} />
          </div>
          <span style={{ fontSize: 12, color: COLORS.textDim, whiteSpace: 'nowrap' }}>
            {activeBookings.length}/{session.maxStudents}
          </span>
        </div>
      </Card>

      {/* Booked students */}
      <Card style={{ marginBottom: 12 }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: COLORS.textDim, marginBottom: 12 }}>
          {'\u{1F393}'} Записанные ученики ({activeBookings.length})
        </h4>

        {activeBookings.length === 0 ? (
          <p style={{ fontSize: 13, color: COLORS.textDim, fontStyle: 'italic' }}>
            Пока никто не записался
          </p>
        ) : (
          activeBookings.map((b) => (
            <div
              key={b.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 0',
                borderBottom: `1px solid ${COLORS.border}`,
              }}
              onClick={() => onNavigate('coachStudentDetail', { studentId: b.student.id })}
            >
              <Avatar src={b.student.photoUrl} name={b.student.firstName} size={36} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 500, color: COLORS.text, margin: 0 }}>
                  {b.student.firstName} {b.student.lastName || ''}
                </p>
                <p style={{ fontSize: 12, color: COLORS.textDim, margin: 0 }}>
                  {b.student.rating} ELO · {b.status === 'CONFIRMED' ? 'Подтверждён' : 'Ожидание'}
                </p>
              </div>
              <Badge
                style={{
                  background: b.status === 'CONFIRMED' ? `${COLORS.accent}20` : `${COLORS.warning}20`,
                  color: b.status === 'CONFIRMED' ? COLORS.accent : COLORS.warning,
                  fontSize: 11,
                }}
              >
                {b.status === 'CONFIRMED' ? '\u2705' : '\u23F3'}
              </Badge>
            </div>
          ))
        )}

        {cancelledBookings.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 6 }}>
              Отменили запись ({cancelledBookings.length}):
            </p>
            {cancelledBookings.map((b) => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', opacity: 0.5 }}>
                <Avatar src={b.student.photoUrl} name={b.student.firstName} size={24} />
                <span style={{ fontSize: 12, color: COLORS.textDim }}>
                  {b.student.firstName} {b.student.lastName || ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Actions */}
      {isActive && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <Button variant="secondary" onClick={handleComplete} style={{ flex: 1 }}>
            {'\u2705'} Завершить
          </Button>
          <Button variant="danger" onClick={handleCancel} style={{ flex: 1 }}>
            {'\u274C'} Отменить
          </Button>
        </div>
      )}

      {(!isActive || activeBookings.length === 0) && (
        <Button variant="danger" fullWidth onClick={handleDelete} style={{ opacity: 0.7 }}>
          {'\u{1F5D1}'} Удалить тренировку
        </Button>
      )}
    </div>
  );
}
