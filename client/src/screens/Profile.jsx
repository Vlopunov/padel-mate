import React, { useState } from 'react';
import { COLORS, APP_NAME, TG_CHANNEL, TG_CHAT, CITIES, getLevel, getXpLevel } from '../config';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { ToggleGroup } from '../components/ui/ToggleGroup';
import { useTelegram } from '../hooks/useTelegram';
import { api } from '../services/api';

export function Profile({ user, onUpdate, onLogout, onNavigate }) {
  const { openTelegramLink } = useTelegram();
  const [showRatingEdit, setShowRatingEdit] = useState(false);
  const [newRating, setNewRating] = useState('');
  const [ratingReason, setRatingReason] = useState('');

  if (!user) return null;

  const level = getLevel(user.rating);
  const xp = getXpLevel(user.xp || 0);
  const winRate = user.matchesPlayed > 0 ? Math.round((user.wins / user.matchesPlayed) * 100) : 0;

  const handleUpdate = async (field, value) => {
    try {
      await api.users.update({ [field]: value });
      onUpdate();
    } catch (err) {
      console.error('Update error:', err);
    }
  };

  const handleRatingEdit = async () => {
    try {
      await api.users.updateRating({
        newRating: parseInt(newRating),
        reason: ratingReason || 'Ручное редактирование',
      });
      setShowRatingEdit(false);
      setNewRating('');
      setRatingReason('');
      onUpdate();
    } catch (err) {
      console.error('Rating edit error:', err);
    }
  };

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Profile header */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <Avatar src={user.photoUrl} name={user.firstName} size={80} style={{ margin: '0 auto 12px' }} />
        <h2 style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, margin: 0 }}>
          {user.firstName} {user.lastName || ''}
        </h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          {user.isVip && (
            <Badge style={{ background: `${COLORS.gold}25`, color: COLORS.gold, fontWeight: 700 }}>⭐ VIP</Badge>
          )}
          <Badge variant="accent">{user.rating} — {level.category} {level.name}</Badge>
          <Badge>{xp.current.icon} {xp.current.name}</Badge>
        </div>
        <p style={{ fontSize: 13, color: COLORS.textDim, marginTop: 6 }}>
          {CITIES.find((c) => c.value === user.city)?.label || user.city}
        </p>
      </div>

      {/* Community banner */}
      <Card style={{ marginBottom: 12, background: `linear-gradient(135deg, ${COLORS.accent}10, ${COLORS.purple}10)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 20 }}>{'\u{1F3BE}'}</span>
          <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{APP_NAME} Community</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="sm" variant="outline" onClick={() => openTelegramLink('https://t.me/+lYChWj6kOAowYzIy')} style={{ flex: 1 }}>
            {'\u{1F4E2}'} Канал
          </Button>
          <Button size="sm" variant="outline" onClick={() => openTelegramLink('https://t.me/+vN-cOzsA47E2OGY6')} style={{ flex: 1 }}>
            {'\u{1F4AC}'} Чат
          </Button>
        </div>
      </Card>

      {/* Game data */}
      <Card style={{ marginBottom: 12 }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: COLORS.textDim, marginBottom: 12 }}>
          Игровые данные
        </h4>

        <p style={{ fontSize: 13, color: COLORS.text, marginBottom: 6, fontWeight: 500 }}>Рука</p>
        <ToggleGroup
          options={[
            { value: 'RIGHT', label: 'Правша' },
            { value: 'LEFT', label: 'Левша' },
          ]}
          value={user.hand}
          onChange={(v) => handleUpdate('hand', v)}
          allowDeselect
        />

        <p style={{ fontSize: 13, color: COLORS.text, marginBottom: 6, marginTop: 14, fontWeight: 500 }}>Позиция на корте</p>
        <ToggleGroup
          options={[
            { value: 'DERECHA', label: 'Справа' },
            { value: 'REVES', label: 'Слева' },
            { value: 'BOTH', label: 'Обе' },
          ]}
          value={user.position}
          onChange={(v) => handleUpdate('position', v)}
          allowDeselect
        />

        <p style={{ fontSize: 13, color: COLORS.text, marginBottom: 6, marginTop: 14, fontWeight: 500 }}>Игровой опыт</p>
        <ToggleGroup
          options={[
            { value: 'BEGINNER', label: 'Начинающий' },
            { value: 'LESS_YEAR', label: 'До года' },
            { value: 'ONE_THREE', label: '1-3 года' },
            { value: 'THREE_PLUS', label: '3+ года' },
          ]}
          value={user.experience}
          onChange={(v) => handleUpdate('experience', v)}
          allowDeselect
        />

        <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
          <div>
            <p style={{ fontSize: 22, fontWeight: 700, color: COLORS.text }}>{user.matchesPlayed}</p>
            <p style={{ fontSize: 12, color: COLORS.textDim }}>Матчей</p>
          </div>
          <div>
            <p style={{ fontSize: 22, fontWeight: 700, color: COLORS.accent }}>{winRate}%</p>
            <p style={{ fontSize: 12, color: COLORS.textDim }}>Побед</p>
          </div>
          <div>
            <p style={{ fontSize: 22, fontWeight: 700, color: COLORS.text }}>{user.wins}W / {user.losses}L</p>
            <p style={{ fontSize: 12, color: COLORS.textDim }}>Баланс</p>
          </div>
        </div>
      </Card>

      {/* Stats link */}
      <Card onClick={() => onNavigate('stats')} style={{ marginBottom: 12, cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>{'\u{1F4CA}'}</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.text }}>Статистика и достижения</span>
          </div>
          <span style={{ color: COLORS.textDim }}>{'\u2192'}</span>
        </div>
      </Card>

      {/* FAQ link */}
      <Card onClick={() => onNavigate('faq')} style={{ marginBottom: 12, cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>{'\u2753'}</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.text }}>FAQ — Частые вопросы</span>
          </div>
          <span style={{ color: COLORS.textDim }}>{'\u2192'}</span>
        </div>
      </Card>

      {/* Coach panel link */}
      {user.isCoach && (
        <Card onClick={() => onNavigate('coachPanel')} style={{ marginBottom: 12, cursor: 'pointer', border: `1px solid ${COLORS.purple}40` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>{'\u{1F3BE}'}</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.purple }}>Панель тренера</span>
            </div>
            <span style={{ color: COLORS.textDim }}>{'\u2192'}</span>
          </div>
        </Card>
      )}

      {/* Admin link */}
      {user.isAdmin && (
        <Card onClick={() => onNavigate('admin')} style={{ marginBottom: 12, cursor: 'pointer', border: `1px solid ${COLORS.accent}40` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>{'\u2699\uFE0F'}</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.accent }}>Админ-панель</span>
            </div>
            <span style={{ color: COLORS.textDim }}>{'\u2192'}</span>
          </div>
        </Card>
      )}

      {/* Settings */}
      <Card style={{ marginBottom: 12 }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: COLORS.textDim, marginBottom: 12 }}>Настройки</h4>

        <Select
          label={'\u{1F514} Напоминание о матче'}
          value={String(user.reminderMinutes)}
          onChange={(v) => handleUpdate('reminderMinutes', parseInt(v))}
          options={[
            { value: '120', label: 'За 2 часа' },
            { value: '60', label: 'За 1 час' },
            { value: '30', label: 'За 30 минут' },
            { value: '0', label: 'Выключены' },
          ]}
        />

        <Select
          label={'\u{1F4CD} Город'}
          value={user.city}
          onChange={(v) => handleUpdate('city', v)}
          options={CITIES}
        />

        <Select
          label={'\u{1F550} Предпочтительное время'}
          value={user.preferredTime || 'ANY'}
          onChange={(v) => handleUpdate('preferredTime', v)}
          options={[
            { value: 'MORNING', label: 'Утро' },
            { value: 'AFTERNOON', label: 'День' },
            { value: 'EVENING', label: 'Вечер' },
            { value: 'ANY', label: 'Любое' },
          ]}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, marginBottom: 12 }}>
          <span style={{ fontSize: 14, color: COLORS.text }}>{'\u{1F465}'} Видимость в поиске</span>
          <button
            onClick={() => handleUpdate('isVisible', !user.isVisible)}
            style={{
              width: 48,
              height: 28,
              borderRadius: 14,
              border: 'none',
              background: user.isVisible ? COLORS.accent : COLORS.border,
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.2s',
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                background: '#fff',
                position: 'absolute',
                top: 3,
                left: user.isVisible ? 23 : 3,
                transition: 'left 0.2s',
              }}
            />
          </button>
        </div>

        {!user.ratingEditUsed && (
          <Button variant="secondary" fullWidth onClick={() => setShowRatingEdit(true)} size="sm">
            {'\u270F\uFE0F'} Редактировать рейтинг (1 раз)
          </Button>
        )}
      </Card>

      <Button variant="danger" fullWidth onClick={onLogout}>
        Выйти из аккаунта
      </Button>

      {/* Rating edit modal (one-time, ±500) */}
      <Modal isOpen={showRatingEdit} onClose={() => setShowRatingEdit(false)} title="Редактировать рейтинг">
        <p style={{ fontSize: 13, color: COLORS.textDim, marginBottom: 12 }}>
          Можно изменить рейтинг один раз, не более чем на 500 Elo.
          Текущий рейтинг: <b style={{ color: COLORS.text }}>{user.rating}</b> (допустимо: {Math.max(0, user.rating - 500)} — {Math.min(5000, user.rating + 500)})
        </p>
        <Input
          label="Новый рейтинг"
          value={newRating}
          onChange={setNewRating}
          type="number"
          placeholder={`${Math.max(0, user.rating - 500)} — ${Math.min(5000, user.rating + 500)}`}
          min={Math.max(0, user.rating - 500)}
          max={Math.min(5000, user.rating + 500)}
        />
        {newRating && Math.abs(parseInt(newRating) - user.rating) > 500 && (
          <p style={{ color: COLORS.danger, fontSize: 13, marginTop: -8, marginBottom: 8 }}>
            Изменение не может превышать 500 Elo
          </p>
        )}
        <Select
          label="Причина"
          value={ratingReason}
          onChange={setRatingReason}
          placeholder="Выберите причину"
          options={[
            { value: 'Обновление по Raceto', label: 'Обновление по Raceto' },
            { value: 'Обновление по Playtomic', label: 'Обновление по Playtomic' },
            { value: 'Коррекция после турнира', label: 'Коррекция после турнира' },
            { value: 'Другое', label: 'Другое' },
          ]}
        />
        <Button
          fullWidth
          onClick={handleRatingEdit}
          disabled={!newRating || Math.abs(parseInt(newRating) - user.rating) > 500 || parseInt(newRating) < 0 || parseInt(newRating) > 5000}
          style={{ marginTop: 8 }}
        >
          Сохранить
        </Button>
      </Modal>
    </div>
  );
}
