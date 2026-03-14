import React, { useEffect, useState } from 'react';
import { Star, CircleDot, Search, MapPin, Award } from 'lucide-react';
import { COLORS } from '../config';
import { Card } from '../components/ui/Card';
import { Header } from '../components/ui/Header';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { api } from '../services/api';

function StarRating({ rating, size = 14 }) {
  if (!rating) return null;
  return (
    <span style={{ display: 'inline-flex', gap: 1 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          color={i < Math.round(rating) ? COLORS.gold : COLORS.textMuted}
          fill={i < Math.round(rating) ? COLORS.gold : 'none'}
        />
      ))}
    </span>
  );
}

export function FindCoach({ user, onBack, onNavigate }) {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState([]);
  const [countryFilter, setCountryFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');

  useEffect(() => {
    api.regions.list().then((data) => {
      const list = data.countries || [];
      setCountries(list);
      // Initialize filters from user's regionId
      if (user?.regionId && list.length) {
        const found = list.find(c => c.regions.some(r => r.id === user.regionId));
        if (found) {
          setCountryFilter(String(found.id));
          if (found.regions.length > 1) {
            setRegionFilter(String(user.regionId));
          }
        }
      }
    });
  }, []);

  // Get regions for selected country
  const selectedCountryObj = countries.find((c) => String(c.id) === countryFilter);
  const countryRegions = selectedCountryObj?.regions || [];
  const showRegionFilter = countryFilter && countryRegions.length > 1;

  // Determine effective regionId for API call
  const effectiveRegionId = regionFilter || (countryFilter && countryRegions.length === 1 ? String(countryRegions[0].id) : '');

  useEffect(() => {
    loadCoaches();
  }, [effectiveRegionId]);

  async function loadCoaches() {
    setLoading(true);
    try {
      const data = await api.coaches.list(effectiveRegionId || undefined);
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

  function getRegionLabel(coach) {
    const flag = coach.region?.country?.flag;
    const name = coach.region?.name || '';
    return flag ? `${flag} ${name}` : name;
  }

  return (
    <div>
      <Header title="Найти тренера" subtitle="Профессиональные тренировки" onBack={onBack} />

      {/* Country & Region dropdowns */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <select
          value={countryFilter}
          onChange={(e) => { setCountryFilter(e.target.value); setRegionFilter(''); }}
          style={{
            flex: 1,
            padding: '8px 32px 8px 10px',
            borderRadius: 12,
            border: `1px solid ${COLORS.border}`,
            background: COLORS.surface,
            color: COLORS.text,
            fontSize: 13,
            fontFamily: 'inherit',
            fontWeight: 600,
            outline: 'none',
            appearance: 'none',
            WebkitAppearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%237A8299' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 10px center',
          }}
        >
          <option value="">Все страны</option>
          {countries.map(c => (
            <option key={c.id} value={String(c.id)}>{c.flag} {c.name}</option>
          ))}
        </select>
        {showRegionFilter && (
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 32px 8px 10px',
              borderRadius: 12,
              border: `1px solid ${COLORS.border}`,
              background: COLORS.surface,
              color: COLORS.text,
              fontSize: 13,
              fontFamily: 'inherit',
              fontWeight: 600,
              outline: 'none',
              appearance: 'none',
              WebkitAppearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%237A8299' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 10px center',
            }}
          >
            <option value="">Все города</option>
            {countryRegions.map(r => (
              <option key={r.id} value={String(r.id)}>{r.name}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <CircleDot size={32} color={COLORS.accent} style={{ display: 'block', margin: '0 auto 12px', animation: 'pulse 1.5s infinite' }} />
          <p style={{ color: COLORS.textDim, fontSize: 14 }}>Загрузка тренеров...</p>
        </div>
      ) : coaches.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <Search size={48} color={COLORS.textDim} style={{ display: 'block', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 16, fontWeight: 600, color: COLORS.text, marginBottom: 6 }}>
            Тренеры не найдены
          </p>
          <p style={{ fontSize: 13, color: COLORS.textDim }}>
            {regionFilter ? 'Попробуйте другой город' : 'Скоро здесь появятся тренеры'}
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
                  marginBottom: coach.experience || coach.certificates || coach.region?.name ? 12 : 0,
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

                {/* Tags: certificates, region */}
                {(coach.certificates || coach.region?.name) && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {coach.certificates && (
                      <Badge variant="purple" style={{ fontSize: 11 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Award size={11} /> {coach.certificates.length > 30 ? coach.certificates.substring(0, 30) + '...' : coach.certificates}</span>
                      </Badge>
                    )}
                    {coach.region?.name && (
                      <Badge style={{ fontSize: 11 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><MapPin size={11} /> {coach.region?.country?.flag ? `${coach.region.country.flag} ` : ''}{coach.region.name}</span>
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
