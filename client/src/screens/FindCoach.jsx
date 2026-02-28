import React, { useEffect, useState } from 'react';
import { COLORS, CITIES } from '../config';
import { Card } from '../components/ui/Card';
import { Header } from '../components/ui/Header';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { api } from '../services/api';

function StarRating({ rating, size = 14 }) {
  if (!rating) return null;
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      stars.push('\u2605'); // filled
    } else if (i - 0.5 <= rating) {
      stars.push('\u2605'); // half rounds up visually
    } else {
      stars.push('\u2606'); // empty
    }
  }
  return (
    <span style={{ fontSize: size, letterSpacing: 1 }}>
      {stars.map((s, i) => (
        <span key={i} style={{ color: i < Math.round(rating) ? COLORS.gold : COLORS.textMuted }}>
          {s}
        </span>
      ))}
    </span>
  );
}

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

  function getCityLabel(val) {
    const c = CITIES.find((c) => c.value === val);
    return c ? c.label : val;
  }

  return (
    <div>
      <Header title="Найти тренера" subtitle="Профессиональные тренировки" onBack={onBack} />

      {/* City filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 2 }}>
        <button
          onClick={() => setCityFilter('')}
          style={{
            padding: '6px 14px',
            borderRadius: 20,
            border: !cityFilter ? 'none' : `1px solid ${COLORS.border}`,
            background: !cityFilter ? COLORS.accent : 'transparent',
            color: !cityFilter ? COLORS.bg : COLORS.textDim,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Все города
        </button>
        {CITIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCityFilter(c.value)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: cityFilter === c.value ? 'none' : `1px solid ${COLORS.border}`,
              background: cityFilter === c.value ? COLORS.accent : 'transparent',
              color: cityFilter === c.value ? COLORS.bg : COLORS.textDim,
              fontSize: 13,
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
        <div style={{ textAlign: 'center', padding: 60 }}>
          <span style={{ fontSize: 32, display: 'block', marginBottom: 12, animation: 'pulse 1.5s infinite' }}>{'\u{1F3BE}'}</span>
          <p style={{ color: COLORS.textDim, fontSize: 14 }}>Загрузка тренеров...</p>
        </div>
      ) : coaches.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>{'\u{1F50D}'}</span>
          <p style={{ fontSize: 16, fontWeight: 600, color: COLORS.text, marginBottom: 6 }}>
            Тренеры не найдены
          </p>
          <p style={{ fontSize: 13, color: COLORS.textDim }}>
            {cityFilter ? 'Попробуйте другой город' : 'Скоро здесь появятся тренеры'}
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {coaches.map((coach) => (
            <div
              key={coach.id}
              onClick={() => onNavigate('coachProfile', { coachId: coach.id })}
              style={{
                background: COLORS.card,
                borderRadius: 20,
                border: `1px solid ${COLORS.border}`,
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.15s',
              }}
            >
              {/* Top accent strip */}
              <div style={{
                height: 3,
                background: `linear-gradient(90deg, ${COLORS.purple}, ${COLORS.accent})`,
              }} />

              <div style={{ padding: 16 }}>
                {/* Coach header: avatar + name + rating */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ position: 'relative' }}>
                    <Avatar src={coach.photoUrl} name={coach.firstName} size={56} />
                    {coach.rating && (
                      <div style={{
                        position: 'absolute',
                        bottom: -4,
                        right: -4,
                        background: COLORS.card,
                        border: `2px solid ${COLORS.gold}`,
                        borderRadius: 10,
                        padding: '1px 5px',
                        fontSize: 10,
                        fontWeight: 800,
                        color: COLORS.gold,
                        lineHeight: '14px',
                      }}>
                        {coach.rating.toFixed(1)}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, margin: 0 }}>
                      {coach.firstName} {coach.lastName || ''}
                    </p>
                    {coach.specialization && (
                      <p style={{ fontSize: 13, color: COLORS.purple, fontWeight: 600, margin: '3px 0 0' }}>
                        {coach.specialization}
                      </p>
                    )}
                    {coach.rating ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <StarRating rating={coach.rating} size={13} />
                        {coach.reviewCount > 0 && (
                          <span style={{ fontSize: 11, color: COLORS.textDim }}>
                            ({coach.reviewCount})
                          </span>
                        )}
                      </div>
                    ) : null}
                  </div>
                  {coach.hourlyRate > 0 && (
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 18, fontWeight: 800, color: COLORS.accent, margin: 0 }}>
                        {formatBYN(coach.hourlyRate)}
                      </p>
                      <p style={{ fontSize: 10, color: COLORS.textDim, margin: 0 }}>
                        BYN / час
                      </p>
                    </div>
                  )}
                </div>

                {/* Bio preview */}
                {coach.bio && (
                  <p style={{
                    fontSize: 13,
                    color: COLORS.textDim,
                    margin: '0 0 12px',
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {coach.bio}
                  </p>
                )}

                {/* Stats row */}
                <div style={{
                  display: 'flex',
                  gap: 0,
                  background: COLORS.surface,
                  borderRadius: 12,
                  padding: '10px 0',
                  marginBottom: coach.experience || coach.certificates || coach.city ? 12 : 0,
                }}>
                  {[
                    { value: coach.studentCount || 0, label: 'учеников', show: true },
                    { value: coach.reviewCount || 0, label: 'отзывов', show: true },
                    { value: coach.experience || '—', label: 'опыт', show: !!coach.experience },
                  ].filter(s => s.show).map((stat, i, arr) => (
                    <div key={i} style={{
                      flex: 1,
                      textAlign: 'center',
                      borderRight: i < arr.length - 1 ? `1px solid ${COLORS.border}` : 'none',
                    }}>
                      <p style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, margin: 0 }}>
                        {stat.value}
                      </p>
                      <p style={{ fontSize: 10, color: COLORS.textDim, margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Tags: certificates, city */}
                {(coach.certificates || coach.city) && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {coach.certificates && (
                      <Badge variant="purple" style={{ fontSize: 11 }}>
                        {'\u{1F4DC}'} {coach.certificates.length > 30 ? coach.certificates.substring(0, 30) + '...' : coach.certificates}
                      </Badge>
                    )}
                    {coach.city && (
                      <Badge style={{ fontSize: 11 }}>
                        {'\u{1F4CD}'} {getCityLabel(coach.city)}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
