import React, { useEffect, useState } from 'react';
import { COLORS, CITIES } from '../config';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Header } from '../components/ui/Header';
import { Modal } from '../components/ui/Modal';
import { FilterTabs } from '../components/ui/ToggleGroup';
import { api } from '../services/api';

export function Tournaments({ user }) {
  const [filter, setFilter] = useState('registration');
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    loadTournaments();
  }, [filter]);

  async function loadTournaments() {
    setLoading(true);
    try {
      const data = await api.tournaments.list({ status: filter === 'all' ? '' : filter });
      setTournaments(data);
    } catch (err) {
      console.error('Load tournaments error:', err);
    }
    setLoading(false);
  }

  const openDetail = async (tournament) => {
    try {
      const detail = await api.tournaments.getById(tournament.id);
      setSelectedTournament(detail);
      setShowDetail(true);
    } catch (err) {
      console.error('Tournament detail error:', err);
    }
  };

  const handleRegister = async () => {
    // In a real app, we'd show a partner selection UI
    alert('Для записи выберите партнёра. Эта функция будет доступна в следующей версии.');
  };

  const formatMap = {
    americano: 'Americano',
    round_robin: 'Round Robin',
    round_robin_playoff: 'Round Robin + Playoff',
  };

  return (
    <div style={{ paddingBottom: 80 }}>
      <Header title="Турниры" subtitle="Участвуйте и побеждайте" />

      <FilterTabs
        options={[
          { value: 'registration', label: 'Открыта запись' },
          { value: 'completed', label: 'Завершённые' },
          { value: 'all', label: 'Все' },
        ]}
        value={filter}
        onChange={setFilter}
      />

      <div style={{ marginTop: 16 }}>
        {loading && (
          <p style={{ textAlign: 'center', color: COLORS.textDim, padding: 40 }}>Загрузка...</p>
        )}

        {!loading && tournaments.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <span style={{ fontSize: 48 }}>{'\u{1F3C6}'}</span>
            <p style={{ color: COLORS.textDim, marginTop: 12 }}>Турниров пока нет</p>
          </div>
        )}

        {tournaments.map((t) => {
          const isActive = t.status === 'REGISTRATION';
          return (
            <Card
              key={t.id}
              variant={isActive ? 'purple' : 'default'}
              onClick={() => openDetail(t)}
              style={{ marginBottom: 10, cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: isActive ? COLORS.purple : COLORS.text }}>
                    {t.name}
                  </h4>
                  <p style={{ fontSize: 13, color: COLORS.textDim, marginTop: 2 }}>
                    {new Date(t.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                    {' \u00B7 '}
                    {CITIES.find((c) => c.value === t.city)?.label}
                  </p>
                </div>
                {t.ratingMultiplier > 1 && (
                  <Badge variant="purple">{'\u00D7'}{t.ratingMultiplier}</Badge>
                )}
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Badge>{formatMap[t.format] || t.format}</Badge>
                <Badge variant="accent">{t.levelMin}-{t.levelMax}</Badge>
                <Badge>{t.teamsRegistered || 0}/{t.maxTeams} команд</Badge>
                {t.price && <Badge variant="warning">{t.price}</Badge>}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Tournament detail modal */}
      <Modal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        title={selectedTournament?.name || 'Турнир'}
      >
        {selectedTournament && (
          <div>
            <p style={{ fontSize: 14, color: COLORS.text, marginBottom: 12, lineHeight: 1.5 }}>
              {selectedTournament.description}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: COLORS.textDim, fontSize: 13 }}>Площадка</span>
                <span style={{ color: COLORS.text, fontSize: 13 }}>{selectedTournament.venue?.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: COLORS.textDim, fontSize: 13 }}>Формат</span>
                <span style={{ color: COLORS.text, fontSize: 13 }}>{formatMap[selectedTournament.format] || selectedTournament.format}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: COLORS.textDim, fontSize: 13 }}>Команд</span>
                <span style={{ color: COLORS.text, fontSize: 13 }}>{selectedTournament.teamsRegistered}/{selectedTournament.maxTeams}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: COLORS.textDim, fontSize: 13 }}>Бонус рейтинга</span>
                <span style={{ color: COLORS.purple, fontSize: 13, fontWeight: 600 }}>{'\u00D7'}{selectedTournament.ratingMultiplier}</span>
              </div>
              {selectedTournament.price && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: COLORS.textDim, fontSize: 13 }}>Стоимость</span>
                  <span style={{ color: COLORS.warning, fontSize: 13, fontWeight: 600 }}>{selectedTournament.price}</span>
                </div>
              )}
            </div>

            {/* Prizes */}
            {selectedTournament.prizes && Array.isArray(selectedTournament.prizes) && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>Призы</p>
                {selectedTournament.prizes.map((prize, idx) => (
                  <p key={idx} style={{ fontSize: 14, color: COLORS.textDim, marginBottom: 2 }}>{prize}</p>
                ))}
              </div>
            )}

            {/* Registered teams */}
            {selectedTournament.registrations?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>Участники</p>
                {selectedTournament.registrations.map((reg) => (
                  <div key={reg.id} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 13, color: COLORS.textDim }}>
                    <span>{reg.player1.firstName} ({reg.player1.rating})</span>
                    <span>&</span>
                    <span>{reg.player2.firstName} ({reg.player2.rating})</span>
                  </div>
                ))}
              </div>
            )}

            {selectedTournament.status === 'REGISTRATION' && (
              <Button variant="purple" fullWidth onClick={handleRegister} size="lg">
                {'\u{1F3C6}'} Записаться на турнир
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
