import React, { useState, useEffect, useRef } from 'react';
import { COLORS, CITIES } from '../config';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Header } from '../components/ui/Header';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { FilterTabs } from '../components/ui/ToggleGroup';
import { api } from '../services/api';

export function ScoreEntry({ user, matchId, onBack, onDone }) {
  const [match, setMatch] = useState(null);
  // Steps: 'select' (choose match) | 'pastForm' (create past match) | 'pastPlayers' (pick 3 players)
  //        | 'teams' | 'score' | 'preview'
  const [step, setStep] = useState('select');
  const [teams, setTeams] = useState({}); // { [userId]: 1 | 2 }
  const [sets, setSets] = useState([{ team1Score: '', team2Score: '' }]);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [allMatches, setAllMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState(matchId || '');
  const [initialLoading, setInitialLoading] = useState(true);

  // Past match creation state
  const [pastForm, setPastForm] = useState({
    date: '',
    venueId: '',
    durationMin: '90',
    matchType: 'RATED',
  });
  const [venues, setVenues] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]); // array of user objects (max 3)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [ratingFilter, setRatingFilter] = useState('all');
  const [creating, setCreating] = useState(false);
  const searchTimer = useRef(null);

  useEffect(() => {
    if (matchId) {
      loadMatch(matchId);
    } else {
      loadEligibleMatches();
    }
  }, [matchId]);

  async function loadEligibleMatches() {
    try {
      const data = await api.matches.list({ status: 'full' });
      const eligible = data.filter(
        (m) =>
          ['FULL', 'PENDING_SCORE'].includes(m.status) &&
          m.players.some((p) => p.user.id === user?.id && p.status === 'APPROVED')
      );
      setAllMatches(eligible);
      if (eligible.length === 1) {
        setSelectedMatchId(String(eligible[0].id));
        loadMatch(eligible[0].id);
      }
    } catch (err) {
      console.error('Load matches error:', err);
    }
    setInitialLoading(false);
  }

  async function loadMatch(id) {
    try {
      const data = await api.matches.getById(id);
      setMatch(data);
      // Initialize team assignments from existing data
      const initialTeams = {};
      const approved = (data.players || []).filter((p) => p.status === 'APPROVED');
      approved.forEach((p) => {
        initialTeams[p.user.id] = p.team || 0;
      });
      setTeams(initialTeams);
      setStep('teams');
    } catch (err) {
      console.error('Load match error:', err);
    }
    setInitialLoading(false);
  }

  const handleMatchSelect = (id) => {
    setSelectedMatchId(id);
    if (id) loadMatch(parseInt(id));
  };

  // --- Past match creation ---
  async function loadVenues() {
    try {
      const data = await api.venues.list();
      setVenues(data);
    } catch (err) {
      console.error('Load venues error:', err);
    }
  }

  function openPastMatchForm() {
    setStep('pastForm');
    loadVenues();
    // Set default date to today
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    setPastForm((f) => ({ ...f, date: local.toISOString().slice(0, 16) }));
  }

  function goToPlayerSelection() {
    if (!pastForm.date || !pastForm.venueId || !pastForm.durationMin) {
      alert('Заполните все поля');
      return;
    }
    if (new Date(pastForm.date) > new Date()) {
      alert('Дата сыгранного матча не может быть в будущем');
      return;
    }
    setStep('pastPlayers');
    setSelectedPlayers([]);
    setSearchQuery('');
    setRatingFilter('all');
    setSearchResults([]);
    loadPlayerUsers('', 'all');
  }

  // Player search for past match
  async function loadPlayerUsers(q = '', rating = 'all') {
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

  function handlePlayerSearchInput(q) {
    setSearchQuery(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      loadPlayerUsers(q, ratingFilter);
    }, 300);
  }

  function handlePlayerRatingFilter(value) {
    setRatingFilter(value);
    loadPlayerUsers(searchQuery, value);
  }

  function addPlayer(playerUser) {
    if (selectedPlayers.length >= 3) return;
    if (selectedPlayers.some((p) => p.id === playerUser.id)) return;
    setSelectedPlayers((prev) => [...prev, playerUser]);
  }

  function removePlayer(playerId) {
    setSelectedPlayers((prev) => prev.filter((p) => p.id !== playerId));
  }

  async function handleCreatePastMatch() {
    if (selectedPlayers.length !== 3) {
      alert('Выберите 3 игроков');
      return;
    }
    setCreating(true);
    try {
      const data = await api.matches.createPast({
        venueId: parseInt(pastForm.venueId),
        date: pastForm.date,
        durationMin: parseInt(pastForm.durationMin),
        matchType: pastForm.matchType,
        playerIds: selectedPlayers.map((p) => p.id),
      });
      // Match created in FULL status — now load it and go to team assignment
      setMatch(data);
      setSelectedMatchId(String(data.id));
      const initialTeams = {};
      const approved = (data.players || []).filter((p) => p.status === 'APPROVED');
      approved.forEach((p) => {
        initialTeams[p.user.id] = 0; // reset teams for user to assign
      });
      setTeams(initialTeams);
      setStep('teams');
    } catch (err) {
      alert(err.message || 'Ошибка создания матча');
    }
    setCreating(false);
  }

  // Filter out already selected players and self from search results
  const selectedIds = new Set([user?.id, ...selectedPlayers.map((p) => p.id)]);
  const filteredSearchResults = searchResults.filter((u) => !selectedIds.has(u.id));

  // --- Score entry logic ---
  const approvedPlayers = (match?.players || []).filter((p) => p.status === 'APPROVED');
  const team1Players = approvedPlayers.filter((p) => teams[p.user.id] === 1);
  const team2Players = approvedPlayers.filter((p) => teams[p.user.id] === 2);

  const toggleTeam = (userId, team) => {
    setTeams((prev) => ({
      ...prev,
      [userId]: prev[userId] === team ? 0 : team,
    }));
  };

  const teamsReady = team1Players.length === 2 && team2Players.length === 2;

  const updateSet = (idx, field, value) => {
    const newSets = [...sets];
    newSets[idx] = { ...newSets[idx], [field]: value };
    setSets(newSets);
  };

  const addSet = () => {
    if (sets.length < 10) {
      setSets([...sets, { team1Score: '', team2Score: '' }]);
    }
  };

  const removeSet = (idx) => {
    if (sets.length > 1) {
      setSets(sets.filter((_, i) => i !== idx));
    }
  };

  const handleSubmit = async () => {
    const id = selectedMatchId || matchId;
    if (!id) return;

    const validSets = sets.filter((s) => s.team1Score !== '' && s.team2Score !== '');
    if (validSets.length === 0) {
      alert('Введите счёт хотя бы одного сета');
      return;
    }

    // Build teams array for backend
    const teamsArray = approvedPlayers.map((p) => ({
      userId: p.user.id,
      team: teams[p.user.id],
    }));

    setLoading(true);
    try {
      const result = await api.matches.submitScore(id, validSets, teamsArray);
      setPreview(result);
      setStep('preview');
    } catch (err) {
      alert(err.message || 'Ошибка записи счёта');
    }
    setLoading(false);
  };

  const scoreOptions = Array.from({ length: 8 }, (_, i) => ({ value: String(i), label: String(i) }));
  const tiebreakOptions = Array.from({ length: 20 }, (_, i) => ({ value: String(i), label: String(i) }));

  const isTiebreak = (set) => {
    const t1 = parseInt(set.team1Score);
    const t2 = parseInt(set.team2Score);
    return (t1 === 7 && t2 === 6) || (t1 === 6 && t2 === 7);
  };

  // Helper: go back based on current step
  const handleBack = () => {
    if (step === 'score') {
      setStep('teams');
    } else if (step === 'teams' && !matchId && allMatches.length === 0 && !match) {
      // If this was a past match, can't go back to pastPlayers since match is already created
      onBack();
    } else if (step === 'pastPlayers') {
      setStep('pastForm');
    } else if (step === 'pastForm') {
      setStep('select');
    } else {
      onBack();
    }
  };

  // Player card for team selection
  const PlayerDragItem = ({ player, currentTeam }) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        background: COLORS.surface,
        borderRadius: 10,
        marginBottom: 6,
        border: `1px solid ${COLORS.border}`,
      }}
    >
      <Avatar src={player.user.photoUrl} name={player.user.firstName} size={32} />
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, color: COLORS.text, fontWeight: 500 }}>
          {player.user.firstName} {player.user.lastName || ''}
        </p>
        <p style={{ fontSize: 12, color: COLORS.textDim }}>{player.user.rating}</p>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button
          onClick={() => toggleTeam(player.user.id, 1)}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            border: currentTeam === 1 ? `2px solid ${COLORS.accent}` : `1px solid ${COLORS.border}`,
            background: currentTeam === 1 ? `${COLORS.accent}22` : 'transparent',
            color: currentTeam === 1 ? COLORS.accent : COLORS.textDim,
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          1
        </button>
        <button
          onClick={() => toggleTeam(player.user.id, 2)}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            border: currentTeam === 2 ? `2px solid ${COLORS.warning}` : `1px solid ${COLORS.border}`,
            background: currentTeam === 2 ? `${COLORS.warning}22` : 'transparent',
            color: currentTeam === 2 ? COLORS.warning : COLORS.textDim,
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          2
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ paddingBottom: 80 }}>
      <Header
        title="Записать счёт"
        leftAction={
          <button
            onClick={handleBack}
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
        }
      />

      {/* Step: Select match or create past match */}
      {step === 'select' && (
        <>
          {initialLoading && (
            <p style={{ textAlign: 'center', color: COLORS.textDim, padding: 40 }}>Загрузка...</p>
          )}

          {/* Match selector (if there are eligible matches) */}
          {!initialLoading && allMatches.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <Select
                label="Выберите матч"
                value={selectedMatchId}
                onChange={handleMatchSelect}
                placeholder="Выберите матч"
                options={allMatches.map((m) => ({
                  value: String(m.id),
                  label: `${new Date(m.date).toLocaleDateString('ru-RU')} — ${m.venue?.name}`,
                }))}
              />
            </div>
          )}

          {/* No eligible matches — show options */}
          {!initialLoading && allMatches.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <span style={{ fontSize: 48 }}>{'\u270F\uFE0F'}</span>
              <p style={{ color: COLORS.textDim, marginTop: 12 }}>Нет матчей для записи счёта</p>
              <p style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 4, marginBottom: 24 }}>
                Создайте матч и дождитесь набора 4 игроков
              </p>
            </div>
          )}

          {/* Always show "Record past match" button */}
          {!initialLoading && (
            <div style={{ padding: allMatches.length > 0 ? '0' : '0 16px' }}>
              <Card
                onClick={openPastMatchForm}
                style={{
                  cursor: 'pointer',
                  borderColor: `${COLORS.purple}44`,
                  textAlign: 'center',
                  padding: 20,
                }}
              >
                <span style={{ fontSize: 32, display: 'block', marginBottom: 8 }}>{'\u{1F4DD}'}</span>
                <p style={{ fontSize: 16, fontWeight: 700, color: COLORS.purple, marginBottom: 4 }}>
                  Записать сыгранный матч
                </p>
                <p style={{ fontSize: 13, color: COLORS.textDim }}>
                  Добавьте уже состоявшийся матч, укажите участников и счёт
                </p>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Step: Past match form (date, venue, duration) */}
      {step === 'pastForm' && (
        <>
          <Card style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>
              Детали матча
            </p>
            <p style={{ fontSize: 13, color: COLORS.textDim, marginBottom: 16 }}>
              Укажите когда и где проходил матч
            </p>

            <Input
              label="Дата и время"
              type="datetime-local"
              value={pastForm.date}
              onChange={(v) => setPastForm({ ...pastForm, date: v })}
              max={(() => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); })()}
            />

            <Select
              label="Площадка"
              value={pastForm.venueId}
              onChange={(v) => setPastForm({ ...pastForm, venueId: v })}
              placeholder="Выберите площадку"
              options={venues.map((v) => ({ value: String(v.id), label: v.name }))}
            />

            <Select
              label="Длительность"
              value={pastForm.durationMin}
              onChange={(v) => setPastForm({ ...pastForm, durationMin: v })}
              options={[
                { value: '60', label: '60 мин' },
                { value: '90', label: '90 мин' },
                { value: '120', label: '120 мин' },
                { value: '150', label: '150 мин' },
                { value: '180', label: '180 мин' },
              ]}
            />

            <Select
              label="Тип матча"
              value={pastForm.matchType}
              onChange={(v) => setPastForm({ ...pastForm, matchType: v })}
              options={[
                { value: 'RATED', label: 'Рейтинговый' },
                { value: 'FRIENDLY', label: 'Дружеский' },
              ]}
            />
          </Card>

          <Button fullWidth size="lg" onClick={goToPlayerSelection}>
            Далее — Выбрать игроков
          </Button>
        </>
      )}

      {/* Step: Select 3 players for past match */}
      {step === 'pastPlayers' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)' }}>
          {/* Selected players panel */}
          <Card style={{ marginBottom: 12, padding: 12 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>
              Игроки матча ({selectedPlayers.length + 1}/4)
            </p>

            {/* Current user (auto-included) */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0',
              marginBottom: 4,
            }}>
              <Avatar name={user?.firstName} src={user?.photoUrl} size={28} />
              <span style={{ fontSize: 13, color: COLORS.text, fontWeight: 500 }}>
                {user?.firstName} {user?.lastName || ''} (вы)
              </span>
              <Badge style={{ fontSize: 10, marginLeft: 'auto' }}>{user?.rating}</Badge>
            </div>

            {/* Selected players */}
            {selectedPlayers.map((p) => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0',
              }}>
                <Avatar name={p.firstName} src={p.photoUrl} size={28} />
                <span style={{ fontSize: 13, color: COLORS.text, fontWeight: 500 }}>
                  {p.firstName} {p.lastName || ''}
                </span>
                <Badge style={{ fontSize: 10, marginLeft: 'auto' }}>{p.rating}</Badge>
                <button
                  onClick={() => removePlayer(p.id)}
                  style={{
                    background: 'none', border: 'none', color: COLORS.danger,
                    cursor: 'pointer', fontSize: 14, padding: '2px 6px',
                  }}
                >
                  {'\u2715'}
                </button>
              </div>
            ))}

            {selectedPlayers.length < 3 && (
              <p style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 6 }}>
                Выберите ещё {3 - selectedPlayers.length} {3 - selectedPlayers.length === 1 ? 'игрока' : 'игроков'}
              </p>
            )}
          </Card>

          {/* Search */}
          {selectedPlayers.length < 3 && (
            <>
              <Input
                placeholder="Поиск по имени..."
                value={searchQuery}
                onChange={handlePlayerSearchInput}
                style={{ marginBottom: 0 }}
              />

              <div style={{ marginTop: 8, marginBottom: 8 }}>
                <FilterTabs
                  options={[
                    { value: 'all', label: 'Все' },
                    { value: '0-1200', label: '<1200' },
                    { value: '1200-1500', label: '1200-1500' },
                    { value: '1500-1800', label: '1500-1800' },
                    { value: '1800-', label: '1800+' },
                  ]}
                  value={ratingFilter}
                  onChange={handlePlayerRatingFilter}
                />
              </div>
            </>
          )}

          {/* Search results */}
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12 }}>
            {searchLoading && (
              <p style={{ textAlign: 'center', color: COLORS.textDim, padding: 20 }}>Поиск...</p>
            )}

            {!searchLoading && selectedPlayers.length < 3 && filteredSearchResults.map((u) => (
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
                  variant="accent"
                  size="sm"
                  onClick={() => addPlayer(u)}
                >
                  +
                </Button>
              </div>
            ))}
          </div>

          {/* Create button */}
          <Button
            fullWidth
            size="lg"
            onClick={handleCreatePastMatch}
            disabled={selectedPlayers.length !== 3 || creating}
          >
            {creating ? 'Создание...' : selectedPlayers.length === 3 ? 'Создать матч и записать счёт' : `Выберите ещё ${3 - selectedPlayers.length} игроков`}
          </Button>
        </div>
      )}

      {/* Step: Team Selection */}
      {match && step === 'teams' && (
        <>
          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, justifyContent: 'center' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: COLORS.accent, color: '#000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 13,
            }}>1</div>
            <div style={{ width: 40, height: 2, background: COLORS.border, alignSelf: 'center' }} />
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: COLORS.border, color: COLORS.textDim,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 13,
            }}>2</div>
          </div>

          <Card style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>
              Кто играл?
            </p>
            <p style={{ fontSize: 13, color: COLORS.textDim, marginBottom: 16 }}>
              Распределите игроков по командам. Нажмите 1 или 2 рядом с каждым игроком.
            </p>

            {approvedPlayers.map((p) => (
              <PlayerDragItem
                key={p.user.id}
                player={p}
                currentTeam={teams[p.user.id] || 0}
              />
            ))}
          </Card>

          {/* Team preview */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <Card style={{
              flex: 1,
              borderLeft: `3px solid ${COLORS.accent}`,
              padding: 12,
              opacity: team1Players.length > 0 ? 1 : 0.5,
            }}>
              <p style={{ fontSize: 12, color: COLORS.accent, fontWeight: 600, marginBottom: 8 }}>
                Команда 1 ({team1Players.length}/2)
              </p>
              {team1Players.map((p) => (
                <p key={p.user.id} style={{ fontSize: 13, color: COLORS.text, marginBottom: 2 }}>
                  {p.user.firstName} {p.user.lastName || ''}
                </p>
              ))}
              {team1Players.length === 0 && (
                <p style={{ fontSize: 12, color: COLORS.textMuted }}>Выберите 2 игроков</p>
              )}
            </Card>

            <Card style={{
              flex: 1,
              borderLeft: `3px solid ${COLORS.warning}`,
              padding: 12,
              opacity: team2Players.length > 0 ? 1 : 0.5,
            }}>
              <p style={{ fontSize: 12, color: COLORS.warning, fontWeight: 600, marginBottom: 8 }}>
                Команда 2 ({team2Players.length}/2)
              </p>
              {team2Players.map((p) => (
                <p key={p.user.id} style={{ fontSize: 13, color: COLORS.text, marginBottom: 2 }}>
                  {p.user.firstName} {p.user.lastName || ''}
                </p>
              ))}
              {team2Players.length === 0 && (
                <p style={{ fontSize: 12, color: COLORS.textMuted }}>Выберите 2 игроков</p>
              )}
            </Card>
          </div>

          <Button
            fullWidth
            size="lg"
            onClick={() => setStep('score')}
            disabled={!teamsReady}
          >
            {teamsReady ? 'Далее — Ввести счёт' : 'Выберите по 2 игрока в каждую команду'}
          </Button>
        </>
      )}

      {/* Step: Score Input */}
      {match && step === 'score' && (
        <>
          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, justifyContent: 'center' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: COLORS.accent, color: '#000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 13,
            }}>{'\u2713'}</div>
            <div style={{ width: 40, height: 2, background: COLORS.accent, alignSelf: 'center' }} />
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: COLORS.accent, color: '#000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 13,
            }}>2</div>
          </div>

          {/* Teams summary */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <Card style={{ flex: 1, borderLeft: `3px solid ${COLORS.accent}`, padding: 12 }}>
              <p style={{ fontSize: 12, color: COLORS.accent, fontWeight: 600, marginBottom: 8 }}>Команда 1</p>
              {team1Players.map((p) => (
                <div key={p.user.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Avatar src={p.user.photoUrl} name={p.user.firstName} size={24} />
                  <div>
                    <p style={{ fontSize: 13, color: COLORS.text }}>{p.user.firstName}</p>
                    <p style={{ fontSize: 11, color: COLORS.textDim }}>{p.user.rating}</p>
                  </div>
                </div>
              ))}
            </Card>

            <Card style={{ flex: 1, borderLeft: `3px solid ${COLORS.warning}`, padding: 12 }}>
              <p style={{ fontSize: 12, color: COLORS.warning, fontWeight: 600, marginBottom: 8 }}>Команда 2</p>
              {team2Players.map((p) => (
                <div key={p.user.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Avatar src={p.user.photoUrl} name={p.user.firstName} size={24} />
                  <div>
                    <p style={{ fontSize: 13, color: COLORS.text }}>{p.user.firstName}</p>
                    <p style={{ fontSize: 11, color: COLORS.textDim }}>{p.user.rating}</p>
                  </div>
                </div>
              ))}
            </Card>
          </div>

          {/* Sets */}
          <Card style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 12 }}>Счёт по сетам</p>

            {sets.map((set, idx) => (
              <div key={idx} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: COLORS.textDim, width: 50 }}>Сет {idx + 1}</span>
                  <Select
                    value={set.team1Score}
                    onChange={(v) => updateSet(idx, 'team1Score', v)}
                    options={scoreOptions}
                    placeholder="-"
                    style={{ flex: 1, marginBottom: 0 }}
                  />
                  <span style={{ color: COLORS.textMuted, fontWeight: 700 }}>:</span>
                  <Select
                    value={set.team2Score}
                    onChange={(v) => updateSet(idx, 'team2Score', v)}
                    options={scoreOptions}
                    placeholder="-"
                    style={{ flex: 1, marginBottom: 0 }}
                  />
                  {sets.length > 1 && (
                    <button
                      onClick={() => removeSet(idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: COLORS.danger,
                        cursor: 'pointer',
                        fontSize: 16,
                      }}
                    >
                      {'\u2715'}
                    </button>
                  )}
                </div>
                {/* Tiebreak input — appears when set is 7:6 or 6:7 */}
                {isTiebreak(set) && (
                  <div style={{
                    display: 'flex', gap: 8, alignItems: 'center',
                    marginTop: 6, marginLeft: 50, paddingLeft: 0,
                  }}>
                    <span style={{ fontSize: 11, color: COLORS.purple, width: 58, fontWeight: 600 }}>Тай-брейк</span>
                    <Select
                      value={set.team1Tiebreak || ''}
                      onChange={(v) => updateSet(idx, 'team1Tiebreak', v)}
                      options={tiebreakOptions}
                      placeholder="-"
                      style={{ flex: 1, marginBottom: 0 }}
                    />
                    <span style={{ color: COLORS.textMuted, fontWeight: 700 }}>:</span>
                    <Select
                      value={set.team2Tiebreak || ''}
                      onChange={(v) => updateSet(idx, 'team2Tiebreak', v)}
                      options={tiebreakOptions}
                      placeholder="-"
                      style={{ flex: 1, marginBottom: 0 }}
                    />
                    <div style={{ width: 24 }} />
                  </div>
                )}
              </div>
            ))}

            {sets.length < 10 && (
              <Button variant="ghost" size="sm" onClick={addSet}>
                + Добавить сет
              </Button>
            )}
          </Card>

          <Button fullWidth onClick={handleSubmit} disabled={loading} size="lg">
            {loading ? 'Сохранение...' : 'Записать результат'}
          </Button>
        </>
      )}

      {/* Step: Preview result */}
      {step === 'preview' && preview && (
        <Card variant="accent" style={{ textAlign: 'center' }}>
          <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>{'\u2705'}</span>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, marginBottom: 8 }}>
            Счёт записан!
          </h3>
          <p style={{ fontSize: 14, color: COLORS.textDim, marginBottom: 6 }}>
            Ожидается подтверждение от соперника
          </p>
          <p style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 16 }}>
            Один из соперников должен подтвердить в течение 7 дней
          </p>

          {preview.ratingPreview && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: COLORS.textDim, marginBottom: 8 }}>Предварительный расчёт Elo</p>
              {preview.ratingPreview.map((c) => {
                const player = match?.players?.find((p) => p.user.id === c.userId);
                return (
                  <div key={c.userId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: COLORS.text }}>{player?.user.firstName}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: c.change > 0 ? COLORS.accent : COLORS.danger }}>
                      {c.change > 0 ? '+' : ''}{c.change} ({c.oldRating} {'\u2192'} {c.newRating})
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <Button fullWidth onClick={onDone}>
            Готово
          </Button>
        </Card>
      )}
    </div>
  );
}
