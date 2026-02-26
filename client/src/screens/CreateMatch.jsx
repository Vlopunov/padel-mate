import React, { useState, useEffect } from 'react';
import { COLORS, CITIES } from '../config';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Checkbox } from '../components/ui/Checkbox';
import { Header } from '../components/ui/Header';
import { ToggleGroup } from '../components/ui/ToggleGroup';
import { api } from '../services/api';

export function CreateMatch({ user, onBack, onCreated }) {
  const [venues, setVenues] = useState([]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [durationMin, setDurationMin] = useState('90');
  const [venueId, setVenueId] = useState('');
  const [courtBooked, setCourtBooked] = useState(false);
  const [levelMin, setLevelMin] = useState('1.0');
  const [levelMax, setLevelMax] = useState('4.0');
  const [matchType, setMatchType] = useState('RATED');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.city) {
      api.venues.list(user.city).then(setVenues).catch(console.error);
    }
  }, [user?.city]);

  const levelOptions = [];
  for (let l = 1.0; l <= 4.0; l += 0.5) {
    levelOptions.push({ value: l.toFixed(1), label: l.toFixed(1) });
  }

  const handleCreate = async () => {
    if (!date || !time || !venueId) {
      alert('Заполните дату, время и площадку');
      return;
    }

    setLoading(true);
    try {
      const dateTime = new Date(`${date}T${time}`);
      await api.matches.create({
        venueId: parseInt(venueId),
        date: dateTime.toISOString(),
        durationMin: parseInt(durationMin),
        levelMin: parseFloat(levelMin),
        levelMax: parseFloat(levelMax),
        courtBooked,
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
            {'\u2190'}
          </button>
        }
      />

      <Card style={{ marginBottom: 12 }}>
        <Input
          label="Дата"
          type="date"
          value={date}
          onChange={setDate}
        />

        <Input
          label="Время начала"
          type="time"
          value={time}
          onChange={setTime}
        />

        <Select
          label="Длительность"
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

        <Select
          label="Площадка"
          value={venueId}
          onChange={setVenueId}
          placeholder="Выберите площадку"
          options={venues.map((v) => ({ value: String(v.id), label: v.name }))}
        />

        <Checkbox
          checked={courtBooked}
          onChange={setCourtBooked}
          label="Корт забронирован"
        />
      </Card>

      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <Select
            label="Уровень от"
            value={levelMin}
            onChange={setLevelMin}
            options={levelOptions}
            style={{ flex: 1 }}
          />
          <Select
            label="Уровень до"
            value={levelMax}
            onChange={setLevelMax}
            options={levelOptions}
            style={{ flex: 1 }}
          />
        </div>

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

      <Card style={{ marginBottom: 20 }}>
        <Textarea
          label="Комментарий (необязательно)"
          value={notes}
          onChange={setNotes}
          placeholder="Дополнительная информация..."
          rows={2}
        />
      </Card>

      <Button fullWidth onClick={handleCreate} disabled={loading} size="lg">
        {loading ? 'Создание...' : '\u{1F3BE} Создать матч'}
      </Button>
    </div>
  );
}
