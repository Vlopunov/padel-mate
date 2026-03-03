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
      { name: 'Стандартные корты', count: 7, type: '2 на 2', icon: '🎾' },
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
    phone: null, instagram: null, schedule: null, mapUrl: null,
    courts: [
      { name: 'Стандартные корты', count: 2, type: '2 на 2', icon: '🎾' },
      { name: 'Сингл-корт', count: 1, type: '1 на 1', icon: '🥎' },
    ],
    features: [], priceDetails: [],
  },
  'PADEL BAZA': {
    description: 'Падел-клуб в Бресте. 2 корта для игры 1 на 1 и 2 на 2.',
    phone: null, instagram: null, schedule: null, mapUrl: null,
    courts: [
      { name: 'Стандартный корт', count: 1, type: '2 на 2', icon: '🎾' },
      { name: 'Сингл-корт', count: 1, type: '1 на 1', icon: '🥎' },
    ],
    features: [], priceDetails: [],
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

  // ── Service mapping: { 60: { day: id, evening: id, weekend: id }, 90: {...}, 120: {...} }
  // Also tracks is_chain per service — is_chain=true services don't work with /create-record/record URL
  const serviceMap = useMemo(() => {
    const map = {};
    for (const s of services) {
      const comment = (s.comment || '').toLowerCase();
      const m = comment.match(/(\d+)\s*минут/);
      if (!m) continue;
      const dur = parseInt(m[1]);

      let tariff = 'day';
      if (comment.includes('вечерний')) tariff = 'evening';
      else if (comment.includes('выходной')) tariff = 'weekend';

      if (!map[dur]) map[dur] = {};
      map[dur][tariff] = s.id;
    }
    return map;
  }, [services]);

  // ── Court staff only (no trainers)
  const courtStaff = useMemo(
    () => staff.filter(s => s.bookable !== false && /^корт/i.test((s.name || '').trim())),
    [staff]
  );
  const hasApiSlots = courtStaff.length > 0;

  // ── Init
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

      // Parse services — only court rental ("Аренда корта на X минут")
      const svcList = Array.isArray(servicesData) ? servicesData : (servicesData?.services || []);
      setServices(svcList.filter(s => {
        const comment = (s.comment || '').toLowerCase();
        return comment.includes('аренда корта на');
      }));

      setStaff(Array.isArray(staffData) ? staffData : []);
    } catch (err) {
      console.error('BookCourt init error:', err);
    } finally {
      setLoading(false);
    }
  }

  function buildFallback() {
    if (!venue?.yclientsFormId || !venue?.yclientsCompanyId) return null;
    return `https://${venue.yclientsFormId}.yclients.com/company/${venue.yclientsCompanyId}/personal/select-time?o=`;
  }

  // ── Load times — per tariff to get correct slots for selected duration
  useEffect(() => {
    if (!selectedDate || courtStaff.length === 0) return;
    loadTimes();
  }, [selectedDate, duration, courtStaff.length]);

  async function loadTimes() {
    setLoadingTimes(true);
    setSelectedTime(null);
    setSelectedStaffId(null);

    const day = formatDate(selectedDate);
    const dayOfWeek = selectedDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const durationServices = serviceMap[duration] || {};

    // Build list of service_ids to query (each separately!)
    const tariffQueries = [];
    if (isWeekend) {
      if (durationServices.weekend) tariffQueries.push(durationServices.weekend);
    } else {
      if (durationServices.day) tariffQueries.push(durationServices.day);
      if (durationServices.evening) tariffQueries.push(durationServices.evening);
    }

    if (tariffQueries.length === 0) {
      setTimeSlots({});
      setLoadingTimes(false);
      return;
    }

    try {
      const results = {};
      await Promise.all(
        courtStaff.map(async (court) => {
          const courtSlots = [];
          // Fetch each tariff separately (combining returns 0!)
          for (const svcId of tariffQueries) {
            try {
              const times = await api.venues.bookingTimes(venueId, court.id, day, [String(svcId)]);
              const timeList = Array.isArray(times) ? times : [];
              courtSlots.push(...timeList.map(t => ({ ...t, serviceId: svcId })));
            } catch { /* skip failed tariff */ }
          }
          results[court.id] = courtSlots;
        })
      );
      setTimeSlots(results);
    } catch (err) {
      console.error('Load times error:', err);
    } finally {
      setLoadingTimes(false);
    }
  }

  // ── Merge slots across all courts, sorted by time
  const mergedSlots = useMemo(() => {
    const timeMap = {};
    for (const [staffId, slots] of Object.entries(timeSlots)) {
      for (const slot of slots) {
        const time = slot.time;
        if (!time) continue;
        if (!timeMap[time]) timeMap[time] = [];
        timeMap[time].push({ staffId, serviceId: slot.serviceId });
      }
    }
    return Object.entries(timeMap)
      .sort(([a], [b]) => {
        const [ah, am] = a.split(':').map(Number);
        const [bh, bm] = b.split(':').map(Number);
        return (ah * 60 + am) - (bh * 60 + bm);
      })
      .map(([time, courts]) => ({ time, courts }));
  }, [timeSlots]);

  // ── Courts available for selected time
  const availableCourts = useMemo(() => {
    if (!selectedTime) return [];
    const slot = mergedSlots.find(s => s.time === selectedTime);
    if (!slot) return [];
    return slot.courts.map(c => {
      const s = courtStaff.find(st => String(st.id) === String(c.staffId));
      return { ...c, name: s?.name || `Корт ${c.staffId}` };
    });
  }, [selectedTime, mergedSlots, courtStaff]);

  // ── Open external link
  function openExternal(url) {
    if (!url) return;
    if (tg?.openLink) tg.openLink(url);
    else window.open(url, '_blank');
  }

  // ── Build YClients booking URL and open it
  // URL: /create-record/record?o=m{staffId}s{serviceId}d{YYDDMMHHMM}
  // IMPORTANT: date code is YYDDMMHHMM — DAY before MONTH (not YYMMDDHHMM!)
  // Uses the slot's own serviceId so the correct tariff/price is shown.
  function openBooking() {
    if (!selectedTime || !selectedStaffId || !selectedDate || !venue) {
      openExternal(buildFallback());
      return;
    }

    // Get the actual serviceId from the slot (carries the correct tariff)
    const slot = mergedSlots.find(s => s.time === selectedTime);
    const courtEntry = slot?.courts.find(c => String(c.staffId) === selectedStaffId);

    if (!courtEntry?.serviceId) {
      const base = `https://${venue.yclientsFormId}.yclients.com/company/${venue.yclientsCompanyId}`;
      openExternal(`${base}/personal/select-time?o=m${selectedStaffId}&utm_source=padelgo`);
      return;
    }

    // Date code: YYDDMMHHMM — day BEFORE month (10 digits)
    const yy = String(selectedDate.getFullYear()).slice(2);
    const dd = String(selectedDate.getDate()).padStart(2, '0');
    const mo = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const [hh, mi] = selectedTime.split(':');
    const dateCode = `${yy}${dd}${mo}${hh.padStart(2, '0')}${mi.padStart(2, '0')}`;

    const base = `https://${venue.yclientsFormId}.yclients.com/company/${venue.yclientsCompanyId}`;
    openExternal(`${base}/create-record/record?o=m${selectedStaffId}s${courtEntry.serviceId}d${dateCode}&utm_source=padelgo`);
  }

  // ── RENDER ──

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
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 24, fontWeight: 800, color: COLORS.accent }}>{venue.courts}</p>
              <p style={{ fontSize: 11, color: COLORS.textDim }}>кортов</p>
            </div>
            <div style={{ width: 1, background: COLORS.border }} />
            {venue.yclientsPriceLabel && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 24, fontWeight: 800, color: COLORS.accent }}>{venue.yclientsPriceLabel.replace('от ', '')}</p>
                <p style={{ fontSize: 11, color: COLORS.textDim }}>от / час</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ── BOOKING SECTION ── */}
      {hasApiSlots && (
        <>
          <p style={{ fontSize: 15, fontWeight: 700, marginTop: 20, marginBottom: 10, color: COLORS.text }}>Свободное время</p>

          {/* Duration picker */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {DURATIONS.map(d => (
              <button key={d.value} onClick={() => { setDuration(d.value); setSelectedTime(null); setSelectedStaffId(null); }} style={{
                flex: 1, padding: '10px 0', borderRadius: 12,
                border: `1px solid ${duration === d.value ? COLORS.accent : COLORS.border}`,
                background: duration === d.value ? COLORS.accentGlow : COLORS.surface,
                color: duration === d.value ? COLORS.accent : COLORS.textDim,
                fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                WebkitTapHighlightColor: 'transparent',
              }}>{d.label}</button>
            ))}
          </div>

          {/* Date picker */}
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
                      }}>
                        {slot.time.includes(':') ? slot.time.split(':').map(p => p.padStart(2, '0')).join(':') : slot.time}
                        <div style={{ fontSize: 10, color: active ? COLORS.accent : COLORS.textDim, marginTop: 2 }}>
                          {slot.courts.length} {slot.courts.length === 1 ? 'корт' : slot.courts.length < 5 ? 'корта' : 'кортов'}
                        </div>
                      </button>
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

          {/* Book button */}
          {selectedTime && selectedStaffId && (
            <Button fullWidth onClick={openBooking} style={{ marginTop: 16 }}>
              {'🎾'} Забронировать корт
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
        {extra.schedule && <InfoRow icon={'🕒'} label="Режим работы" value={extra.schedule} />}
        {extra.phone && (
          <InfoRow icon={'📞'} label="Телефон" value={extra.phone}
            onClick={() => openExternal(`tel:${extra.phone.replace(/[^+\d]/g, '')}`)} />
        )}
        {extra.mapUrl && (
          <InfoRow icon={'📍'} label="На карте" value="Открыть в Яндекс.Картах"
            onClick={() => openExternal(extra.mapUrl)} />
        )}
        {extra.website && (
          <InfoRow icon={'🌐'} label="Сайт" value={extra.website.replace('https://', '')}
            onClick={() => openExternal(extra.website)} />
        )}
        {extra.telegram && (
          <InfoRow icon={'✈️'} label="Telegram" value={'@' + extra.telegram.split('/').pop()}
            onClick={() => openExternal(extra.telegram)} />
        )}
        {extra.instagram && (
          <InfoRow icon={'📸'} label="Instagram" value={'@' + (extra.instagram.split('/').pop()?.split('?')[0] || '')}
            onClick={() => openExternal(extra.instagram)} />
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
              <Badge key={i} variant="accent">{'✓'} {f}</Badge>
            ))}
          </div>
        </>
      )}

      {/* Fallback for venues without API */}
      {!hasApiSlots && venue.yclientsFormId && (
        <Button fullWidth onClick={() => openExternal(buildFallback())} style={{ marginTop: 20 }}>
          {'🎾'} Забронировать корт
        </Button>
      )}
    </div>
  );
}
