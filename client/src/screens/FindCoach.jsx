import React, { useEffect, useState } from 'react';
import { COLORS, CITIES } from '../config';
import { Card } from '../components/ui/Card';
import { Header } from '../components/ui/Header';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { api } from '../services/api';

export function FindCoach({ onBack, onNavigate }) {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState('');

  useEffect(() => {
    loadCoaches();
  }, [cityFilter]);

  async function loadCoaches() {
    setLoading(true);
    try {
      const data = await api.coaches.list(cityFilter || undefined);
      setCoaches(data);
    } catch (err) {
      console.error('Load coaches error:', err);
    }
    setLoading(false);
  }

  function formatBYN(kopeks) {
    if (!kopeks) return '0';
    return (kopeks / 100).toFixed(kopeks % 100 === 0 ? 0 : 2);
  }

  return (
    <div>
      <Header title="Найти тренера" onBack={onBack} />

      {/* City filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto' }}>
        <button
          onClick={() => setCityFilter('')}
          style={{
            padding: '6px 12px',
            borderRadius: 8,
            border: 'none',
            background: !cityFilter ? COLORS.accent : COLORS.surface,
            color: !cityFilter ? COLORS.bg : COLORS.textDim,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Все
        </button>
        {CITIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCityFilter(c.value)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: 'none',
              background: cityFilter === c.value ? COLORS.accent : COLORS.surface,
              color: cityFilter === c.value ? COLORS.bg : COLORS.textDim,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: COLORS.textDim, textAlign: 'center', padding: 40 }}>Загрузка...</p>
      ) : coaches.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 40 }}>
          <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>{'\u{1F50D}'}</span>
          <p style={{ fontSize: 16, fontWeight: 600, color: COLORS.text, marginBottom: 6 }}>
            Тренеры не найдены
          </p>
          <p style={{ fontSize: 13, color: COLORS.textDim }}>
            {cityFilter ? 'Попробуйте другой город' : 'Скоро здесь появятся тренеры'}
          </p>
        </Card>
      ) : (
        coaches.map((coach) => (
          <Card
            key={coach.id}
            onClick={() => onNavigate('coachProfile', { coachId: coach.id })}
            style={{ marginBottom: 10, cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <Avatar src={coach.photoUrl} name={coach.firstName} size={52} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>
                    {coach.firstName} {coach.lastName || ''}
                  </span>
                  {coach.rating && (
                    <Badge style={{ background: `${COLORS.gold || '#FFD700'}20`, color: COLORS.gold || '#FFD700', fontSize: 11 }}>
                      {'\u2B50'} {coach.rating.toFixed(1)}
                    </Badge>
                  )}
                </div>

                {coach.specialization && (
                  <p style={{ fontSize: 12, color: COLORS.purple, fontWeight: 600, margin: '0 0 4px' }}>
                    {coach.specialization}
                  </p>
                )}

                {coach.bio && (
                  <p style={{ fontSize: 12, color: COLORS.textDim, margin: '0 0 6px', lineHeight: 1.4 }}>
                    {coach.bio.length > 100 ? coach.bio.substring(0, 100) + '...' : coach.bio}
                  </p>
                )}

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {coach.hourlyRate > 0 && (
                    <Badge>{formatBYN(coach.hourlyRate)} BYN/час</Badge>
                  )}
                  {coach.studentCount > 0 && (
                    <Badge>{'\u{1F393}'} {coach.studentCount}</Badge>
                  )}
                  {coach.experience && (
                    <Badge variant="accent">{coach.experience}</Badge>
                  )}
                  {coach.reviewCount > 0 && (
                    <Badge>{coach.reviewCount} отзывов</Badge>
                  )}
                </div>
              </div>
              <span style={{ color: COLORS.textDim, fontSize: 16, marginTop: 8 }}>{'\u2192'}</span>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
