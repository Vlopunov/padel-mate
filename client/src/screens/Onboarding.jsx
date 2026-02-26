import React, { useState } from 'react';
import { COLORS, APP_NAME, CITIES, getLevel } from '../config';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { ToggleGroup } from '../components/ui/ToggleGroup';

const SURVEY_QUESTIONS = [
  {
    question: 'Как часто вы играете в падел?',
    options: ['Никогда', 'Пробовал(а)', 'Раз в неделю', '2-3 раза в неделю', 'Каждый день'],
  },
  {
    question: 'Опыт в ракеточных видах спорта?',
    options: ['Нет опыта', 'Теннис', 'Сквош', 'Бадминтон', 'Несколько видов'],
  },
  {
    question: 'Как вы оцениваете свою подачу?',
    options: ['Не умею подавать', 'Базовая подача', 'Стабильная', 'С вращением', 'Продвинутая'],
  },
  {
    question: 'Ваш уровень игры у стенки?',
    options: ['Не понимаю', 'Начинающий', 'Средний', 'Продвинутый', 'Эксперт'],
  },
  {
    question: 'Предпочитаемая позиция?',
    options: ['Не знаю', 'Derecha (правая)', 'Revés (левая)', 'Обе стороны'],
  },
  {
    question: 'Игровая рука?',
    options: ['Правша', 'Левша'],
  },
];

export function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [city, setCity] = useState('');
  const [hasExternalRating, setHasExternalRating] = useState(null);
  const [ratingSystem, setRatingSystem] = useState('');
  const [ratingValue, setRatingValue] = useState('');
  const [surveyAnswers, setSurveyAnswers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [hand, setHand] = useState(null);
  const [position, setPosition] = useState(null);
  const [calculatedRating, setCalculatedRating] = useState(null);

  const containerStyle = {
    maxWidth: 420,
    margin: '0 auto',
    padding: 20,
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  };

  const handleCitySelect = () => {
    if (city) setStep(2);
  };

  const handleExternalRating = () => {
    if (ratingSystem && ratingValue) {
      finishOnboarding('external');
    }
  };

  const handleSurveyAnswer = (answerIndex) => {
    const newAnswers = [...surveyAnswers, answerIndex];
    setSurveyAnswers(newAnswers);

    if (currentQuestion < SURVEY_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate rating
      const weights = [0.30, 0.15, 0.20, 0.25, 0.05, 0.05];
      const maxOptions = [4, 4, 4, 4, 3, 1];
      let weighted = 0;
      for (let i = 0; i < newAnswers.length; i++) {
        weighted += (newAnswers[i] / maxOptions[i]) * weights[i];
      }
      const rating = Math.round(1000 + weighted * 1000);
      setCalculatedRating(rating);
      setStep(3);
    }
  };

  const finishOnboarding = (source) => {
    const data = {
      city,
      hand: hand === 'RIGHT' ? 'RIGHT' : hand === 'LEFT' ? 'LEFT' : null,
      position,
    };

    if (source === 'external') {
      data.ratingSource = 'external';
      data.ratingSystem = ratingSystem;
      data.ratingValue = ratingValue;
    } else {
      data.surveyAnswers = surveyAnswers;
    }

    onComplete(data);
  };

  // Step 1: City
  if (step === 1) {
    return (
      <div style={containerStyle}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <span style={{ fontSize: 48 }}>{'\u{1F3F8}'}</span>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: COLORS.text, marginTop: 12 }}>
              {APP_NAME}
            </h1>
            <p style={{ color: COLORS.textDim, marginTop: 8, fontSize: 15 }}>
              Добро пожаловать в падел-сообщество!
            </p>
          </div>

          <h3 style={{ fontSize: 17, fontWeight: 600, color: COLORS.text, marginBottom: 16 }}>
            Выберите город
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {CITIES.map((c) => (
              <Card
                key={c.value}
                variant={city === c.value ? 'accent' : 'default'}
                onClick={() => setCity(c.value)}
                style={{ cursor: 'pointer', textAlign: 'center', padding: 18 }}
              >
                <span style={{ fontSize: 16, fontWeight: 600, color: city === c.value ? COLORS.accent : COLORS.text }}>
                  {c.label}
                </span>
              </Card>
            ))}
          </div>
        </div>

        <Button fullWidth onClick={handleCitySelect} disabled={!city} style={{ marginTop: 24 }}>
          Далее
        </Button>
      </div>
    );
  }

  // Step 2: Rating
  if (step === 2) {
    if (hasExternalRating === null) {
      return (
        <div style={containerStyle}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, marginBottom: 8 }}>
              Рейтинговая система
            </h3>
            <p style={{ color: COLORS.textDim, fontSize: 14, marginBottom: 24 }}>
              У вас есть аккаунт в Raceto, Playtomic или другой системе?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Card variant="accent" onClick={() => setHasExternalRating(true)} style={{ cursor: 'pointer', padding: 18 }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: COLORS.accent }}>
                  Да, у меня есть рейтинг
                </span>
              </Card>
              <Card onClick={() => setHasExternalRating(false)} style={{ cursor: 'pointer', padding: 18 }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: COLORS.text }}>
                  Нет, хочу пройти оценку
                </span>
              </Card>
            </div>
          </div>

          <Button variant="ghost" fullWidth onClick={() => setStep(1)} style={{ marginTop: 16 }}>
            Назад
          </Button>
        </div>
      );
    }

    if (hasExternalRating) {
      return (
        <div style={containerStyle}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, marginBottom: 20 }}>
              Введите ваш рейтинг
            </h3>

            <Select
              label="Система"
              value={ratingSystem}
              onChange={setRatingSystem}
              placeholder="Выберите систему"
              options={[
                { value: 'raceto', label: 'Raceto' },
                { value: 'playtomic', label: 'Playtomic' },
                { value: 'other', label: 'Другая' },
              ]}
            />

            <Input
              label="Рейтинг"
              value={ratingValue}
              onChange={setRatingValue}
              placeholder="Например: 3.5"
              type="number"
            />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <Button variant="ghost" onClick={() => setHasExternalRating(null)} style={{ flex: 1 }}>
              Назад
            </Button>
            <Button onClick={handleExternalRating} disabled={!ratingSystem || !ratingValue} style={{ flex: 2 }}>
              Продолжить
            </Button>
          </div>
        </div>
      );
    }

    // Survey
    const q = SURVEY_QUESTIONS[currentQuestion];
    return (
      <div style={containerStyle}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
            {SURVEY_QUESTIONS.map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  background: i <= currentQuestion ? COLORS.accent : COLORS.border,
                  transition: 'background 0.3s',
                }}
              />
            ))}
          </div>

          <p style={{ fontSize: 13, color: COLORS.textDim, marginBottom: 4 }}>
            Вопрос {currentQuestion + 1} из {SURVEY_QUESTIONS.length}
          </p>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, marginBottom: 20 }}>
            {q.question}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {q.options.map((opt, idx) => (
              <Card
                key={idx}
                onClick={() => handleSurveyAnswer(idx)}
                style={{ cursor: 'pointer', padding: 16 }}
              >
                <span style={{ fontSize: 15, color: COLORS.text }}>{opt}</span>
              </Card>
            ))}
          </div>
        </div>

        <Button
          variant="ghost"
          fullWidth
          onClick={() => {
            if (currentQuestion > 0) {
              setSurveyAnswers(surveyAnswers.slice(0, -1));
              setCurrentQuestion(currentQuestion - 1);
            } else {
              setHasExternalRating(null);
            }
          }}
          style={{ marginTop: 16 }}
        >
          Назад
        </Button>
      </div>
    );
  }

  // Step 3: Preferences + Result
  if (step === 3) {
    const rating = calculatedRating || 1200;
    const level = getLevel(rating);

    return (
      <div style={containerStyle}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                background: COLORS.accentGlow,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                border: `2px solid ${COLORS.accent}`,
              }}
            >
              <span style={{ fontSize: 36, fontWeight: 800, color: COLORS.accent }}>{rating}</span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: COLORS.text }}>Ваш начальный рейтинг</h2>
            <p style={{ color: COLORS.accent, fontSize: 16, fontWeight: 600, marginTop: 4 }}>
              {level.level} — {level.name}
            </p>
          </div>

          <Card style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: COLORS.textDim, marginBottom: 12 }}>
              Игровые предпочтения (необязательно)
            </p>

            <p style={{ fontSize: 14, color: COLORS.text, marginBottom: 8, fontWeight: 500 }}>Рука</p>
            <ToggleGroup
              options={[
                { value: 'RIGHT', label: 'Правша' },
                { value: 'LEFT', label: 'Левша' },
              ]}
              value={hand}
              onChange={setHand}
              allowDeselect
            />

            <p style={{ fontSize: 14, color: COLORS.text, marginBottom: 8, marginTop: 16, fontWeight: 500 }}>
              Позиция
            </p>
            <ToggleGroup
              options={[
                { value: 'DERECHA', label: 'Derecha' },
                { value: 'REVES', label: 'Revés' },
                { value: 'BOTH', label: 'Обе' },
              ]}
              value={position}
              onChange={setPosition}
              allowDeselect
            />
          </Card>
        </div>

        <Button fullWidth onClick={() => finishOnboarding('survey')} size="lg">
          {'\u{1F3BE}'} Начать играть!
        </Button>
      </div>
    );
  }

  return null;
}
