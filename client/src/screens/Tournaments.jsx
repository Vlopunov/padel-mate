import React, { useEffect, useState, useRef } from 'react';
import { COLORS, CITIES } from '../config';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Header } from '../components/ui/Header';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { FilterTabs } from '../components/ui/ToggleGroup';
import { api } from '../services/api';

export function Tournaments({ user }) {
  const [filter, setFilter] = useState('registration');
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  // Partner selection
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [ratingFilter, setRatingFilter] = useState('all');
  const [registering, setRegistering] = useState(false);
  const searchTimer = useRef(null);

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

  // Refresh detail after registration change
  async function refreshDetail(tournamentId) {
    try {
      const detail = await api.tournaments.getById(tournamentId);
      setSelectedTournament(detail);
    } catch (err) {
      console.error('Refresh detail error:', err);
    }
    loadTournaments();
  }

  // Partner search
  async function loadPartnerUsers(q = '', rating = 'all') {
    setSearchLoading(true);
    try {
      const opts = {};
      if (rating && rating !== 'all') {
        const [min, max] = rating.split('-');
        if (min) opts.ratingMin = min;
        if (max) opts.ratingMax = max;
      }
      const results = await api.users.search(q.trim() || '', opts);
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
    }
    setSearchLoading(false);
  }

  function handleSearchInput(q) {
    setSearchQuery(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      loadPartnerUsers(q, ratingFilter);
    }, 300);
  }

  function handleRatingFilter(value) {
    setRatingFilter(value);
    loadPartnerUsers(searchQuery, value);
  }

  function openPartnerModal() {
    setShowPartnerModal(true);
    setSearchQuery('');
    setRatingFilter('all');
    setSearchResults([]);
    loadPartnerUsers('', 'all');
  }

  async function handleRegister(partnerId) {
    if (!selectedTournament) return;
    setRegistering(true);
    try {
      await api.tournaments.register(selectedTournament.id, partnerId);
      setShowPartnerModal(false);
      await refreshDetail(selectedTournament.id);
    } catch (err) {
      alert(err.message);
      // Refresh data after error to get up-to-date registrations
      try {
        const detail = await api.tournaments.getById(selectedTournament.id);
        setSelectedTournament(detail);
        // Check if user is now registered (maybe was already registered)
        const isNowRegistered = detail.registrations?.some(
          (r) => r.player1?.id === user?.id || r.player2?.id === user?.id
        );
        if (isNowRegistered) {
          setShowPartnerModal(false);
        }
      } catch (_) {}
      loadTournaments();
    }
    setRegistering(false);
  }

  async function handleUnregister() {
    if (!selectedTournament) return;
    if (!confirm('Отменить запись на турнир?')) return;
    try {
      await api.tournaments.unregister(selectedTournament.id);
      await refreshDetail(selectedTournament.id);
    } catch (err) {
      alert(err.message);
    }
  }

  // Check if user is registered in the selected tournament
  const myRegistration = selectedTournament?.registrations?.find(
    (r) => r.player1?.id === user?.id || r.player2?.id === user?.id
  );

  // Filter out already-registered players from search results
  const registeredPlayerIds = new Set();
  selectedTournament?.registrations?.forEach((r) => {
    if (r.player1Id) registeredPlayerIds.add(r.player1Id);
    if (r.player2Id) registeredPlayerIds.add(r.player2Id);
    if (r.player1?.id) registeredPlayerIds.add(r.player1.id);
    if (r.player2?.id) registeredPlayerIds.add(r.player2.id);
  });
  const filteredResults = searchResults.filter(
    (u) => u.id !== user?.id && !registeredPlayerIds.has(u.id)
  );

  const formatMap = {
    americano: 'Americano',
    round_robin: 'Round Robin',
    round_robin_playoff: 'Round Robin + Playoff',
  };

  const isFull = selectedTournament
    ? (selectedTournament.teamsRegistered || selectedTournament.registrations?.length || 0) >= selectedTournament.maxTeams
    : false;

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
            {selectedTournament.description && (
              <p style={{ fontSize: 14, color: COLORS.text, marginBottom: 12, lineHeight: 1.5 }}>
                {selectedTournament.description}
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: COLORS.textDim, fontSize: 13 }}>Площадка</span>
                <span style={{ color: COLORS.text, fontSize: 13 }}>{selectedTournament.venue?.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: COLORS.textDim, fontSize: 13 }}>Дата</span>
                <span style={{ color: COLORS.text, fontSize: 13 }}>
                  {new Date(selectedTournament.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: COLORS.textDim, fontSize: 13 }}>Формат</span>
                <span style={{ color: COLORS.text, fontSize: 13 }}>{formatMap[selectedTournament.format] || selectedTournament.format}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: COLORS.textDim, fontSize: 13 }}>Команд</span>
                <span style={{ color: COLORS.text, fontSize: 13 }}>
                  {selectedTournament.registrations?.length || 0}/{selectedTournament.maxTeams}
                </span>
              </div>
              {selectedTournament.ratingMultiplier > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: COLORS.textDim, fontSize: 13 }}>Бонус рейтинга</span>
                  <span style={{ color: COLORS.purple, fontSize: 13, fontWeight: 600 }}>{'\u00D7'}{selectedTournament.ratingMultiplier}</span>
                </div>
              )}
              {selectedTournament.price && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: COLORS.textDim, fontSize: 13 }}>Стоимость</span>
                  <span style={{ color: COLORS.warning, fontSize: 13, fontWeight: 600 }}>{selectedTournament.price}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: COLORS.textDim, fontSize: 13 }}>Уровень</span>
                <span style={{ color: COLORS.accent, fontSize: 13, fontWeight: 600 }}>
                  {selectedTournament.levelMin} — {selectedTournament.levelMax}
                </span>
              </div>
            </div>

            {/* Prizes */}
            {selectedTournament.prizes && Array.isArray(selectedTournament.prizes) && selectedTournament.prizes.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>Призы</p>
                {selectedTournament.prizes.map((prize, idx) => (
                  <p key={idx} style={{ fontSize: 14, color: COLORS.textDim, marginBottom: 2 }}>{prize}</p>
                ))}
              </div>
            )}

            {/* My registration status */}
            {myRegistration && (
              <Card style={{ marginBottom: 16, borderColor: `${COLORS.accent}44`, padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 18 }}>{'\u2705'}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.accent }}>Вы записаны!</span>
                </div>
                <p style={{ fontSize: 13, color: COLORS.textDim }}>
                  Ваша пара: <span style={{ color: COLORS.text, fontWeight: 600 }}>
                    {myRegistration.player1?.firstName} & {myRegistration.player2?.firstName}
                  </span>
                </p>
                {selectedTournament.status === 'REGISTRATION' && (
                  <button
                    onClick={handleUnregister}
                    style={{
                      marginTop: 10,
                      background: 'none',
                      border: `1px solid ${COLORS.danger}44`,
                      borderRadius: 10,
                      padding: '6px 14px',
                      color: COLORS.danger,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Отменить запись
                  </button>
                )}
              </Card>
            )}

            {/* Registered teams */}
            {selectedTournament.registrations?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>
                  Участники ({selectedTournament.registrations.length}/{selectedTournament.maxTeams})
                </p>
                {selectedTournament.registrations.map((reg, idx) => (
                  <div
                    key={reg.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      marginBottom: 8,
                      padding: '8px 10px',
                      background: COLORS.surface,
                      borderRadius: 10,
                      border: `1px solid ${COLORS.border}`,
                    }}
                  >
                    <span style={{ fontSize: 13, color: COLORS.textDim, fontWeight: 600, minWidth: 20 }}>
                      {idx + 1}.
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, color: COLORS.text, fontWeight: 600 }}>
                          {reg.player1?.firstName}
                        </span>
                        <Badge style={{ fontSize: 10 }}>{reg.player1?.rating}</Badge>
                        <span style={{ color: COLORS.textDim, fontSize: 12 }}>&</span>
                        <span style={{ fontSize: 13, color: COLORS.text, fontWeight: 600 }}>
                          {reg.player2?.firstName}
                        </span>
                        <Badge style={{ fontSize: 10 }}>{reg.player2?.rating}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Registration button */}
            {selectedTournament.status === 'REGISTRATION' && !myRegistration && (
              <div>
                {isFull ? (
                  <Button variant="default" fullWidth size="lg" disabled>
                    Все места заняты
                  </Button>
                ) : (
                  <Button variant="purple" fullWidth onClick={openPartnerModal} size="lg">
                    {'\u{1F3C6}'} Записаться на турнир
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Partner selection modal */}
      {showPartnerModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1100,
            background: COLORS.bg,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{ padding: '16px 16px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <button
                onClick={() => setShowPartnerModal(false)}
                style={{
                  background: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 10,
                  width: 32,
                  height: 32,
                  cursor: 'pointer',
                  color: COLORS.textDim,
                  fontSize: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {'\u2190'}
              </button>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, margin: 0 }}>
                Выберите партнёра
              </h3>
            </div>

            <Input
              placeholder="Поиск по имени..."
              value={searchQuery}
              onChange={handleSearchInput}
              style={{ marginBottom: 0 }}
            />

            <div style={{ marginTop: 10, marginBottom: 10 }}>
              <FilterTabs
                options={[
                  { value: 'all', label: 'Все' },
                  { value: '0-1200', label: '<1200' },
                  { value: '1200-1500', label: '1200-1500' },
                  { value: '1500-1800', label: '1500-1800' },
                  { value: '1800-', label: '1800+' },
                ]}
                value={ratingFilter}
                onChange={handleRatingFilter}
              />
            </div>
          </div>

          {/* Results */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
            {searchLoading && (
              <p style={{ textAlign: 'center', color: COLORS.textDim, padding: 20 }}>Поиск...</p>
            )}

            {!searchLoading && filteredResults.length === 0 && (
              <p style={{ textAlign: 'center', color: COLORS.textDim, padding: 20 }}>
                Игроки не найдены
              </p>
            )}

            {filteredResults.map((u) => (
              <div
                key={u.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  marginBottom: 6,
                  background: COLORS.card,
                  borderRadius: 12,
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                <Avatar name={u.firstName} src={u.photoUrl} size={36} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>
                    {u.firstName} {u.lastName || ''}
                  </p>
                  <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                    <Badge style={{ fontSize: 10 }}>{u.rating}</Badge>
                    {u.city && (
                      <span style={{ fontSize: 11, color: COLORS.textDim }}>
                        {CITIES.find((c) => c.value === u.city)?.label}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="purple"
                  size="sm"
                  onClick={() => handleRegister(u.id)}
                  disabled={registering}
                >
                  Выбрать
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
