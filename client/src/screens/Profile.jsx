import React, { useState, useEffect } from 'react';
import { CircleDot, Megaphone, MessageCircle, BarChart3, HelpCircle, Settings, ChevronRight, Bell, Globe, MapPin, Clock, Users, PenLine, Star } from 'lucide-react';
import { COLORS, APP_NAME, TG_CHANNEL, TG_CHAT, getLevel, getXpLevel } from '../config';
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
  const [countries, setCountries] = useState([]);
  const [selectedCountryId, setSelectedCountryId] = useState('');
  const [showRatingEdit, setShowRatingEdit] = useState(false);

  useEffect(() => {
    api.regions.list().then((data) => {
      const list = data.countries || [];
      setCountries(list);
      // Set initial country from user's region
      if (user?.regionId && list.length) {
        const found = list.find(c => c.regions.some(r => r.id === user.regionId));
        if (found) setSelectedCountryId(String(found.id));
      }
    });
  }, []);
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
            <Badge style={{ background: `${COLORS.gold}25`, color: COLORS.gold, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Star size={12} fill={COLORS.gold} /> VIP
            </Badge>
          )}
          <Badge variant="accent">{user.rating} — {level.category} {level.name}</Badge>
          <Badge>{xp.current.icon} {xp.current.name}</Badge>
        </div>
        <p style={{ fontSize: 13, color: COLORS.textDim, marginTop: 6 }}>
          {user.region?.country?.flag ? `${user.region.country.flag} ` : ''}{user.region?.name || '\u2014'}
        </p>
      </div>

      {/* Community banner */}
      <Card style={{ marginBottom: 12, background: `linear-gradient(135deg, ${COLORS.accent}10, ${COLORS.purple}10)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <CircleDot size={20} color={COLORS.accent} />
          <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{APP_NAME} Community</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="sm" variant="outline" onClick={() => openTelegramLink(TG_CHANNEL)} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Megaphone size={14} /> Канал
          </Button>
          <Button size="sm" variant="outline" onClick={() => openTelegramLink(TG_CHAT)} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <MessageCircle size={14} /> Чат
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
            <BarChart3 size={20} color={COLORS.accent} />
            <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.text }}>Статистика и достижения</span>
          </div>
          <ChevronRight size={16} color={COLORS.textDim} />
        </div>
      </Card>

      {/* HIDDEN: PRO subscription — will enable later */}

      {/* FAQ link */}
      <Card onClick={() => onNavigate('faq')} style={{ marginBottom: 12, cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <HelpCircle size={20} color={COLORS.textDim} />
            <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.text }}>FAQ — Частые вопросы</span>
          </div>
          <ChevronRight size={16} color={COLORS.textDim} />
        </div>
      </Card>

      {/* HIDDEN: Coach panel link — will enable later */}

      {/* Admin link */}
      {user.isAdmin && (
        <Card onClick={() => onNavigate('admin')} style={{ marginBottom: 12, cursor: 'pointer', border: `1px solid ${COLORS.accent}40` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Settings size={20} color={COLORS.accent} />
              <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.accent }}>Админ-панель</span>
            </div>
            <ChevronRight size={16} color={COLORS.textDim} />
          </div>
        </Card>
      )}

      {/* Settings */}
      <Card style={{ marginBottom: 12 }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: COLORS.textDim, marginBottom: 12 }}>Настройки</h4>

        <Select
          label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Bell size={14} /> Напоминание о матче</span>}
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
          label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Globe size={14} /> Страна</span>}
          value={selectedCountryId}
          onChange={(v) => {
            setSelectedCountryId(v);
            // Auto-select region if country has only 1
            const country = countries.find(c => String(c.id) === v);
            if (country && country.regions.length === 1) {
              handleUpdate('regionId', country.regions[0].id);
            }
          }}
          options={countries.map(c => ({
            value: String(c.id),
            label: `${c.flag} ${c.name}`,
          }))}
        />

        {selectedCountryId && (() => {
          const country = countries.find(c => String(c.id) === selectedCountryId);
          if (!country || country.regions.length <= 1) return null;
          return (
            <Select
              label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><MapPin size={14} /> Город</span>}
              value={String(user.regionId || '')}
              onChange={(v) => handleUpdate('regionId', parseInt(v))}
              options={country.regions.map(r => ({
                value: String(r.id),
                label: r.name,
              }))}
            />
          );
        })()}

        <Select
          label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Clock size={14} /> Предпочтительное время</span>}
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
          <span style={{ fontSize: 14, color: COLORS.text, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Users size={14} /> Видимость в поиске
          </span>
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
          <Button variant="secondary" fullWidth onClick={() => setShowRatingEdit(true)} size="sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <PenLine size={14} /> Редактировать рейтинг (1 раз)
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
