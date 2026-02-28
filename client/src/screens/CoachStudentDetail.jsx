import React, { useEffect, useState } from 'react';
import { COLORS, getLevel } from '../config';
import { Card } from '../components/ui/Card';
import { Header } from '../components/ui/Header';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { RatingChart } from '../components/ui/RatingChart';
import { api } from '../services/api';

export function CoachStudentDetail({ studentId, onBack, onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('stats');

  useEffect(() => {
    loadData();
  }, [studentId]);

  async function loadData() {
    try {
      const result = await api.coach.studentDetail(studentId);
      setData(result);
    } catch (err) {
      console.error('Load student detail error:', err);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div>
        <Header title="Ученик" onBack={onBack} />
        <div style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: COLORS.textDim }}>Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <Header title="Ученик" onBack={onBack} />
        <div style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: COLORS.danger }}>Ученик не найден</p>
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'stats', label: 'Статистика' },
    { id: 'matches', label: 'Матчи' },
    { id: 'notes', label: 'Заметки' },
    { id: 'payments', label: 'Оплаты' },
  ];

  return (
    <div>
      <Header title={`${data.firstName} ${data.lastName || ''}`} onBack={onBack} />

      {/* Student profile card */}
      <Card glow style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Avatar src={data.photoUrl} name={data.firstName} size={56} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>
                {data.firstName} {data.lastName || ''}
              </span>
              {data.isVip && <Badge style={{ background: `${COLORS.gold || '#FFD700'}25`, color: COLORS.gold || '#FFD700' }}>{'\u2B50'} VIP</Badge>}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <Badge variant="accent">{data.levelCategory} — {data.levelName}</Badge>
              {data.hand && <Badge>{data.hand === 'RIGHT' ? 'Правша' : 'Левша'}</Badge>}
              {data.position && (
                <Badge>
                  {data.position === 'DERECHA' ? 'Справа' : data.position === 'REVES' ? 'Слева' : 'Обе'}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Rating + growth */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <span style={{ fontSize: 28, fontWeight: 800, color: COLORS.accent }}>{data.rating}</span>
            <span style={{ fontSize: 14, color: COLORS.textDim, marginLeft: 8 }}>ELO</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{
              fontSize: 16,
              fontWeight: 700,
              color: data.ratingGrowth >= 0 ? COLORS.accent : COLORS.danger,
            }}>
              {data.ratingGrowth >= 0 ? '+' : ''}{data.ratingGrowth}
            </span>
            <p style={{ fontSize: 11, color: COLORS.textDim, margin: 0 }}>
              с начала (было {data.startRating})
            </p>
          </div>
        </div>
      </Card>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
        <MiniStat label="Матчей" value={data.matchesPlayed} />
        <MiniStat label="Побед" value={`${data.winRate}%`} color={COLORS.accent} />
        <MiniStat label="W/L" value={`${data.wins}/${data.losses}`} />
        <MiniStat label="Стрик" value={data.winStreak} color={data.winStreak > 0 ? COLORS.accent : COLORS.textDim} />
      </div>

      {/* Rating chart */}
      {data.ratingHistory && data.ratingHistory.length > 1 && (
        <Card style={{ marginBottom: 12 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: COLORS.textDim, marginBottom: 8 }}>
            Динамика рейтинга
          </h4>
          <RatingChart data={data.ratingHistory} />
        </Card>
      )}

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {sections.map((sec) => (
          <button
            key={sec.id}
            onClick={() => setActiveSection(sec.id)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: 'none',
              background: activeSection === sec.id ? COLORS.accent : COLORS.surface,
              color: activeSection === sec.id ? COLORS.bg : COLORS.textDim,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {/* Achievements */}
      {activeSection === 'stats' && (
        <div>
          {data.achievements && data.achievements.length > 0 && (
            <Card style={{ marginBottom: 12 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: COLORS.textDim, marginBottom: 8 }}>
                Достижения ({data.achievements.length})
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {data.achievements.map((a) => (
                  <Badge key={a.id} title={a.description}>
                    {a.icon} {a.name}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Experience info */}
          <Card style={{ marginBottom: 12 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: COLORS.textDim, marginBottom: 8 }}>
              Информация
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: COLORS.textDim }}>Опыт</span>
                <span style={{ color: COLORS.text }}>
                  {data.experience === 'BEGINNER' ? 'Начинающий' :
                   data.experience === 'LESS_YEAR' ? 'До года' :
                   data.experience === 'ONE_THREE' ? '1-3 года' :
                   data.experience === 'THREE_PLUS' ? '3+ года' : '—'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: COLORS.textDim }}>Макс. стрик</span>
                <span style={{ color: COLORS.text }}>{data.maxWinStreak}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: COLORS.textDim }}>Ученик с</span>
                <span style={{ color: COLORS.text }}>
                  {new Date(data.linkedAt).toLocaleDateString('ru-RU')}
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Match history */}
      {activeSection === 'matches' && (
        <div>
          {data.matchHistory && data.matchHistory.length > 0 ? (
            data.matchHistory.map((match) => {
              const isCompleted = match.status === 'COMPLETED';
              let won = false;
              if (isCompleted && match.sets && match.sets.length > 0 && match.myTeam) {
                const team1Wins = match.sets.filter((s) => s.team1Score > s.team2Score).length;
                const team2Wins = match.sets.filter((s) => s.team2Score > s.team1Score).length;
                won = (match.myTeam === 1 && team1Wins > team2Wins) || (match.myTeam === 2 && team2Wins > team1Wins);
              }

              return (
                <Card key={match.id} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: COLORS.textDim }}>
                      {new Date(match.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                      {' '}
                      {new Date(match.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isCompleted && (
                      <Badge variant={won ? 'accent' : 'danger'} style={{ fontSize: 11 }}>
                        {won ? 'Победа' : 'Поражение'}
                      </Badge>
                    )}
                    {!isCompleted && <Badge style={{ fontSize: 11 }}>{match.status}</Badge>}
                  </div>
                  <p style={{ fontSize: 12, color: COLORS.textDim, margin: 0 }}>
                    {match.venue?.name || '—'}
                  </p>
                  {match.sets && match.sets.length > 0 && (
                    <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, marginTop: 4, margin: 0 }}>
                      {match.sets.map((s) => `${s.team1Score}-${s.team2Score}`).join(' · ')}
                    </p>
                  )}
                </Card>
              );
            })
          ) : (
            <Card style={{ textAlign: 'center', padding: 24 }}>
              <p style={{ color: COLORS.textDim, fontSize: 13 }}>Нет матчей</p>
            </Card>
          )}
        </div>
      )}

      {/* Notes */}
      {activeSection === 'notes' && (
        <NotesSection studentId={studentId} notes={data.notes || []} onRefresh={loadData} />
      )}

      {/* Payments */}
      {activeSection === 'payments' && (
        <PaymentsSection studentId={studentId} />
      )}
    </div>
  );
}

// === Notes Section ===
function NotesSection({ studentId, notes: initialNotes, onRefresh }) {
  const [notes, setNotes] = useState(initialNotes);
  const [showAddModal, setShowAddModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isHomework, setIsHomework] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleAddNote() {
    if (!noteText.trim()) return;
    setSaving(true);
    try {
      await api.coach.addNote(studentId, { text: noteText, isHomework });
      setShowAddModal(false);
      setNoteText('');
      setIsHomework(false);
      // Reload notes
      const fresh = await api.coach.getNotes(studentId);
      setNotes(fresh);
    } catch (err) {
      alert(err.message || 'Ошибка');
    }
    setSaving(false);
  }

  async function handleDeleteNote(noteId) {
    if (!confirm('Удалить заметку?')) return;
    try {
      await api.coach.deleteNote(noteId);
      setNotes(notes.filter((n) => n.id !== noteId));
    } catch (err) {
      alert(err.message || 'Ошибка');
    }
  }

  return (
    <div>
      <Button fullWidth variant="secondary" onClick={() => setShowAddModal(true)} style={{ marginBottom: 12 }}>
        {'\u2795'} Добавить заметку
      </Button>

      {notes.length > 0 ? (
        notes.map((note) => (
          <Card key={note.id} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: COLORS.textDim }}>
                {new Date(note.createdAt).toLocaleDateString('ru-RU')}
              </span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {note.isHomework && (
                  <Badge variant="warning" style={{ fontSize: 11 }}>{'\u{1F4DD}'} Домашка</Badge>
                )}
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  style={{ background: 'none', border: 'none', color: COLORS.textDim, fontSize: 14, cursor: 'pointer', padding: 2 }}
                >
                  {'\u{1F5D1}'}
                </button>
              </div>
            </div>
            <p style={{ fontSize: 13, color: COLORS.text, margin: 0, whiteSpace: 'pre-wrap' }}>
              {note.text}
            </p>
          </Card>
        ))
      ) : (
        <Card style={{ textAlign: 'center', padding: 24 }}>
          <span style={{ fontSize: 36, display: 'block', marginBottom: 8 }}>{'\u{1F4DD}'}</span>
          <p style={{ color: COLORS.textDim, fontSize: 13 }}>Нет заметок</p>
          <p style={{ color: COLORS.textDim, fontSize: 12 }}>
            Добавьте заметку или домашнее задание для ученика
          </p>
        </Card>
      )}

      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setNoteText(''); setIsHomework(false); }}
        title="Новая заметка"
      >
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Текст заметки..."
          rows={4}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 10,
            border: `1px solid ${COLORS.border}`,
            background: COLORS.surface,
            color: COLORS.text,
            fontSize: 14,
            resize: 'vertical',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />

        <div
          onClick={() => setIsHomework(!isHomework)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 0',
            cursor: 'pointer',
          }}
        >
          <div style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            border: `2px solid ${isHomework ? COLORS.warning : COLORS.border}`,
            background: isHomework ? `${COLORS.warning}30` : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
          }}>
            {isHomework ? '\u2705' : ''}
          </div>
          <span style={{ fontSize: 14, color: COLORS.text }}>
            {'\u{1F4DD}'} Домашнее задание
          </span>
          <span style={{ fontSize: 12, color: COLORS.textDim }}>
            (ученик получит уведомление)
          </span>
        </div>

        <Button
          fullWidth
          onClick={handleAddNote}
          disabled={saving || !noteText.trim()}
          style={{ marginTop: 8 }}
        >
          {saving ? 'Сохранение...' : 'Добавить'}
        </Button>
      </Modal>
    </div>
  );
}

// === Payments Section ===
function PaymentsSection({ studentId }) {
  const [balance, setBalance] = useState(null);
  const [payments, setPayments] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', note: '', status: 'AWAITING' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPayments();
  }, [studentId]);

  async function loadPayments() {
    try {
      const [bal, pays, pkgs] = await Promise.all([
        api.coach.studentBalance(studentId),
        api.coach.payments({ studentId }),
        api.coach.packages({ studentId }),
      ]);
      setBalance(bal);
      setPayments(pays);
      setPackages(pkgs);
    } catch (err) {
      console.error('Load payments error:', err);
    }
    setLoading(false);
  }

  async function handleCreatePayment() {
    if (!paymentForm.amount) return;
    setSaving(true);
    try {
      await api.coach.createPayment({
        studentId,
        amount: Math.round(parseFloat(paymentForm.amount) * 100),
        note: paymentForm.note || null,
        status: paymentForm.status,
      });
      setShowPaymentModal(false);
      setPaymentForm({ amount: '', note: '', status: 'AWAITING' });
      await loadPayments();
    } catch (err) {
      alert(err.message || 'Ошибка');
    }
    setSaving(false);
  }

  async function handleMarkPaid(paymentId) {
    try {
      await api.coach.updatePayment(paymentId, { status: 'PAID' });
      await loadPayments();
    } catch (err) {
      alert(err.message || 'Ошибка');
    }
  }

  if (loading) {
    return <p style={{ color: COLORS.textDim, textAlign: 'center', padding: 20 }}>Загрузка...</p>;
  }

  return (
    <div>
      {/* Balance summary */}
      {balance && (
        <Card style={{ marginBottom: 12, background: `linear-gradient(135deg, ${COLORS.accent}08, ${COLORS.purple}08)` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
            <div>
              <p style={{ fontSize: 16, fontWeight: 800, color: COLORS.accent, margin: 0 }}>
                {formatBYN(balance.totalPaid)}
              </p>
              <p style={{ fontSize: 10, color: COLORS.textDim, margin: 0 }}>Оплачено BYN</p>
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 800, color: balance.totalAwaiting > 0 ? COLORS.warning : COLORS.textDim, margin: 0 }}>
                {formatBYN(balance.totalAwaiting)}
              </p>
              <p style={{ fontSize: 10, color: COLORS.textDim, margin: 0 }}>Ожидает BYN</p>
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 800, color: COLORS.purple, margin: 0 }}>
                {balance.packageSessionsLeft}
              </p>
              <p style={{ fontSize: 10, color: COLORS.textDim, margin: 0 }}>Осталось тр.</p>
            </div>
          </div>
        </Card>
      )}

      <Button fullWidth variant="secondary" onClick={() => setShowPaymentModal(true)} style={{ marginBottom: 12 }}>
        {'\u2795'} Записать оплату
      </Button>

      {/* Active packages */}
      {packages.filter((p) => p.active).length > 0 && (
        <>
          <h4 style={{ fontSize: 13, fontWeight: 600, color: COLORS.textDim, marginBottom: 6 }}>
            {'\u{1F4E6}'} Активные пакеты
          </h4>
          {packages.filter((p) => p.active).map((pkg) => {
            const remaining = pkg.totalSessions - pkg.usedSessions;
            const progress = pkg.usedSessions / pkg.totalSessions;
            return (
              <Card key={pkg.id} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>
                    {formatBYN(pkg.priceTotal)} BYN · {pkg.totalSessions} тр.
                  </span>
                  <span style={{ fontSize: 12, color: remaining > 0 ? COLORS.accent : COLORS.danger }}>
                    Осталось: {remaining}
                  </span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: COLORS.surface, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(100, progress * 100)}%`,
                    borderRadius: 2,
                    background: COLORS.purple,
                  }} />
                </div>
              </Card>
            );
          })}
        </>
      )}

      {/* Payment history */}
      <h4 style={{ fontSize: 13, fontWeight: 600, color: COLORS.textDim, marginBottom: 6, marginTop: 8 }}>
        История оплат
      </h4>
      {payments.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 20 }}>
          <p style={{ color: COLORS.textDim, fontSize: 13 }}>Нет записей</p>
        </Card>
      ) : (
        payments.map((p) => {
          const statusColor = p.status === 'PAID' ? COLORS.accent : p.status === 'AWAITING' ? COLORS.warning : COLORS.danger;
          const statusLabel = p.status === 'PAID' ? '\u2705' : p.status === 'AWAITING' ? '\u23F3' : '\u21A9\uFE0F';
          return (
            <Card key={p.id} style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>{statusLabel}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>
                    {formatBYN(p.amount)} BYN
                  </span>
                  <span style={{ fontSize: 12, color: COLORS.textDim, marginLeft: 8 }}>
                    {new Date(p.createdAt).toLocaleDateString('ru-RU')}
                  </span>
                  {p.note && (
                    <p style={{ fontSize: 11, color: COLORS.textDim, margin: '2px 0 0', fontStyle: 'italic' }}>{p.note}</p>
                  )}
                </div>
                {p.status === 'AWAITING' && (
                  <button
                    onClick={() => handleMarkPaid(p.id)}
                    style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', padding: 4 }}
                  >{'\u2705'}</button>
                )}
              </div>
            </Card>
          );
        })
      )}

      {/* Payment modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => { setShowPaymentModal(false); setPaymentForm({ amount: '', note: '', status: 'AWAITING' }); }}
        title="Записать оплату"
      >
        <Input
          label="Сумма (BYN)"
          type="number"
          value={paymentForm.amount}
          onChange={(v) => setPaymentForm({ ...paymentForm, amount: v })}
          placeholder="0.00"
        />
        <Input
          label="Заметка"
          value={paymentForm.note}
          onChange={(v) => setPaymentForm({ ...paymentForm, note: v })}
          placeholder="За что оплата..."
        />
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          {[
            { value: 'AWAITING', label: '\u23F3 Ожидает' },
            { value: 'PAID', label: '\u2705 Оплачено' },
          ].map((s) => (
            <button
              key={s.value}
              onClick={() => setPaymentForm({ ...paymentForm, status: s.value })}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 8,
                border: `1px solid ${paymentForm.status === s.value ? COLORS.accent : COLORS.border}`,
                background: paymentForm.status === s.value ? `${COLORS.accent}20` : COLORS.surface,
                color: paymentForm.status === s.value ? COLORS.accent : COLORS.textDim,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
        <Button fullWidth onClick={handleCreatePayment} disabled={saving || !paymentForm.amount}>
          {saving ? 'Сохранение...' : 'Записать'}
        </Button>
      </Modal>
    </div>
  );
}

function formatBYN(kopeks) {
  if (!kopeks) return '0';
  return (kopeks / 100).toFixed(kopeks % 100 === 0 ? 0 : 2);
}

// Helper
function MiniStat({ label, value, color }) {
  return (
    <Card style={{ textAlign: 'center', padding: 8 }}>
      <p style={{ fontSize: 16, fontWeight: 700, color: color || COLORS.text, margin: 0 }}>{value}</p>
      <p style={{ fontSize: 10, color: COLORS.textDim, margin: 0 }}>{label}</p>
    </Card>
  );
}
