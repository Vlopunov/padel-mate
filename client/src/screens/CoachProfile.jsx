import React, { useEffect, useState } from 'react';
import { COLORS } from '../config';
import { Card } from '../components/ui/Card';
import { Header } from '../components/ui/Header';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { Modal } from '../components/ui/Modal';
import { api } from '../services/api';

export function CoachProfile({ coachId, currentUser, onBack, onNavigate }) {
  const [coach, setCoach] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCoach();
  }, [coachId]);

  async function loadCoach() {
    try {
      const data = await api.coaches.getById(coachId);
      setCoach(data);
    } catch (err) {
      console.error('Load coach error:', err);
    }
    setLoading(false);
  }

  async function handleSubmitReview() {
    setSaving(true);
    try {
      await api.coaches.writeReview(coachId, { rating: reviewRating, text: reviewText || null });
      setShowReviewModal(false);
      setReviewRating(5);
      setReviewText('');
      await loadCoach();
    } catch (err) {
      alert(err.message || 'Ошибка');
    }
    setSaving(false);
  }

  function formatBYN(kopeks) {
    if (!kopeks) return '0';
    return (kopeks / 100).toFixed(kopeks % 100 === 0 ? 0 : 2);
  }

  if (loading) {
    return (
      <div>
        <Header title="Тренер" onBack={onBack} />
        <p style={{ color: COLORS.textDim, textAlign: 'center', padding: 40 }}>Загрузка...</p>
      </div>
    );
  }

  if (!coach) {
    return (
      <div>
        <Header title="Тренер" onBack={onBack} />
        <Card style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: COLORS.danger }}>Тренер не найден</p>
        </Card>
      </div>
    );
  }

  const existingReview = coach.reviews?.find((r) => r.authorId === currentUser?.id);
  const canReview = currentUser && currentUser.id !== coachId;

  return (
    <div>
      <Header title={`${coach.firstName} ${coach.lastName || ''}`} onBack={onBack} />

      {/* Profile card */}
      <Card glow style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
          <Avatar src={coach.photoUrl} name={coach.firstName} size={64} />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: COLORS.text, margin: 0 }}>
              {coach.firstName} {coach.lastName || ''}
            </h2>
            {coach.specialization && (
              <p style={{ fontSize: 13, color: COLORS.purple, fontWeight: 600, margin: '4px 0' }}>
                {coach.specialization}
              </p>
            )}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
              {coach.rating && (
                <Badge style={{ background: `${COLORS.gold || '#FFD700'}20`, color: COLORS.gold || '#FFD700' }}>
                  {'\u2B50'} {coach.rating.toFixed(1)} ({coach.reviewCount})
                </Badge>
              )}
              {coach.hourlyRate > 0 && (
                <Badge>{formatBYN(coach.hourlyRate)} BYN/час</Badge>
              )}
            </div>
          </div>
        </div>

        {coach.bio && (
          <p style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.5, marginBottom: 12 }}>
            {coach.bio}
          </p>
        )}

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: COLORS.accent, margin: 0 }}>{coach.studentCount}</p>
            <p style={{ fontSize: 10, color: COLORS.textDim, margin: 0 }}>Учеников</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: COLORS.purple, margin: 0 }}>{coach.completedSessions}</p>
            <p style={{ fontSize: 10, color: COLORS.textDim, margin: 0 }}>Тренировок</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, margin: 0 }}>{coach.playerRating}</p>
            <p style={{ fontSize: 10, color: COLORS.textDim, margin: 0 }}>ELO</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, margin: 0 }}>{coach.wins}</p>
            <p style={{ fontSize: 10, color: COLORS.textDim, margin: 0 }}>Побед</p>
          </div>
        </div>
      </Card>

      {/* Experience & Certificates */}
      {(coach.experience || coach.certificates) && (
        <Card style={{ marginBottom: 12 }}>
          {coach.experience && (
            <div style={{ marginBottom: coach.certificates ? 8 : 0 }}>
              <p style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 4 }}>Опыт</p>
              <p style={{ fontSize: 13, color: COLORS.text, margin: 0 }}>{coach.experience}</p>
            </div>
          )}
          {coach.certificates && (
            <div>
              <p style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 4 }}>Сертификаты</p>
              <p style={{ fontSize: 13, color: COLORS.text, margin: 0 }}>{coach.certificates}</p>
            </div>
          )}
        </Card>
      )}

      {/* Upcoming sessions */}
      {coach.upcomingSessions && coach.upcomingSessions.length > 0 && (
        <>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: COLORS.text, marginBottom: 8 }}>
            {'\u{1F4C5}'} Ближайшие тренировки
          </h3>
          {coach.upcomingSessions.map((s) => {
            const d = new Date(s.date);
            const dateStr = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
            const timeStr = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            const spots = s.maxStudents - s.bookedCount;
            return (
              <Card key={s.id} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, margin: 0 }}>
                      {dateStr}, {timeStr}
                    </p>
                    <p style={{ fontSize: 12, color: COLORS.textDim, margin: '2px 0 0' }}>
                      {s.type === 'GROUP' ? 'Групповая' : 'Индивидуальная'} · {s.durationMin} мин
                      {s.venue ? ` · ${s.venue.name}` : ''}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {s.price > 0 && (
                      <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.accent, margin: 0 }}>
                        {formatBYN(s.price)} BYN
                      </p>
                    )}
                    <p style={{ fontSize: 11, color: spots > 0 ? COLORS.accent : COLORS.danger, margin: 0 }}>
                      {spots > 0 ? `${spots} мест` : 'Нет мест'}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
          <div style={{ marginBottom: 16 }} />
        </>
      )}

      {/* Reviews */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: COLORS.text, margin: 0 }}>
          {'\u{1F4AC}'} Отзывы ({coach.reviewCount || 0})
        </h3>
        {canReview && (
          <Button size="sm" variant="outline" onClick={() => setShowReviewModal(true)}>
            {existingReview ? 'Изменить' : 'Написать'}
          </Button>
        )}
      </div>

      {(!coach.reviews || coach.reviews.length === 0) ? (
        <Card style={{ textAlign: 'center', padding: 24, marginBottom: 12 }}>
          <p style={{ color: COLORS.textDim, fontSize: 13 }}>Пока нет отзывов</p>
          {canReview && (
            <p style={{ color: COLORS.textDim, fontSize: 12 }}>
              Будьте первым!
            </p>
          )}
        </Card>
      ) : (
        coach.reviews.map((review) => (
          <Card key={review.id} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Avatar src={review.author?.photoUrl} name={review.author?.firstName} size={28} />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>
                  {review.author?.firstName} {review.author?.lastName || ''}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 2 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} style={{ fontSize: 12, color: i < review.rating ? '#FFD700' : COLORS.border }}>
                    {'\u2B50'}
                  </span>
                ))}
              </div>
            </div>
            {review.text && (
              <p style={{ fontSize: 13, color: COLORS.text, margin: 0, lineHeight: 1.4 }}>
                {review.text}
              </p>
            )}
            <p style={{ fontSize: 11, color: COLORS.textDim, margin: '4px 0 0' }}>
              {new Date(review.createdAt).toLocaleDateString('ru-RU')}
            </p>
          </Card>
        ))
      )}

      {/* Review modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => { setShowReviewModal(false); setReviewText(''); setReviewRating(existingReview?.rating || 5); }}
        title={existingReview ? 'Изменить отзыв' : 'Написать отзыв'}
      >
        <p style={{ fontSize: 13, color: COLORS.textDim, marginBottom: 8 }}>Оценка</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, justifyContent: 'center' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setReviewRating(star)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 32,
                cursor: 'pointer',
                color: star <= reviewRating ? '#FFD700' : COLORS.border,
                transition: 'transform 0.15s',
                transform: star <= reviewRating ? 'scale(1.1)' : 'scale(1)',
                padding: 0,
              }}
            >
              {'\u2B50'}
            </button>
          ))}
        </div>

        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Ваш отзыв (необязательно)..."
          rows={3}
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

        <Button
          fullWidth
          onClick={handleSubmitReview}
          disabled={saving}
          style={{ marginTop: 12 }}
        >
          {saving ? 'Отправка...' : 'Отправить отзыв'}
        </Button>
      </Modal>
    </div>
  );
}
