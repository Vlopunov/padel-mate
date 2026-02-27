import React, { useEffect, useState, useRef, useCallback } from 'react';
import { COLORS, LEVELS, getLevel, getLevelByValue, BOT_USERNAME } from '../config';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Header } from '../components/ui/Header';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { FilterTabs } from '../components/ui/ToggleGroup';
import { api } from '../services/api';
import { useTelegram } from '../hooks/useTelegram';

// Countdown timer component
function CountdownTimer({ targetDate, compact = false }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    function update() {
      const now = Date.now();
      const target = new Date(targetDate).getTime();
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds, total: diff });
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!timeLeft) return null;

  // Compact version for list cards
  if (compact) {
    let text;
    if (timeLeft.days > 0) {
      text = `${timeLeft.days}д ${timeLeft.hours}ч`;
    } else if (timeLeft.hours > 0) {
      text = `${timeLeft.hours}ч ${timeLeft.minutes}м`;
    } else {
      text = `${timeLeft.minutes}м ${timeLeft.seconds}с`;
    }
    const isUrgent = timeLeft.total < 60 * 60 * 1000; // less than 1 hour
    return (
      <span style={{
        fontSize: 11,
        fontWeight: 700,
        color: isUrgent ? COLORS.warning : COLORS.accent,
      }}>
        {'\u23F0'} {text}
      </span>
    );
  }

  // Full version for detail view
  const isUrgent = timeLeft.total < 60 * 60 * 1000;
  const bgColor = isUrgent ? `${COLORS.warning}15` : `${COLORS.accent}10`;
  const borderColor = isUrgent ? `${COLORS.warning}40` : `${COLORS.accent}30`;
  const textColor = isUrgent ? COLORS.warning : COLORS.accent;

  const TimeBlock = ({ value, label }) => (
    <div style={{ textAlign: 'center', minWidth: 48 }}>
      <div style={{
        fontSize: 24, fontWeight: 800, color: textColor,
        lineHeight: 1,
      }}>
        {String(value).padStart(2, '0')}
      </div>
      <div style={{ fontSize: 10, color: COLORS.textDim, marginTop: 2 }}>{label}</div>
    </div>
  );

  const Separator = () => (
    <span style={{ fontSize: 20, fontWeight: 800, color: textColor, opacity: 0.5, alignSelf: 'flex-start', marginTop: 1 }}>:</span>
  );

  return (
    <div style={{
      background: bgColor,
      border: `1px solid ${borderColor}`,
      borderRadius: 14,
      padding: '12px 16px',
      marginBottom: 12,
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: textColor, marginBottom: 8, textAlign: 'center' }}>
        {'\u23F0'} {isUrgent ? 'Скоро начало!' : 'До начала матча'}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: 6 }}>
        {timeLeft.days > 0 && (
          <>
            <TimeBlock value={timeLeft.days} label="дн" />
            <Separator />
          </>
        )}
        <TimeBlock value={timeLeft.hours} label="час" />
        <Separator />
        <TimeBlock value={timeLeft.minutes} label="мин" />
        <Separator />
        <TimeBlock value={timeLeft.seconds} label="сек" />
      </div>
    </div>
  );
}

export function Matches({ user, onNavigate, highlightMatchId }) {
  const { openTelegramLink } = useTelegram();
  const [filter, setFilter] = useState(highlightMatchId ? 'all' : 'recruiting');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingMatch, setEditingMatch] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [selectedMatch, setSelectedMatch] = useState(null);

  // Invite player modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [ratingFilter, setRatingFilter] = useState('all'); // 'all' | '0-1200' | '1200-1500' | '1500-1800' | '1800+'
  const searchTimer = useRef(null);

  // Comments
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);

  // Calendar (no loading state — opens link in external browser)

  useEffect(() => {
    loadMatches();
  }, [filter]);

  // Auto-open highlighted match
  useEffect(() => {
    if (highlightMatchId && matches.length > 0) {
      const m = matches.find((m) => m.id === highlightMatchId);
      if (m) setSelectedMatch(m);
    }
  }, [highlightMatchId, matches]);

  // Load comments when match is selected
  useEffect(() => {
    if (selectedMatch) {
      loadComments(selectedMatch.id);
    }
  }, [selectedMatch?.id]);

  async function loadMatches() {
    setLoading(true);
    try {
      const data = await api.matches.list({ status: filter === 'all' ? '' : filter });
      setMatches(data);
    } catch (err) {
      console.error('Load matches error:', err);
    }
    setLoading(false);
  }

  async function loadComments(matchId) {
    setCommentsLoading(true);
    try {
      const data = await api.matches.getComments(matchId);
      setComments(data);
    } catch (err) {
      console.error('Load comments error:', err);
    }
    setCommentsLoading(false);
  }

  async function handleSendComment(matchId) {
    if (!commentText.trim()) return;
    setSendingComment(true);
    try {
      const comment = await api.matches.addComment(matchId, commentText.trim());
      setComments((prev) => [...prev, comment]);
      setCommentText('');
    } catch (err) {
      alert(err.message);
    }
    setSendingComment(false);
  }

  async function handleJoin(matchId) {
    try {
      await api.matches.join(matchId);
      loadMatches();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleLeave(matchId) {
    try {
      await api.matches.leave(matchId);
      setSelectedMatch(null);
      loadMatches();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete(matchId) {
    if (!confirm('Удалить этот матч?')) return;
    try {
      await api.matches.delete(matchId);
      setSelectedMatch(null);
      loadMatches();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleApprove(matchId, userId) {
    try {
      await api.matches.approvePlayer(matchId, userId);
      loadMatches();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleReject(matchId, userId) {
    try {
      await api.matches.rejectPlayer(matchId, userId);
      loadMatches();
    } catch (err) {
      alert(err.message);
    }
  }

  function handleShare(match) {
    const link = `https://t.me/${BOT_USERNAME}?start=match_${match.id}`;
    const matchDate = new Date(match.date);
    const dateStr = matchDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    const timeStr = matchDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const endDate = new Date(matchDate.getTime() + (match.durationMin || 90) * 60000);
    const endTimeStr = endDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const approvedCount = match.players?.filter((p) => p.status === 'APPROVED').length || 0;
    const slotsLeft = 4 - approvedCount;
    const slotsText = slotsLeft === 1 ? '1 место' : slotsLeft >= 2 && slotsLeft <= 4 ? `${slotsLeft} места` : `${slotsLeft} мест`;

    const lines = [
      `\uD83C\uDFBE Падел-матч — ищем игроков!`,
      ``,
      `\uD83D\uDCC5 ${dateStr}, ${timeStr} — ${endTimeStr}`,
      `\uD83D\uDCCD ${match.venue?.name || 'Площадка TBD'}`,
      `\uD83D\uDC65 Свободно ${slotsText} из 4`,
      `\uD83D\uDCCA Уровень: ${getLevelByValue(match.levelMin).category} — ${getLevelByValue(match.levelMax).category}`,
    ];
    const text = lines.join('\n');
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
    openTelegramLink(shareUrl);
  }

  async function handleDownloadCalendar(match) {
    // Generate .ics client-side to avoid Telegram WebView download issues
    const pad = (n) => String(n).padStart(2, '0');
    const fmtDate = (d) =>
      `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
    const esc = (s) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

    const start = new Date(match.date);
    const end = new Date(start.getTime() + match.durationMin * 60000);
    const approvedNames = match.players
      .filter((p) => p.status === 'APPROVED')
      .map((p) => `${p.user.firstName}${p.user.lastName ? ' ' + p.user.lastName : ''} (${p.user.rating})`)
      .join('\\n');
    const typeLabel = match.matchType === 'RATED' ? 'Рейтинговый' : 'Дружеский';
    const lvl = getLevel(match.levelMin || 1500);

    const icsText = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Padel GO//Match//RU',
      'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
      `UID:padel-go-match-${match.id}@padelgo.by`,
      `DTSTART:${fmtDate(start)}`, `DTEND:${fmtDate(end)}`,
      `SUMMARY:${esc('Падел — ' + (match.venue?.name || 'Матч'))}`,
      `LOCATION:${match.venue ? esc(match.venue.name + ', ' + match.venue.address) : ''}`,
      `DESCRIPTION:${esc(`Тип: ${typeLabel}\nУровень: ${lvl.category} — ${lvl.name}\n\nИгроки:\n${approvedNames}\n\nPadel GO — t.me/PadelGoBY_bot`)}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Матч через 2 часа!',
      'TRIGGER:-PT2H', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsText], { type: 'text/calendar;charset=utf-8' });
    const file = new File([blob], `padel-match-${match.id}.ics`, { type: 'text/calendar' });

    // Try native share (iOS share sheet → Calendar app)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ title: 'Падел матч', files: [file] });
        return;
      } catch (e) {
        if (e.name === 'AbortError') return; // user cancelled share sheet
      }
    }

    // Fallback: open server URL in external browser
    const token = api.getToken();
    const url = `${window.location.origin}/api/matches/${match.id}/calendar?token=${encodeURIComponent(token)}`;
    const tg = window.Telegram?.WebApp;
    if (tg?.openLink) {
      tg.openLink(url, { try_instant_view: false });
    } else {
      window.open(url, '_blank');
    }
  }

  function openEdit(match) {
    setEditForm({
      date: new Date(match.date).toISOString().slice(0, 16),
      durationMin: match.durationMin,
      levelMin: match.levelMin,
      levelMax: match.levelMax,
      courtBooked: match.courtBooked,
      matchType: match.matchType,
      notes: match.notes || '',
    });
    setEditingMatch(match);
  }

  async function handleEditSave() {
    try {
      await api.matches.update(editingMatch.id, editForm);
      setEditingMatch(null);
      loadMatches();
    } catch (err) {
      alert(err.message);
    }
  }

  // Invite player search — loads all users, supports text + rating filter
  async function loadInviteUsers(q = '', rating = 'all') {
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
      loadInviteUsers(q, ratingFilter);
    }, 300);
  }

  function handleRatingFilter(value) {
    setRatingFilter(value);
    loadInviteUsers(searchQuery, value);
  }

  function openInviteModal() {
    setShowInviteModal(true);
    setSearchQuery('');
    setRatingFilter('all');
    setSearchResults([]);
    loadInviteUsers('', 'all');
  }

  async function handleAddPlayer(matchId, userId) {
    try {
      await api.matches.addPlayer(matchId, userId);
      setShowInviteModal(false);
      setSearchQuery('');
      setSearchResults([]);
      loadMatches();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleConfirmScore(matchId) {
    try {
      await api.matches.confirmScore(matchId);
      loadMatches();
    } catch (err) {
      alert(err.message);
    }
  }

  // Detail view for a selected match
  if (selectedMatch) {
    const match = matches.find((m) => m.id === selectedMatch.id) || selectedMatch;
    const myPlayer = match.players?.find((p) => p.user.id === user?.id);
    const isInMatch = !!myPlayer;
    const isPending = myPlayer?.status === 'PENDING';
    const isInvited = myPlayer?.status === 'INVITED';
    const isCreator = match.creatorId === user?.id;
    const approvedPlayers = match.players?.filter((p) => p.status === 'APPROVED') || [];
    const pendingPlayers = match.players?.filter((p) => p.status === 'PENDING') || [];
    const invitedPlayers = match.players?.filter((p) => p.status === 'INVITED') || [];
    const isFull = approvedPlayers.length >= 4;
    const canJoin = !isInMatch && !isFull && match.status === 'RECRUITING';
    const canScore = ['FULL', 'PENDING_SCORE'].includes(match.status) && isInMatch && !isPending && !isInvited;
    const canInvite = isCreator && !isFull && match.status === 'RECRUITING';
    const date = new Date(match.date);

    // Filter out players already in match from search results
    const existingPlayerIds = new Set(match.players?.map((p) => p.user.id) || []);
    const filteredResults = searchResults.filter((u) => !existingPlayerIds.has(u.id));

    return (
      <div style={{ paddingBottom: 80 }}>
        {/* Back button + status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button
            onClick={() => { setSelectedMatch(null); setComments([]); setCommentText(''); }}
            style={{
              background: COLORS.surface, border: `1px solid ${COLORS.border}`,
              borderRadius: 10, width: 32, height: 32, color: COLORS.textDim,
              fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {'\u2190'}
          </button>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, margin: 0, flex: 1 }}>
            Матч #{match.id}
          </h2>
          <Badge variant={
            match.status === 'COMPLETED' ? 'success' :
            match.status === 'CANCELLED' ? 'danger' :
            match.status === 'RECRUITING' ? 'accent' :
            'warning'
          }>
            {match.status === 'RECRUITING' ? 'Набор' :
             match.status === 'FULL' ? 'Собран' :
             match.status === 'PENDING_CONFIRMATION' ? 'Подтверждение' :
             match.status === 'COMPLETED' ? 'Завершён' :
             match.status === 'CANCELLED' ? 'Отменён' : match.status}
          </Badge>
        </div>

        {/* Main info card */}
        <Card style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.text }}>
                {date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
              </div>
              <div style={{ fontSize: 16, color: COLORS.accent, fontWeight: 600, marginTop: 2 }}>
                {date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                {match.durationMin > 0 && (() => {
                  const endDate = new Date(date.getTime() + match.durationMin * 60000);
                  return (
                    <span style={{ color: COLORS.textDim, fontWeight: 500 }}>
                      {' — '}{endDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  );
                })()}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {match.matchType === 'RATED' && <Badge variant="accent">{'\uD83C\uDFC6'} Рейтинг</Badge>}
              {match.matchType === 'FRIENDLY' && <Badge variant="default">{'\uD83D\uDE0A'} Друж.</Badge>}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <InfoRow icon={'\uD83D\uDCCD'} label="Площадка" value={match.venue?.name || '—'} />
            <InfoRow icon={'\u23F1\uFE0F'} label="Длительность" value={`${match.durationMin} мин`} />
            <InfoRow icon={'\uD83D\uDCCA'} label="Уровень" value={`${getLevelByValue(match.levelMin).category} — ${getLevelByValue(match.levelMax).category}`} />
            {match.courtBooked && (
              <InfoRow icon={'\u2705'} label="Корт" value={match.courtNumber ? `Забронирован (корт ${match.courtNumber})` : 'Забронирован'} />
            )}
            {match.notes && (
              <InfoRow icon={'\uD83D\uDCDD'} label="Заметка" value={match.notes} />
            )}
          </div>
        </Card>

        {/* Countdown timer — show if user is in match and match is in the future */}
        {isInMatch && !isPending && !isInvited && ['RECRUITING', 'FULL'].includes(match.status) && new Date(match.date) > new Date() && (
          <CountdownTimer targetDate={match.date} />
        )}

        {/* Players card */}
        <Card style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>
              {'\uD83D\uDC65'} Игроки ({approvedPlayers.length}/4)
            </div>
            {canInvite && (
              <button
                onClick={openInviteModal}
                style={{
                  padding: '5px 12px', borderRadius: 10, border: `1px solid ${COLORS.accent}40`,
                  background: `${COLORS.accent}15`, color: COLORS.accent,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                {'\u2795'} Пригласить
              </button>
            )}
          </div>
          {/* Players (flat list) */}
          {approvedPlayers.map((p) => (
            <PlayerRowBig key={p.user.id} player={p} isCreator={p.user.id === match.creatorId} onPlayerClick={(userId) => onNavigate('playerProfile', { userId })} />
          ))}
          {approvedPlayers.length < 4 && Array.from({ length: 4 - approvedPlayers.length }).map((_, i) => (
            <EmptySlotBig key={`e-${i}`} />
          ))}
        </Card>

        {/* Pending players (visible to creator) */}
        {isCreator && pendingPlayers.length > 0 && (
          <Card style={{ marginBottom: 12, border: '1px solid rgba(255,193,7,0.3)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#FFC107', marginBottom: 12 }}>
              {'\uD83D\uDCE8'} Заявки ({pendingPlayers.length})
            </div>
            {pendingPlayers.map((p) => (
              <div key={p.user.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Avatar src={p.user.photoUrl} name={p.user.firstName} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, color: COLORS.text, fontWeight: 600 }}>{p.user.firstName}</div>
                  <div style={{ fontSize: 12, color: COLORS.textDim }}>Рейтинг: {p.user.rating}</div>
                </div>
                <Button size="sm" onClick={() => handleApprove(match.id, p.user.id)} style={{ padding: '6px 12px', fontSize: 12 }}>
                  {'\u2705'}
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleReject(match.id, p.user.id)} style={{ padding: '6px 12px', fontSize: 12 }}>
                  {'\u274C'}
                </Button>
              </div>
            ))}
          </Card>
        )}

        {/* Invited players (visible to creator) */}
        {isCreator && invitedPlayers.length > 0 && (
          <Card style={{ marginBottom: 12, border: `1px solid ${COLORS.purple}40` }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.purple, marginBottom: 12 }}>
              {'\uD83D\uDCE9'} Приглашённые ({invitedPlayers.length})
            </div>
            {invitedPlayers.map((p) => (
              <div key={p.user.id} style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
                padding: '6px 10px', borderRadius: 10, background: `${COLORS.bg}80`,
              }}>
                <Avatar src={p.user.photoUrl} name={p.user.firstName} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: COLORS.text, fontWeight: 600 }}>{p.user.firstName} {p.user.lastName || ''}</div>
                  <div style={{ fontSize: 11, color: COLORS.textDim }}>Рейтинг: {p.user.rating}</div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 8,
                  background: `${COLORS.purple}20`, color: COLORS.purple,
                }}>
                  Ожидает
                </span>
              </div>
            ))}
          </Card>
        )}

        {/* Invitation for current user (not creator) */}
        {isInvited && !isCreator && (
          <Card style={{ marginBottom: 12, border: `1px solid ${COLORS.purple}40` }}>
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 24 }}>{'\uD83C\uDFBE'}</span>
              <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text, marginTop: 4 }}>
                Вас пригласили в этот матч!
              </div>
              <div style={{ fontSize: 13, color: COLORS.textDim, marginTop: 2 }}>
                Примите приглашение чтобы присоединиться
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button fullWidth onClick={async () => {
                try {
                  await api.matches.acceptInvite(match.id);
                  loadMatches();
                  if (new Date(match.date) > new Date() && confirm('Добавить матч в календарь?')) {
                    handleDownloadCalendar(match);
                  }
                } catch (err) { alert(err.message); }
              }}>
                {'\u2705'} Принять
              </Button>
              <Button fullWidth variant="danger" onClick={async () => {
                try {
                  await api.matches.declineInvite(match.id);
                  setSelectedMatch(null);
                  loadMatches();
                } catch (err) { alert(err.message); }
              }}>
                {'\u274C'} Отклонить
              </Button>
            </div>
          </Card>
        )}

        {/* Pending indicator */}
        {isPending && !isCreator && (
          <Card style={{ marginBottom: 12, border: '1px solid rgba(255,193,7,0.3)' }}>
            <div style={{ textAlign: 'center', color: '#FFC107', fontSize: 14, fontWeight: 600 }}>
              {'\u23F3'} Заявка отправлена, ожидает одобрения
            </div>
          </Card>
        )}

        {/* Comments */}
        <Card style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 12 }}>
            {'\uD83D\uDCAC'} Комментарии {comments.length > 0 && `(${comments.length})`}
          </div>

          {commentsLoading && (
            <p style={{ fontSize: 13, color: COLORS.textDim, textAlign: 'center', padding: 10 }}>Загрузка...</p>
          )}

          {!commentsLoading && comments.length === 0 && (
            <p style={{ fontSize: 13, color: COLORS.textDim, textAlign: 'center', padding: 10 }}>
              Пока нет комментариев
            </p>
          )}

          {comments.map((c) => {
            const cDate = new Date(c.createdAt);
            const isMe = c.user.id === user?.id;
            return (
              <div key={c.id} style={{
                padding: '8px 10px', borderRadius: 12, marginBottom: 6,
                background: isMe ? `${COLORS.accent}10` : `${COLORS.bg}80`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span
                    onClick={() => onNavigate('playerProfile', { userId: c.user.id })}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Avatar src={c.user.photoUrl} name={c.user.firstName} size={22} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: isMe ? COLORS.accent : COLORS.text }}>
                      {c.user.firstName}
                    </span>
                  </span>
                  <span style={{ fontSize: 10, color: COLORS.textDim, marginLeft: 'auto' }}>
                    {cDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    {' '}
                    {cDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: COLORS.text, margin: 0, lineHeight: 1.4, paddingLeft: 28 }}>
                  {c.text}
                </p>
              </div>
            );
          })}

          {/* Comment input */}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendComment(match.id); } }}
              placeholder="Написать комментарий..."
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 12,
                border: `1px solid ${COLORS.border}`, background: COLORS.surface,
                color: COLORS.text, fontSize: 13, fontFamily: 'inherit',
                outline: 'none',
              }}
            />
            <button
              onClick={() => handleSendComment(match.id)}
              disabled={!commentText.trim() || sendingComment}
              style={{
                padding: '0 16px', borderRadius: 12, border: 'none',
                background: commentText.trim() ? COLORS.accent : COLORS.border,
                color: commentText.trim() ? '#000' : COLORS.textDim,
                fontSize: 16, cursor: commentText.trim() ? 'pointer' : 'default',
                fontWeight: 700, flexShrink: 0,
              }}
            >
              {'\u2191'}
            </button>
          </div>
        </Card>

        {/* Pending confirmation — show score and confirm button for opponents */}
        {match.status === 'PENDING_CONFIRMATION' && match.sets?.length > 0 && (() => {
          const submitterId = match.scoreSubmitterId;
          const submitterPlayer = approvedPlayers.find((p) => p.user.id === submitterId);
          const submitterTeam = submitterPlayer?.team;
          const isOpponent = myPlayer && myPlayer.status === 'APPROVED' && myPlayer.team !== submitterTeam;
          const submittedAt = match.scoreSubmittedAt ? new Date(match.scoreSubmittedAt) : null;
          const daysLeft = submittedAt ? Math.max(0, 7 - Math.floor((Date.now() - submittedAt.getTime()) / (1000 * 60 * 60 * 24))) : 7;

          return (
            <Card style={{ marginBottom: 12, border: `1px solid ${COLORS.warning}40` }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.warning, marginBottom: 12 }}>
                {'\u23F3'} Счёт на проверке
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                {match.sets.sort((a, b) => a.setNumber - b.setNumber).map((s) => {
                  const hasTB = s.team1Tiebreak != null && s.team2Tiebreak != null;
                  return (
                    <div key={s.setNumber} style={{
                      padding: '8px 14px', borderRadius: 10, background: COLORS.surface,
                      border: `1px solid ${COLORS.border}`, textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 4 }}>Сет {s.setNumber}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.text }}>
                        {s.team1Score} : {s.team2Score}
                      </div>
                      {hasTB && (
                        <div style={{ fontSize: 11, color: COLORS.purple, fontWeight: 600, marginTop: 2 }}>
                          TB {s.team1Tiebreak}:{s.team2Tiebreak}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p style={{ fontSize: 12, color: COLORS.textDim, textAlign: 'center', marginBottom: 8 }}>
                Записал: {submitterPlayer?.user.firstName || 'Игрок'}
                {submittedAt && ` — ${submittedAt.toLocaleDateString('ru-RU')}`}
              </p>
              <p style={{ fontSize: 11, color: COLORS.textMuted, textAlign: 'center', marginBottom: 12 }}>
                Осталось {daysLeft} дн. для подтверждения
              </p>
              {isOpponent && (
                <Button fullWidth onClick={() => handleConfirmScore(match.id)} size="lg">
                  {'\u2705'} Подтвердить счёт
                </Button>
              )}
              {myPlayer && myPlayer.team === submitterTeam && myPlayer.user.id !== submitterId && (
                <p style={{ fontSize: 12, color: COLORS.textDim, textAlign: 'center' }}>
                  Ожидается подтверждение от соперников
                </p>
              )}
              {myPlayer && myPlayer.user.id === submitterId && (
                <p style={{ fontSize: 12, color: COLORS.textDim, textAlign: 'center' }}>
                  Вы записали счёт. Ожидаем подтверждение соперника.
                </p>
              )}
            </Card>
          );
        })()}

        {/* Completed match score display */}
        {match.status === 'COMPLETED' && match.sets?.length > 0 && (
          <Card style={{ marginBottom: 12, border: `1px solid ${COLORS.accent}40` }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.accent, marginBottom: 12 }}>
              {'\u2705'} Итоговый счёт
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
              {match.sets.sort((a, b) => a.setNumber - b.setNumber).map((s) => {
                const hasTB = s.team1Tiebreak != null && s.team2Tiebreak != null;
                return (
                  <div key={s.setNumber} style={{
                    padding: '8px 14px', borderRadius: 10, background: COLORS.surface,
                    border: `1px solid ${COLORS.border}`, textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 4 }}>Сет {s.setNumber}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.text }}>
                      {s.team1Score} : {s.team2Score}
                    </div>
                    {hasTB && (
                      <div style={{ fontSize: 11, color: COLORS.purple, fontWeight: 600, marginTop: 2 }}>
                        TB {s.team1Tiebreak}:{s.team2Tiebreak}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {canJoin && (
            <Button fullWidth onClick={() => handleJoin(match.id)} size="lg">
              {'\uD83C\uDFBE'} Подать заявку
            </Button>
          )}
          {isPending && !isCreator && (
            <Button fullWidth variant="danger" onClick={() => handleLeave(match.id)}>
              Отменить заявку
            </Button>
          )}
          {canScore && (
            <Button fullWidth variant="outline" onClick={() => onNavigate('score', { matchId: match.id })} size="lg">
              {'\u270F\uFE0F'} Записать счёт
            </Button>
          )}
          {myPlayer && myPlayer.status === 'APPROVED' && ['RECRUITING', 'FULL'].includes(match.status) && new Date(match.date) > new Date() && (
            <Button fullWidth variant="outline" onClick={() => handleDownloadCalendar(match)}>
              📅 Добавить в календарь
            </Button>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <Button fullWidth variant="outline" onClick={() => handleShare(match)}>
              {'\uD83D\uDD17'} Поделиться
            </Button>
            {isCreator && ['RECRUITING', 'FULL'].includes(match.status) && (
              <Button fullWidth variant="outline" onClick={() => openEdit(match)}>
                {'\u270F\uFE0F'} Редактировать
              </Button>
            )}
          </div>
          {isInMatch && !isPending && match.status === 'RECRUITING' && (
            <Button fullWidth variant="danger" onClick={isCreator ? () => handleDelete(match.id) : () => handleLeave(match.id)}>
              {isCreator ? '\uD83D\uDDD1\uFE0F Удалить матч' : 'Покинуть матч'}
            </Button>
          )}
        </div>

        {/* Edit match modal */}
        <Modal isOpen={!!editingMatch} title="Редактировать матч" onClose={() => setEditingMatch(null)}>
          <EditMatchForm editForm={editForm} setEditForm={setEditForm} onSave={handleEditSave} onClose={() => setEditingMatch(null)} />
        </Modal>

        {/* Invite player modal */}
        {showInviteModal && (
          <div
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-start',
              justifyContent: 'center', zIndex: 1000, padding: '60px 16px 16px',
              overflowY: 'auto',
            }}
            onClick={() => setShowInviteModal(false)}
          >
            <div
              style={{
                background: COLORS.card, borderRadius: 20, padding: 20,
                width: '100%', maxWidth: 380, maxHeight: '80vh', display: 'flex',
                flexDirection: 'column',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontSize: 17, fontWeight: 700, color: COLORS.text, marginBottom: 4, margin: 0 }}>
                {'\uD83D\uDC65'} Добавить игрока
              </h3>
              <p style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 12, marginTop: 4 }}>
                Выберите игрока из списка или найдите по имени
              </p>

              <input
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                placeholder="Поиск по имени или username..."
                autoFocus
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 12,
                  border: `1px solid ${COLORS.border}`, background: COLORS.surface,
                  color: COLORS.text, fontSize: 14, fontFamily: 'inherit',
                  outline: 'none', boxSizing: 'border-box', marginBottom: 8,
                }}
              />

              {/* Rating filter */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
                {[
                  { value: 'all', label: 'Все' },
                  { value: '0-1200', label: '< 1200' },
                  { value: '1200-1500', label: '1200–1500' },
                  { value: '1500-1800', label: '1500–1800' },
                  { value: '1800-9999', label: '1800+' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleRatingFilter(opt.value)}
                    style={{
                      padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                      cursor: 'pointer', border: 'none',
                      background: ratingFilter === opt.value ? COLORS.accent : COLORS.surface,
                      color: ratingFilter === opt.value ? '#000' : COLORS.textDim,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
                {searchLoading && (
                  <p style={{ fontSize: 13, color: COLORS.textDim, textAlign: 'center', padding: 20 }}>Загрузка...</p>
                )}

                {!searchLoading && filteredResults.length === 0 && (
                  <p style={{ fontSize: 13, color: COLORS.textDim, textAlign: 'center', padding: 20 }}>
                    Никого не найдено
                  </p>
                )}

                {filteredResults.map((u) => {
                  const level = getLevel(u.rating);
                  return (
                    <div
                      key={u.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                        borderRadius: 12, marginBottom: 4, background: `${COLORS.bg}80`,
                        cursor: 'pointer',
                      }}
                      onClick={() => handleAddPlayer(match.id, u.id)}
                    >
                      <Avatar src={u.photoUrl} name={u.firstName} size={36} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, color: COLORS.text, fontWeight: 600 }}>
                          {u.firstName} {u.lastName || ''}
                        </div>
                        <div style={{ fontSize: 11, color: COLORS.textDim }}>
                          {level?.name || ''} {u.username ? `@${u.username}` : ''}
                        </div>
                      </div>
                      <div style={{
                        padding: '3px 8px', borderRadius: 8,
                        background: `${COLORS.accent}15`,
                      }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.accent }}>{u.rating}</span>
                      </div>
                      <span style={{ fontSize: 18, color: COLORS.accent }}>{'\u2795'}</span>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setShowInviteModal(false)}
                style={{
                  marginTop: 12, padding: '10px 0', borderRadius: 12,
                  border: `1px solid ${COLORS.border}`, background: 'transparent',
                  color: COLORS.textDim, fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', width: '100%',
                }}
              >
                Закрыть
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // List view
  return (
    <div style={{ paddingBottom: 80 }}>
      <Header title="Матчи" subtitle="Найди игру или создай свою" />

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <FilterTabs
            options={[
              { value: 'recruiting', label: 'Идёт набор' },
              { value: 'full', label: 'Набраны' },
              { value: 'all', label: 'Все' },
            ]}
            value={filter}
            onChange={setFilter}
          />
        </div>
        <Button size="sm" onClick={() => onNavigate('createMatch')}>
          + Создать
        </Button>
      </div>

      {loading && (
        <p style={{ textAlign: 'center', color: COLORS.textDim, padding: 40 }}>Загрузка...</p>
      )}

      {!loading && matches.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <span style={{ fontSize: 48 }}>{'\u{1F3BE}'}</span>
          <p style={{ color: COLORS.textDim, marginTop: 12 }}>Матчей пока нет</p>
          <Button onClick={() => onNavigate('createMatch')} style={{ marginTop: 16 }}>
            Создать первый матч
          </Button>
        </div>
      )}

      {matches.map((match) => {
        const approvedPlayers = match.players?.filter((p) => p.status === 'APPROVED') || [];
        const pendingPlayers = match.players?.filter((p) => p.status === 'PENDING') || [];
        const isHighlighted = highlightMatchId === match.id;
        const date = new Date(match.date);
        const myPlayer = match.players?.find((p) => p.user.id === user?.id);
        const isCreator = match.creatorId === user?.id;

        return (
          <Card
            key={match.id}
            onClick={() => setSelectedMatch(match)}
            style={{
              marginBottom: 10, cursor: 'pointer',
              ...(isHighlighted ? { border: `1px solid ${COLORS.accent}`, boxShadow: `0 0 12px ${COLORS.accent}30` } : {}),
            }}
          >
            {/* Top row: date + badges */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>
                  {date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                </span>
                <span style={{ fontSize: 14, color: COLORS.accent, fontWeight: 600 }}>
                  {date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  {match.durationMin > 0 && (
                    <span style={{ color: COLORS.textDim, fontWeight: 500 }}>
                      {' — '}{new Date(date.getTime() + match.durationMin * 60000).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <Badge variant="default">{match.durationMin} мин</Badge>
                {match.courtBooked && <Badge variant="success">{'\u2705'}</Badge>}
              </div>
            </div>

            {/* Venue */}
            <div style={{ fontSize: 13, color: COLORS.textDim, marginBottom: 8 }}>
              {'\uD83D\uDCCD'} {match.venue?.name}
            </div>

            {/* Player avatars row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
              {approvedPlayers.map((p) => (
                <Avatar key={p.user.id} src={p.user.photoUrl} name={p.user.firstName} size={30} />
              ))}
              {approvedPlayers.length < 4 && Array.from({ length: 4 - approvedPlayers.length }).map((_, i) => (
                <div key={`empty-${i}`} style={{
                  width: 30, height: 30, borderRadius: 15,
                  border: `2px dashed ${COLORS.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, color: COLORS.textMuted,
                }}>+</div>
              ))}
              <span style={{ fontSize: 12, color: COLORS.textDim, marginLeft: 6 }}>
                {approvedPlayers.length}/4
              </span>
              {pendingPlayers.length > 0 && isCreator && (
                <Badge variant="warning" style={{ marginLeft: 'auto' }}>{pendingPlayers.length} {'\uD83D\uDCE8'}</Badge>
              )}
            </div>

            {/* Score display for completed matches */}
            {match.status === 'COMPLETED' && match.sets?.length > 0 && (
              <div style={{
                display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8,
                padding: '6px 10px', borderRadius: 10, background: `${COLORS.accent}08`,
                border: `1px solid ${COLORS.accent}20`,
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.accent }}>{'\u2705'} Счёт:</span>
                {match.sets.sort((a, b) => a.setNumber - b.setNumber).map((s) => (
                  <span key={s.setNumber} style={{ fontSize: 14, fontWeight: 800, color: COLORS.text }}>
                    {s.team1Score}:{s.team2Score}
                  </span>
                ))}
              </div>
            )}

            {/* Bottom row: level + type + indicator + countdown */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <Badge variant="accent">{getLevelByValue(match.levelMin).category}-{getLevelByValue(match.levelMax).category}</Badge>
              {match.matchType === 'FRIENDLY' && <Badge variant="default">{'\uD83D\uDE0A'}</Badge>}
              {match.status === 'PENDING_CONFIRMATION' && (
                <Badge variant="warning" style={{ marginLeft: 'auto' }}>{'\u23F3'} Проверка</Badge>
              )}
              {match.status === 'COMPLETED' && (
                <Badge variant="success" style={{ marginLeft: 'auto' }}>{'\u2705'} Завершён</Badge>
              )}
              {myPlayer && myPlayer.status === 'APPROVED' && ['RECRUITING', 'FULL'].includes(match.status) && new Date(match.date) > new Date() && (
                <span style={{ marginLeft: 'auto' }}>
                  <CountdownTimer targetDate={match.date} compact />
                </span>
              )}
              {myPlayer && !['PENDING_CONFIRMATION', 'COMPLETED'].includes(match.status) && !(myPlayer.status === 'APPROVED' && ['RECRUITING', 'FULL'].includes(match.status) && new Date(match.date) > new Date()) && (
                <span style={{ fontSize: 11, color: myPlayer.status === 'INVITED' ? COLORS.purple : COLORS.accent, marginLeft: 'auto', fontWeight: 600 }}>
                  {myPlayer.status === 'PENDING' ? '\u23F3 Заявка' : myPlayer.status === 'INVITED' ? '\uD83D\uDCE9 Приглашение' : '\u2705 Вы в матче'}
                </span>
              )}
              <span style={{ fontSize: 14, color: COLORS.textDim, marginLeft: myPlayer ? 0 : 'auto' }}>{'\u203A'}</span>
            </div>
          </Card>
        );
      })}

      {/* Edit match modal */}
      <Modal isOpen={!!editingMatch} title="Редактировать матч" onClose={() => setEditingMatch(null)}>
        <EditMatchForm editForm={editForm} setEditForm={setEditForm} onSave={handleEditSave} onClose={() => setEditingMatch(null)} />
      </Modal>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <span style={{ fontSize: 16, width: 24, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 12, color: COLORS.textDim }}>{label}</div>
        <div style={{ fontSize: 14, color: COLORS.text, fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  );
}

function PlayerRowBig({ player, isCreator, onPlayerClick }) {
  const level = getLevel(player.user.rating);
  return (
    <div
      onClick={() => onPlayerClick && onPlayerClick(player.user.id)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
        padding: '8px 10px', borderRadius: 12, background: `${COLORS.bg}80`,
        borderLeft: `3px solid ${COLORS.accent}40`,
        cursor: onPlayerClick ? 'pointer' : 'default',
        transition: 'background 0.15s',
      }}
    >
      <Avatar src={player.user.photoUrl} name={player.user.firstName} size={38} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, color: COLORS.text, fontWeight: 600 }}>
          {player.user.firstName} {player.user.lastName || ''}
          {isCreator && (
            <span style={{
              fontSize: 10, fontWeight: 700, marginLeft: 6, padding: '1px 5px',
              borderRadius: 4, background: `${COLORS.accent}20`, color: COLORS.accent,
            }}>ORG</span>
          )}
        </div>
        <div style={{ fontSize: 12, color: COLORS.textDim }}>
          {level?.name || ''}
        </div>
      </div>
      <div style={{
        padding: '4px 8px', borderRadius: 8,
        background: `${COLORS.accent}15`, textAlign: 'center',
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.accent }}>{player.user.rating}</div>
      </div>
    </div>
  );
}

function EmptySlotBig() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
      padding: '8px 10px', borderRadius: 12, border: `2px dashed ${COLORS.border}`,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 19,
        border: `2px dashed ${COLORS.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, color: COLORS.textMuted,
      }}>+</div>
      <span style={{ fontSize: 14, color: COLORS.textMuted }}>Свободное место</span>
    </div>
  );
}

function EditMatchForm({ editForm, setEditForm, onSave, onClose }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Input
        label="Дата и время"
        type="datetime-local"
        value={editForm.date || ''}
        onChange={(val) => setEditForm({ ...editForm, date: val })}
      />
      <Select
        label="Длительность"
        value={editForm.durationMin}
        onChange={(val) => setEditForm({ ...editForm, durationMin: parseInt(val) })}
        options={[
          { value: 60, label: '1 час' },
          { value: 90, label: '1.5 часа' },
          { value: 120, label: '2 часа' },
          { value: 150, label: '2.5 часа' },
          { value: 180, label: '3 часа' },
        ]}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <Select
          label="Мин. уровень"
          value={editForm.levelMin}
          onChange={(val) => setEditForm({ ...editForm, levelMin: parseFloat(val) })}
          options={LEVELS.map((l) => ({ value: l.level, label: `${l.category} — ${l.name}` }))}
        />
        <Select
          label="Макс. уровень"
          value={editForm.levelMax}
          onChange={(val) => setEditForm({ ...editForm, levelMax: parseFloat(val) })}
          options={LEVELS.map((l) => ({ value: l.level, label: `${l.category} — ${l.name}` }))}
        />
      </div>
      <Select
        label="Тип матча"
        value={editForm.matchType}
        onChange={(val) => setEditForm({ ...editForm, matchType: val })}
        options={[
          { value: 'RATED', label: 'Рейтинговый' },
          { value: 'FRIENDLY', label: 'Дружеский' },
        ]}
      />
      <Input
        label="Заметки"
        value={editForm.notes || ''}
        onChange={(val) => setEditForm({ ...editForm, notes: val })}
        placeholder="Заметки..."
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <Button onClick={onSave} fullWidth>Сохранить</Button>
        <Button variant="outline" onClick={onClose} fullWidth>Отмена</Button>
      </div>
    </div>
  );
}
