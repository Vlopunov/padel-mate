import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, Timer, MapPin } from 'lucide-react';
import { COLORS, LEVELS } from '../config';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Checkbox } from '../components/ui/Checkbox';
import { Header } from '../components/ui/Header';
import { ToggleGroup } from '../components/ui/ToggleGroup';
import { api } from '../services/api';

// Generate time slots every 30 min from 06:00 to 23:30
const TIME_SLOTS = [];
for (let h = 6; h <= 23; h++) {
  TIME_SLOTS.push({ value: `${String(h).padStart(2, '0')}:00`, label: `${String(h).padStart(2, '0')}:00` });
  TIME_SLOTS.push({ value: `${String(h).padStart(2, '0')}:30`, label: `${String(h).padStart(2, '0')}:30` });
}

export function CreateMatch({ user, onBack, onCreated }) {
  const [venues, setVenues] = useState([]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [durationMin, setDurationMin] = useState('90');
  const [venueId, setVenueId] = useState('');
  const [courtBooked, setCourtBooked] = useState(false);
  const [courtNumber, setCourtNumber] = useState('');
  const [level, setLevel] = useState('1.0');
  const [matchType, setMatchType] = useState('RATED');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.regionId) {
      api.venues.list(user.regionId).then(setVenues).catch(console.error);
    }
  }, [user?.regionId]);

  // Get selected venue info
  const selectedVenue = venues.find((v) => String(v.id) === venueId);
  const isMultiCourt = selectedVenue?.multiCourt;
  const showCourtNumber = courtBooked && isMultiCourt;

  // Court options for the selected venue
  const courtOptions = selectedVenue
    ? Array.from({ length: selectedVenue.courts || 1 }, (_, i) => ({
        value: String(i + 1),
        label: `Корт ${i + 1}`,
      }))
    : [];

  const levelOptions = LEVELS.map((l) => ({
    value: l.level.toFixed(1),
    label: `${l.category} — ${l.name}`,
  }));

  // Set default date to today
  useEffect(() => {
    if (!date) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      setDate(`${yyyy}-${mm}-${dd}`);
    }
  }, []);

  const handleCreate = async () => {
    if (!date || !time || !venueId) {
      alert('Заполните дату, время и площадку');
      return;
    }

    const dateTime = new Date(`${date}T${time}`);
    if (dateTime <= new Date()) {
      alert('Нельзя создать матч задним числом. Для записи прошедшего матча используйте "Записать счёт" → "Записать сыгранный матч".');
      return;
    }

    setLoading(true);
    try {
      await api.matches.create({
        venueId: parseInt(venueId),
        date: dateTime.toISOString(),
        durationMin: parseInt(durationMin),
        levelMin: parseFloat(level),
        levelMax: parseFloat(level),
        courtBooked,
        courtNumber: showCourtNumber && courtNumber ? parseInt(courtNumber) : null,
        matchType,
        notes: notes || undefined,
      });
      onCreated();
    } catch (err) {
      alert(err.message || 'Ошибка создания матча');
    }
    setLoading(false);
  };

  return (
    <div style={{ paddingBottom: 80 }}>
      <Header
        title="Создать матч"
        leftAction={
          <button
            onClick={onBack}
            style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 10,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: COLORS.textDim,
              fontSize: 16,
            }}
          >
            <ArrowLeft size={16} />
          </button>
        }
      />

      {/* Date & Time */}
      <Card style={{ marginBottom: 12 }}>
        <Input
          label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Calendar size={14} /> Дата</span>}
          type="date"
          value={date}
          onChange={setDate}
          min={(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })()}
        />

        <Select
          label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Clock size={14} /> Время начала</span>}
          value={time}
          onChange={setTime}
          placeholder="Выберите время"
          options={TIME_SLOTS}
        />

        <Select
          label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Timer size={14} /> Длительность</span>}
          value={durationMin}
          onChange={setDurationMin}
          options={[
            { value: '60', label: '1 час' },
            { value: '90', label: '1.5 часа' },
            { value: '120', label: '2 часа' },
            { value: '150', label: '2.5 часа' },
            { value: '180', label: '3 часа' },
          ]}
        />
      </Card>

      {/* Venue & Court */}
      <Card style={{ marginBottom: 12 }}>
        <Select
          label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><MapPin size={14} /> Площадка</span>}
          value={venueId}
          onChange={(v) => { setVenueId(v); setCourtNumber(''); }}
          placeholder="Выберите площадку"
          options={venues.map((v) => ({ value: String(v.id), label: v.name }))}
        />

        <Checkbox
          checked={courtBooked}
          onChange={(v) => { setCourtBooked(v); if (!v) setCourtNumber(''); }}
          label="Корт забронирован"
        />

        {showCourtNumber && (
          <Select
            label="Номер корта"
            value={courtNumber}
            onChange={setCourtNumber}
            placeholder="Выберите корт"
            options={courtOptions}
          />
        )}
      </Card>

      {/* Level & Type */}
      <Card style={{ marginBottom: 12 }}>
        <Select
          label="Уровень"
          value={level}
          onChange={setLevel}
          options={levelOptions}
        />

        <p style={{ fontSize: 13, color: COLORS.textDim, marginBottom: 8, fontWeight: 500, marginTop: 4 }}>Тип</p>
        <ToggleGroup
          options={[
            { value: 'RATED', label: '\u{1F3C6} Рейтинговый' },
            { value: 'FRIENDLY', label: '\u{1F60A} Дружеский' },
          ]}
          value={matchType}
          onChange={setMatchType}
        />
      </Card>

      {/* Notes */}
      <Card style={{ marginBottom: 20 }}>
        <Textarea
          label="Комментарий (необязательно)"
          value={notes}
          onChange={setNotes}
          placeholder="Дополнительная информация..."
          rows={2}
        />
      </Card>

      <Button fullWidth onClick={handleCreate} disabled={loading || !date || !time || !venueId} size="lg">
        {loading ? 'Создание...' : '\u{1F3BE} Создать матч'}
      </Button>
    </div>
  );
}
