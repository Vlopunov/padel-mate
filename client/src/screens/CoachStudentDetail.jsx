import React, { useEffect, useState } from 'react';
import { COLORS, getLevel } from '../config';
import { Card } from '../components/ui/Card';
import { Header } from '../components/ui/Header';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
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
        <div>
          {data.notes && data.notes.length > 0 ? (
            data.notes.map((note) => (
              <Card key={note.id} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: COLORS.textDim }}>
                    {new Date(note.createdAt).toLocaleDateString('ru-RU')}
                  </span>
                  {note.isHomework && (
                    <Badge variant="warning" style={{ fontSize: 11 }}>{'\u{1F4DD}'} Домашка</Badge>
                  )}
                </div>
                <p style={{ fontSize: 13, color: COLORS.text, margin: 0, whiteSpace: 'pre-wrap' }}>
                  {note.text}
                </p>
              </Card>
            ))
          ) : (
            <Card style={{ textAlign: 'center', padding: 24 }}>
              <p style={{ color: COLORS.textDim, fontSize: 13 }}>Нет заметок</p>
              <p style={{ color: COLORS.textMuted, fontSize: 12 }}>Заметки появятся в Фазе 4</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
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
