import React, { useState, useEffect, useMemo } from 'react';
import { COLORS } from '../config';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Header } from '../components/ui/Header';
import { api } from '../services/api';

// Extended venue info (static for now — will move to DB later)
const VENUE_EXTRA = {
  '360 Padel Arena': {
    description: '7 ультрапанорамных кортов международного уровня. Покрытие Mondo SuperCourt XN (как на турнирах WPT), профессиональное LED-освещение. СК «Триумф», Новая Боровая.',
    phone: '+375 29 378-04-00',
    telegram: 'https://t.me/padel360arena',
    instagram: 'https://www.instagram.com/padel360.minsk?igsh=MXV1aTI0N2c3andldQ%3D%3D',
    website: 'https://360padel.by',
    schedule: 'Ежедневно: 07:00 — 24:00',
    mapUrl: 'https://yandex.by/maps/?ll=27.709286%2C53.963323&mode=routes&rtext=~53.961714%2C27.700841&rtt=auto&ruri=~ymapsbm1%3A%2F%2Forg%3Foid%3D190799862155&z=16',
    courts: [
      { name: 'Стандартные корты', count: 7, type: '2 на 2', icon: '\uD83C\uDFBE' },
    ],
    features: ['Раздевалки', 'Душевые', 'Прокат ракеток', 'Кафе', 'Парковка', 'Wi-Fi'],
    priceDetails: [
      { label: 'Пн-Пт (07:00-17:00)', price: '120 BYN/час' },
      { label: 'Пн-Пт (17:00-24:00)', price: '140 BYN/час' },
      { label: 'Сб-Вс и праздники', price: '140 BYN/час' },
    ],
  },
  'Meta Padel': {
    description: 'Падел-клуб в Гродно. 3 корта: 2 стандартных для игры 2 на 2 и 1 корт для игры 1 на 1.',
    phone: null,
    instagram: null,
    schedule: null,
    mapUrl: null,
    courts: [
      { name: 'Стандартные корты', count: 2, type: '2 на 2', icon: '\uD83C\uDFBE' },
      { name: 'Сингл-корт', count: 1, type: '1 на 1', icon: '\uD83E\uDD4E' },
    ],
    features: [],
    priceDetails: [],
  },
  'PADEL BAZA': {
    description: 'Падел-клуб в Бресте. 2 корта для игры 1 на 1 и 2 на 2.',
    phone: null,
    instagram: null,
    schedule: null,
    mapUrl: null,
    courts: [
      { name: 'Стандартный корт', count: 1, type: '2 на 2', icon: '\uD83C\uDFBE' },
      { name: 'Сингл-корт', count: 1, type: '1 на 1', icon: '\uD83E\uDD4E' },
    ],
    features: [],
    priceDetails: [],
  },
};

const DAYS_RU = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const MONTHS_RU = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

const DURATIONS = [
  { value: 60, label: '1 час' },
  { value: 90, label: '1.5 часа' },
  { value: 120, label: '2 часа' },
];

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function InfoRow({ icon, label, value, onClick }) {
  const content = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
      <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 12, color: COLORS.textDim }}>{label}</p>
        <p style={{ fontSize: 14, fontWeight: 500, color: onClick ? COLORS.accent : COLORS.text }}>{value}</p>
      </div>
      {onClick && <span style={{ color: COLORS.textDim, fontSize: 16 }}>{'\u2197'}</span>}
    </div>
  );
  if (onClick) {
    return <button onClick={onClick} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', WebkitTapHighlightColor: 'transparent' }}>{content}</button>;
  }
  return content;
}

export function BookCourt({ venueId, onBack }) {
  const tg = window.Telegram?.WebApp;

  const [venue, setVenue] = useState(null);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fallbackUrl, setFallbackUrl] = useState(null);
  const [duration, setDuration] = useState(60);
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeSlots, setTimeSlots] = useState({});
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedStaffId, setSelectedStaffId] = useState(null);

  const extra = venue ? (VENUE_EXTRA[venue.name] || {}) : {};

  const dates = useMemo(() => {
    const result = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      result.push(d);
    }
    return result;
  }, []);

  useEffect(() => { loadInitialData(); }, [venueId]);

  async function loadInitialData() {
    try {
      setLoading(true);
      const venueData = await api.venues.getById(venueId);
      setVenue(venueData);

      if (!venueData.yclientsCompanyId) {
        setLoading(false);
        return;
      }

      const [servicesData, staffData] = await Promise.all([
        api.venues.bookingServices(venueId).catch(() => []),
        api.venues.bookingStaff(venueId).catch(() => []),
      ]);
      const svcList = Array.isArray(servicesData) ? servicesData : (servicesData?.services || []);
      setServices(svcList.filter(s => /корт/i.test(s.title || '')));
      setStaff(Array.isArray(staffData) ? staffData : []);
      setFallbackUrl(buildFallback(venueData));
    } catch (err) {
      console.error('BookCourt init error:', err);
    } finally {
      setLoading(false);
    }
  }

  function buildFallback(v) {
    const ven = v || venue;
    if (!ven?.yclientsFormId || !ven?.yclientsCompanyId) return null;
    return `https://${ven.yclientsFormId}.yclients.com/company/${ven.yclientsCompanyId}/personal/select-time?o=`;
  }

  const filteredServiceIds = useMemo(() => {
    return services
      .filter(s => {
        // Parse from comment: "Аренда корта на 60 минут"
        const comment = s.comment || '';
        const m = comment.match(/(\d+)\s*минут/);
        if (m && parseInt(m[1]) === duration) return true;
        // Fallback: parse from title ("Корт 1 час", "Корт 1.5 часа", "Корт 2 часа")
        const title = (s.title || '').toLowerCase();
        if (duration === 120 && /\b2\s*час/.test(title)) return true;
        if (duration === 90 && /1[.,]5\s*час/.test(title)) return true;
        if (duration === 60 && /\b1\s*час/.test(title) && !/1[.,]5/.test(title)) return true;
        // Fallback: seance_length
        if (s.seance_length === duration * 60) return true;
        return false;
      })
      .map(s => String(s.id));
  }, [services, duration]);

  useEffect(() => {
    if (!selectedDate || staff.length === 0) return;
    loadTimes();
  }, [selectedDate, duration, staff]);

  async function loadTimes() {
    setLoadingTimes(true);
    setSelectedTime(null);
    setSelectedStaffId(null);
    const day = formatDate(selectedDate);
    const bookableStaff = staff.filter(s => s.bookable !== false && /корт/i.test(s.name || ''));
    try {
      const results = {};
      await Promise.all(
        bookableStaff.map(async (s) => {
          try {
            const times = await api.venues.bookingTimes(venueId, s.id, day);
            results[s.id] = Array.isArray(times) ? times : [];
          } catch { results[s.id] = []; }
        })
      );
      setTimeSlots(results);
    } catch (err) { console.error('Load times error:', err); }
    finally { setLoadingTimes(false); }
  }

  const mergedSlots = useMemo(() => {
    const timeMap = {};
    for (const [staffId, slots] of Object.entries(timeSlots)) {
      for (const slot of slots) {
        const time = slot.time;
        if (!time) continue;
        if (!timeMap[time]) timeMap[time] = [];
        timeMap[time].push({ staffId, ...slot });
      }
    }
    return Object.entries(timeMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([time, courts]) => ({ time, courts }));
  }, [timeSlots]);

  const availableCourts = useMemo(() => {
    if (!selectedTime) return [];
    const slot = mergedSlots.find(s => s.time === selectedTime);
    if (!slot) return [];
    return slot.courts.map(c => {
      const s = staff.find(st => String(st.id) === String(c.staffId));
      return { ...c, name: s?.name || `Корт ${c.staffId}` };
    });
  }, [selectedTime, mergedSlots, staff]);

  function openExternal(url) {
    if (!url) return;
    if (tg?.openLink) tg.openLink(url);
    else window.open(url, '_blank');
  }

  function openBooking() {
    if (!selectedTime || !selectedStaffId) {
      openExternal(buildFallback(venue));
      return;
    }

    // Determine tariff by time and day of week
    const hour = parseInt(selectedTime.split(':')[0]);
    const dayOfWeek = selectedDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const tariffType = isWeekend ? 'выходной' : (hour < 17 ? 'дневной' : 'вечерний');

    // Find matching service for duration + tariff
    const service = services.find(s => {
      const comment = (s.comment || '').toLowerCase();
      return comment.includes(`${duration} минут`) && comment.includes(tariffType);
    }) || services.find(s => {
      const comment = (s.comment || '').toLowerCase();
      return comment.includes(`${duration} минут`);
    });

    if (!service) {
      openExternal(buildFallback(venue));
      return;
    }

    // Build direct booking URL: /create-record/record?o=m{staffId}s{serviceId}d{YYMMDDHHMI}0
    const yy = String(selectedDate.getFullYear()).slice(2);
    const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dd = String(selectedDate.getDate()).padStart(2, '0');
    const [hh, mi] = selectedTime.split(':');
    const dateCode = `${yy}${mm}${dd}${hh}${mi}0`;

    const url = `https://${venue.yclientsFormId}.yclients.com/company/${venue.yclientsCompanyId}/create-record/record?o=m${selectedStaffId}s${service.id}d${dateCode}&utm_source=padelgo`;
    openExternal(url);
  }

  // --- RENDER ---

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <Header title="Площадка" onBack={onBack} />
        <p style={{ color: COLORS.textDim, marginTop: 60 }}>Загрузка...</p>
      </div>
    );
  }

  if (!venue) {
    return (
      <div style={{ padding: 20 }}>
        <Header title="Площадка" onBack={onBack} />
        <p style={{ color: COLORS.textDim, marginTop: 40, textAlign: 'center' }}>Площадка не найдена</p>
      </div>
    );
  }

  const courtStaff = staff.filter(s => s.bookable !== false && /корт/i.test(s.name || ''));
  const hasApiSlots = courtStaff.length > 0;

  return (
    <div style={{ padding: 20, paddingBottom: 40 }}>
      <Header title="Площадка" onBack={onBack} />

      {/* Hero card */}
      <Card style={{
        marginTop: 12,
        background: `linear-gradient(135deg, ${COLORS.accent}12, ${COLORS.purple}08)`,
        border: `1px solid ${COLORS.accent}25`,
      }}>
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <p style={{ fontSize: 22, fontWeight: 800, color: COLORS.text }}>{venue.name}</p>
          <p style={{ fontSize: 13, color: COLORS.textDim, marginTop: 4 }}>{venue.address}</p>

          {/* Stats row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 24, fontWeight: 800, color: COLORS.accent }}>{venue.courts}</p>
              <p style={{ fontSize: 11, color: COLORS.textDim }}>кортов</p>
            </div>
            <div style={{ width: 1, background: COLORS.border }} />
            {venue.yclientsPriceLabel && (
              <>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 24, fontWeight: 800, color: COLORS.accent }}>{venue.yclientsPriceLabel.replace('от ', '')}</p>
                  <p style={{ fontSize: 11, color: COLORS.textDim }}>от / час</p>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Booking section */}
      {hasApiSlots && (
        <>
          <p style={{ fontSize: 15, fontWeight: 700, marginTop: 20, marginBottom: 10, color: COLORS.text }}>Свободное время</p>

          {/* Duration */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {DURATIONS.map(d => (
              <button key={d.value} onClick={() => setDuration(d.value)} style={{
                flex: 1, padding: '10px 0', borderRadius: 12,
                border: `1px solid ${duration === d.value ? COLORS.accent : COLORS.border}`,
                background: duration === d.value ? COLORS.accentGlow : COLORS.surface,
                color: duration === d.value ? COLORS.accent : COLORS.textDim,
                fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                WebkitTapHighlightColor: 'transparent',
              }}>{d.label}</button>
            ))}
          </div>

          {/* Dates */}
          <div style={{
            display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4,
            scrollbarWidth: 'none', msOverflowStyle: 'none',
          }} className="hide-scrollbar">
            {dates.map(d => {
              const active = selectedDate && formatDate(selectedDate) === formatDate(d);
              const isToday = formatDate(d) === formatDate(new Date());
              return (
                <button key={formatDate(d)} onClick={() => setSelectedDate(d)} style={{
                  minWidth: 60, padding: '8px 4px', borderRadius: 12,
                  border: `1px solid ${active ? COLORS.accent : COLORS.border}`,
                  background: active ? COLORS.accentGlow : COLORS.surface,
                  color: active ? COLORS.accent : COLORS.text,
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', flexShrink: 0,
                  WebkitTapHighlightColor: 'transparent',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: active ? COLORS.accent : COLORS.textDim }}>
                    {isToday ? 'Сегодня' : DAYS_RU[d.getDay()]}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, margin: '2px 0' }}>{d.getDate()}</div>
                  <div style={{ fontSize: 11, color: active ? COLORS.accent : COLORS.textDim }}>{MONTHS_RU[d.getMonth()]}</div>
                </button>
              );
            })}
          </div>

          {/* Time slots */}
          {selectedDate && (
            <>
              <p style={{ fontSize: 14, fontWeight: 600, marginTop: 16, marginBottom: 8, color: COLORS.textDim }}>
                Время {loadingTimes && '...'}
              </p>
              {loadingTimes ? (
                <p style={{ color: COLORS.textDim, fontSize: 13, textAlign: 'center', padding: 20 }}>Загрузка слотов...</p>
              ) : mergedSlots.length === 0 ? (
                <p style={{ color: COLORS.textDim, fontSize: 13, textAlign: 'center', padding: 20 }}>Нет свободных слотов</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {mergedSlots.map(slot => {
                    const active = selectedTime === slot.time;
                    return (
                      <button key={slot.time} onClick={() => { setSelectedTime(slot.time); setSelectedStaffId(null); }} style={{
                        padding: '10px 0', borderRadius: 10,
                        border: `1px solid ${active ? COLORS.accent : COLORS.border}`,
                        background: active ? COLORS.accentGlow : COLORS.surface,
                        color: active ? COLORS.accent : COLORS.text,
                        fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                        WebkitTapHighlightColor: 'transparent',
                      }}>{slot.time}</button>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Court selector */}
          {selectedTime && availableCourts.length > 0 && (
            <>
              <p style={{ fontSize: 14, fontWeight: 600, marginTop: 16, marginBottom: 8, color: COLORS.textDim }}>Выберите корт</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {availableCourts.map(court => {
                  const active = selectedStaffId === String(court.staffId);
                  return (
                    <button key={court.staffId} onClick={() => setSelectedStaffId(String(court.staffId))} style={{
                      padding: '14px 8px', borderRadius: 12,
                      border: `1px solid ${active ? COLORS.accent : COLORS.border}`,
                      background: active ? COLORS.accentGlow : COLORS.surface,
                      color: active ? COLORS.accent : COLORS.text,
                      fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      textAlign: 'center', WebkitTapHighlightColor: 'transparent',
                    }}>{court.name}</button>
                  );
                })}
              </div>
            </>
          )}

          {/* Book button — appears after selecting court */}
          {selectedTime && selectedStaffId && (
            <Button fullWidth onClick={openBooking} style={{ marginTop: 16 }}>
              {'\uD83C\uDFBE'} Забронировать корт
            </Button>
          )}
        </>
      )}

      {/* Courts info */}
      {extra.courts && extra.courts.length > 0 && (
        <>
          <p style={{ fontSize: 15, fontWeight: 700, marginTop: 20, marginBottom: 10, color: COLORS.text }}>Корты</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {extra.courts.map((c, i) => (
              <Card key={i} style={{ flex: 1, textAlign: 'center', padding: 12 }}>
                <span style={{ fontSize: 28 }}>{c.icon}</span>
                <p style={{ fontSize: 14, fontWeight: 700, marginTop: 6, color: COLORS.text }}>{c.count}x</p>
                <p style={{ fontSize: 12, color: COLORS.textDim }}>{c.name}</p>
                <Badge style={{ marginTop: 6 }}>{c.type}</Badge>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Price details */}
      {extra.priceDetails && extra.priceDetails.length > 0 && (
        <>
          <p style={{ fontSize: 15, fontWeight: 700, marginTop: 20, marginBottom: 10, color: COLORS.text }}>Цены</p>
          <Card>
            {extra.priceDetails.map((p, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 0',
                borderBottom: i < extra.priceDetails.length - 1 ? `1px solid ${COLORS.border}` : 'none',
              }}>
                <span style={{ fontSize: 13, color: COLORS.textDim }}>{p.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.accent }}>{p.price}</span>
              </div>
            ))}
          </Card>
        </>
      )}

      {/* Description */}
      {extra.description && (
        <>
          <p style={{ fontSize: 15, fontWeight: 700, marginTop: 20, marginBottom: 10, color: COLORS.text }}>О площадке</p>
          <Card>
            <p style={{ fontSize: 13, lineHeight: 1.5, color: COLORS.textDim }}>{extra.description}</p>
          </Card>
        </>
      )}

      {/* Info rows */}
      <p style={{ fontSize: 15, fontWeight: 700, marginTop: 20, marginBottom: 6, color: COLORS.text }}>Информация</p>
      <Card>
        {extra.schedule && (
          <InfoRow icon={'\uD83D\uDD52'} label="Режим работы" value={extra.schedule} />
        )}
        {extra.phone && (
          <InfoRow
            icon={'\uD83D\uDCDE'}
            label="Телефон"
            value={extra.phone}
            onClick={() => openExternal(`tel:${extra.phone.replace(/[^+\d]/g, '')}`)}
          />
        )}
        {extra.mapUrl && (
          <InfoRow
            icon={'\uD83D\uDCCD'}
            label="На карте"
            value="Открыть в Яндекс.Картах"
            onClick={() => openExternal(extra.mapUrl)}
          />
        )}
        {extra.website && (
          <InfoRow
            icon={'\uD83C\uDF10'}
            label="Сайт"
            value={extra.website.replace('https://', '')}
            onClick={() => openExternal(extra.website)}
          />
        )}
        {extra.telegram && (
          <InfoRow
            icon={'\u2708\uFE0F'}
            label="Telegram"
            value={'@' + extra.telegram.split('/').pop()}
            onClick={() => openExternal(extra.telegram)}
          />
        )}
        {extra.instagram && (
          <InfoRow
            icon={'\uD83D\uDCF8'}
            label="Instagram"
            value={'@' + (extra.instagram.split('/').pop()?.split('?')[0] || '')}
            onClick={() => openExternal(extra.instagram)}
          />
        )}
        {!extra.schedule && !extra.phone && !extra.mapUrl && (
          <p style={{ fontSize: 13, color: COLORS.textDim, padding: '10px 0' }}>Подробная информация скоро появится</p>
        )}
      </Card>

      {/* Amenities */}
      {extra.features && extra.features.length > 0 && (
        <>
          <p style={{ fontSize: 15, fontWeight: 700, marginTop: 20, marginBottom: 10, color: COLORS.text }}>Удобства</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {extra.features.map((f, i) => (
              <Badge key={i} variant="accent">{'\u2713'} {f}</Badge>
            ))}
          </div>
        </>
      )}

      {/* Fallback link for venues without API slots */}
      {!hasApiSlots && fallbackUrl && (
        <Button fullWidth onClick={() => openExternal(fallbackUrl)} style={{ marginTop: 20 }}>
          {'\uD83C\uDFBE'} Забронировать корт
        </Button>
      )}
    </div>
  );
}
