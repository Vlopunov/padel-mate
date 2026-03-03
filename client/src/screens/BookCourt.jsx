import React, { useState, useEffect, useMemo } from 'react';
import { COLORS } from '../config';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Header } from '../components/ui/Header';
import { api } from '../services/api';

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

  // Generate next 7 days
  const dates = useMemo(() => {
    const result = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      result.push(d);
    }
    return result;
  }, []);

  // Load venue + services + staff
  useEffect(() => {
    loadInitialData();
  }, [venueId]);

  async function loadInitialData() {
    try {
      setLoading(true);
      const venueData = await api.venues.getById(venueId);
      setVenue(venueData);

      if (!venueData.yclientsCompanyId) {
        setFallbackUrl(null);
        setLoading(false);
        return;
      }

      const [servicesData, staffData] = await Promise.all([
        api.venues.bookingServices(venueId).catch(e => { setFallbackUrl(e.fallbackUrl); return []; }),
        api.venues.bookingStaff(venueId).catch(e => { setFallbackUrl(e.fallbackUrl); return []; }),
      ]);
      setServices(Array.isArray(servicesData) ? servicesData : []);
      setStaff(Array.isArray(staffData) ? staffData : []);

      if ((!servicesData || !servicesData.length) && (!staffData || !staffData.length)) {
        setFallbackUrl(buildFallback(venueData));
      }
    } catch (err) {
      console.error('BookCourt init error:', err);
      setFallbackUrl(buildFallback(null));
    } finally {
      setLoading(false);
    }
  }

  function buildFallback(v) {
    const ven = v || venue;
    if (!ven?.yclientsFormId || !ven?.yclientsCompanyId) return null;
    return `https://${ven.yclientsFormId}.yclients.com/company/${ven.yclientsCompanyId}/personal/select-time?o=`;
  }

  // Filter services by duration
  const filteredServiceIds = useMemo(() => {
    return services
      .filter(s => (s.seance_length === duration * 60) || (s.duration === duration))
      .map(s => String(s.id));
  }, [services, duration]);

  // Load times when date changes
  useEffect(() => {
    if (!selectedDate || staff.length === 0) return;
    loadTimes();
  }, [selectedDate, duration, staff]);

  async function loadTimes() {
    setLoadingTimes(true);
    setSelectedTime(null);
    setSelectedStaffId(null);

    const day = formatDate(selectedDate);
    const bookableStaff = staff.filter(s => s.bookable !== false);

    try {
      const results = {};
      await Promise.all(
        bookableStaff.map(async (s) => {
          try {
            const times = await api.venues.bookingTimes(venueId, s.id, day, filteredServiceIds);
            results[s.id] = Array.isArray(times) ? times : [];
          } catch {
            results[s.id] = [];
          }
        })
      );
      setTimeSlots(results);
    } catch (err) {
      console.error('Load times error:', err);
    } finally {
      setLoadingTimes(false);
    }
  }

  // Merge times across all courts
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

  // Courts available for selected time
  const availableCourts = useMemo(() => {
    if (!selectedTime) return [];
    const slot = mergedSlots.find(s => s.time === selectedTime);
    if (!slot) return [];
    return slot.courts.map(c => {
      const s = staff.find(st => String(st.id) === String(c.staffId));
      return { ...c, name: s?.name || `Корт ${c.staffId}` };
    });
  }, [selectedTime, mergedSlots, staff]);

  function openBooking() {
    let url = buildFallback(venue);
    if (url && selectedStaffId) {
      url += `&s=${selectedStaffId}`;
    }
    if (url && selectedDate) {
      url += `&d=${formatDate(selectedDate)}`;
    }
    if (!url) return;
    if (tg?.openLink) {
      tg.openLink(url);
    } else {
      window.open(url, '_blank');
    }
  }

  function openFallback() {
    const url = fallbackUrl || buildFallback(venue);
    if (!url) return;
    if (tg?.openLink) {
      tg.openLink(url);
    } else {
      window.open(url, '_blank');
    }
  }

  // --- RENDER ---

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <Header title="Бронирование" leftAction={{ label: '\u2190', onClick: onBack }} />
        <p style={{ color: COLORS.textDim, marginTop: 60 }}>Загрузка...</p>
      </div>
    );
  }

  if (!venue) {
    return (
      <div style={{ padding: 20 }}>
        <Header title="Бронирование" leftAction={{ label: '\u2190', onClick: onBack }} />
        <p style={{ color: COLORS.textDim, marginTop: 40, textAlign: 'center' }}>Площадка не найдена</p>
      </div>
    );
  }

  // Fallback mode — direct link
  if (fallbackUrl && staff.length === 0) {
    return (
      <div style={{ padding: 20 }}>
        <Header title="Бронирование" leftAction={{ label: '\u2190', onClick: onBack }} />
        <Card style={{ marginTop: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{venue.name}</p>
            <p style={{ fontSize: 13, color: COLORS.textDim, marginBottom: 4 }}>{venue.address}</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 12 }}>
              <Badge variant="accent">{venue.courts} {venue.courts === 1 ? 'корт' : 'кортов'}</Badge>
              {venue.yclientsPriceLabel && <Badge>{venue.yclientsPriceLabel}</Badge>}
            </div>
          </div>
        </Card>
        <Button fullWidth style={{ marginTop: 20 }} onClick={openFallback}>
          {'\uD83C\uDFBE'} Забронировать в YClients
        </Button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, paddingBottom: 100 }}>
      <Header title="Бронирование" leftAction={{ label: '\u2190', onClick: onBack }} />

      {/* Venue card */}
      <Card style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <p style={{ fontSize: 18, fontWeight: 700 }}>{venue.name}</p>
            <p style={{ fontSize: 13, color: COLORS.textDim }}>{venue.address}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 12, color: COLORS.textDim }}>Кортов</p>
            <p style={{ fontSize: 20, fontWeight: 700 }}>{venue.courts}</p>
          </div>
        </div>
        {venue.yclientsPriceLabel && (
          <Badge variant="accent" style={{ marginTop: 8 }}>{venue.yclientsPriceLabel}</Badge>
        )}
      </Card>

      {/* Duration picker */}
      <p style={{ fontSize: 14, fontWeight: 600, marginTop: 20, marginBottom: 8, color: COLORS.textDim }}>Длительность</p>
      <div style={{ display: 'flex', gap: 8 }}>
        {DURATIONS.map(d => (
          <button
            key={d.value}
            onClick={() => setDuration(d.value)}
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: 12,
              border: `1px solid ${duration === d.value ? COLORS.accent : COLORS.border}`,
              background: duration === d.value ? COLORS.accentGlow : COLORS.surface,
              color: duration === d.value ? COLORS.accent : COLORS.textDim,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Date picker */}
      <p style={{ fontSize: 14, fontWeight: 600, marginTop: 20, marginBottom: 8, color: COLORS.textDim }}>Дата</p>
      <div style={{
        display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4,
        scrollbarWidth: 'none', msOverflowStyle: 'none',
      }} className="hide-scrollbar">
        {dates.map(d => {
          const active = selectedDate && formatDate(selectedDate) === formatDate(d);
          const isToday = formatDate(d) === formatDate(new Date());
          return (
            <button
              key={formatDate(d)}
              onClick={() => setSelectedDate(d)}
              style={{
                minWidth: 60,
                padding: '8px 4px',
                borderRadius: 12,
                border: `1px solid ${active ? COLORS.accent : COLORS.border}`,
                background: active ? COLORS.accentGlow : COLORS.surface,
                color: active ? COLORS.accent : COLORS.text,
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'center',
                flexShrink: 0,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
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
          <p style={{ fontSize: 14, fontWeight: 600, marginTop: 20, marginBottom: 8, color: COLORS.textDim }}>
            Время {loadingTimes && '...'}
          </p>
          {loadingTimes ? (
            <p style={{ color: COLORS.textDim, fontSize: 13, textAlign: 'center', padding: 20 }}>Загрузка слотов...</p>
          ) : mergedSlots.length === 0 ? (
            <p style={{ color: COLORS.textDim, fontSize: 13, textAlign: 'center', padding: 20 }}>Нет свободных слотов на эту дату</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {mergedSlots.map(slot => {
                const active = selectedTime === slot.time;
                return (
                  <button
                    key={slot.time}
                    onClick={() => {
                      setSelectedTime(slot.time);
                      setSelectedStaffId(null);
                    }}
                    style={{
                      padding: '10px 0',
                      borderRadius: 10,
                      border: `1px solid ${active ? COLORS.accent : COLORS.border}`,
                      background: active ? COLORS.accentGlow : COLORS.surface,
                      color: active ? COLORS.accent : COLORS.text,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    {slot.time}
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
          <p style={{ fontSize: 14, fontWeight: 600, marginTop: 20, marginBottom: 8, color: COLORS.textDim }}>Выберите корт</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {availableCourts.map(court => {
              const active = selectedStaffId === String(court.staffId);
              return (
                <button
                  key={court.staffId}
                  onClick={() => setSelectedStaffId(String(court.staffId))}
                  style={{
                    padding: '14px 8px',
                    borderRadius: 12,
                    border: `1px solid ${active ? COLORS.accent : COLORS.border}`,
                    background: active ? COLORS.accentGlow : COLORS.surface,
                    color: active ? COLORS.accent : COLORS.text,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'center',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {court.name}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Book button */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: '12px 20px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        background: `linear-gradient(transparent, ${COLORS.bg} 30%)`,
        pointerEvents: 'none',
      }}>
        <Button
          fullWidth
          onClick={openBooking}
          disabled={!selectedTime}
          style={{ pointerEvents: 'auto' }}
        >
          {'\uD83C\uDFBE'} Забронировать в YClients
        </Button>
      </div>
    </div>
  );
}
