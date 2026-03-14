import React, { useState, useEffect } from 'react';
import {
  Crown, BarChart3, Swords, Users, Trophy, Calendar, Star,
  Search, Bell, PenLine, ChevronRight, Check, Zap, Sparkles,
} from 'lucide-react';
import { COLORS } from '../config';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Header } from '../components/ui/Header';
import { useTelegram } from '../hooks/useTelegram';
import { api } from '../services/api';

const PRO_FEATURES = [
  { Icon: BarChart3, title: 'Advanced stats', desc: 'Graphs, patterns, monthly activity' },
  { Icon: Swords, title: 'Head-to-Head', desc: 'Personal stats against any player' },
  { Icon: Users, title: 'Pair details', desc: 'Detailed pair rating and history' },
  { Icon: Trophy, title: 'Leaderboard filters', desc: 'By month, by week, by region' },
  { Icon: Star, title: 'All achievements', desc: 'Full list with progress' },
  { Icon: Calendar, title: 'Calendar export', desc: 'Export match to .ics' },
  { Icon: Search, title: 'Priority search', desc: 'Appear higher in partner search' },
  { Icon: Crown, title: 'VIP badge', desc: 'Stand out in leaderboard and profiles' },
  { Icon: Bell, title: 'Weekly summary', desc: 'Detailed weekly bot report' },
  { Icon: PenLine, title: 'Extra rating edit', desc: 'Adjust rating every 3 months' },
];

// Localized feature names
const FEATURES_RU = [
  { Icon: BarChart3, title: 'Расширенная статистика', desc: 'Графики, паттерны, месячная активность' },
  { Icon: Swords, title: 'Head-to-Head', desc: 'Личная статистика против любого игрока' },
  { Icon: Users, title: 'Парный рейтинг', desc: 'Детальная история и прогресс пары' },
  { Icon: Trophy, title: 'Фильтры рейтинга', desc: 'За месяц, за неделю, по региону' },
  { Icon: Star, title: 'Все достижения', desc: 'Полный список с прогрессом' },
  { Icon: Calendar, title: 'Экспорт в календарь', desc: 'Матч в .ics одним нажатием' },
  { Icon: Search, title: 'Приоритет в поиске', desc: 'Выше в результатах поиска партнёров' },
  { Icon: Crown, title: 'VIP-бейдж', desc: 'Выделяйся в рейтинге и профилях' },
  { Icon: Bell, title: 'Еженедельная сводка', desc: 'Подробный отчёт от бота каждую неделю' },
  { Icon: PenLine, title: 'Корректировка рейтинга', desc: 'Дополнительная правка раз в 3 месяца' },
];

export function Premium({ user, onBack, onUpdate }) {
  const { tg } = useTelegram();
  const [subStatus, setSubStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    try {
      const data = await api.subscriptions.status();
      setSubStatus(data);
    } catch (err) {
      console.error('Load subscription status error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePurchase(planId) {
    setPurchasing(planId);
    try {
      const { invoiceLink } = await api.subscriptions.createInvoice(planId);

      if (tg?.openInvoice) {
        tg.openInvoice(invoiceLink, async (status) => {
          if (status === 'paid') {
            // Payment successful — refresh user and status
            await loadStatus();
            if (onUpdate) onUpdate();
          }
          setPurchasing(null);
        });
      } else {
        // Fallback: open link in browser
        window.open(invoiceLink, '_blank');
        setPurchasing(null);
      }
    } catch (err) {
      console.error('Purchase error:', err);
      setPurchasing(null);
    }
  }

  if (loading) {
    return (
      <div>
        <Header title="PRO" onBack={onBack} />
        <div style={{ textAlign: 'center', padding: 40, color: COLORS.textDim }}>
          Loading...
        </div>
      </div>
    );
  }

  const isPro = subStatus?.isPro;
  const plans = subStatus?.plans || [];

  return (
    <div style={{ paddingBottom: 40 }}>
      <Header title="Padel GO PRO" onBack={onBack} />

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 50%, #6D28D9 100%)',
        borderRadius: 16,
        padding: '28px 20px',
        textAlign: 'center',
        marginBottom: 20,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Glow effect */}
        <div style={{
          position: 'absolute', top: -40, right: -40,
          width: 120, height: 120, borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)', filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute', bottom: -30, left: -30,
          width: 100, height: 100, borderRadius: '50%',
          background: 'rgba(168,85,247,0.3)', filter: 'blur(30px)',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Sparkles size={40} color="#FFD700" style={{ marginBottom: 8 }} />
          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
            Padel GO PRO
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
            {isPro
              ? 'You have an active subscription!'
              : 'Unlock advanced features and elevate your game'
            }
          </p>

          {isPro && subStatus.expiresAt && (
            <div style={{
              marginTop: 12, padding: '8px 16px', borderRadius: 20,
              background: 'rgba(0,230,138,0.2)', display: 'inline-flex',
              alignItems: 'center', gap: 6,
            }}>
              <Check size={14} color={COLORS.accent} />
              <span style={{ fontSize: 13, color: COLORS.accent, fontWeight: 600 }}>
                {'Активен до '}
                {new Date(subStatus.expiresAt).toLocaleDateString('ru-RU', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Features list */}
      <div style={{ marginBottom: 24 }}>
        <p style={{
          fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 12,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Zap size={18} color={COLORS.purple} />
          {'Что включено в PRO'}
        </p>

        <Card>
          {FEATURES_RU.map((feat, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 0',
              borderBottom: i < FEATURES_RU.length - 1 ? `1px solid ${COLORS.border}` : 'none',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(168,85,247,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <feat.Icon size={18} color={COLORS.purple} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{feat.title}</p>
                <p style={{ fontSize: 12, color: COLORS.textDim, marginTop: 1 }}>{feat.desc}</p>
              </div>
              <Check size={16} color={isPro ? COLORS.accent : COLORS.textMuted} />
            </div>
          ))}
        </Card>
      </div>

      {/* Pricing */}
      {!isPro && plans.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <p style={{
            fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 12,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Crown size={18} color={COLORS.gold} />
            {'Choose your plan'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {plans.map((plan) => {
              const isYearly = plan.id === 'pro_yearly';
              const monthlyEquiv = isYearly ? Math.round(plan.price / 12) : plan.price;

              return (
                <div key={plan.id} style={{
                  background: COLORS.card,
                  border: `2px solid ${isYearly ? COLORS.purple : COLORS.border}`,
                  borderRadius: 16,
                  padding: 16,
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {isYearly && (
                    <div style={{
                      position: 'absolute', top: 10, right: -28,
                      background: COLORS.accent, color: '#000',
                      fontSize: 10, fontWeight: 700,
                      padding: '3px 32px',
                      transform: 'rotate(45deg)',
                    }}>
                      -33%
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>{plan.label}</p>
                      <p style={{ fontSize: 12, color: COLORS.textDim, marginTop: 2 }}>
                        {isYearly ? `${monthlyEquiv} Stars/month` : 'Per month'}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 22, fontWeight: 800, color: isYearly ? COLORS.purple : COLORS.text }}>
                        {plan.price}
                      </p>
                      <p style={{ fontSize: 11, color: COLORS.textDim }}>Stars</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handlePurchase(plan.id)}
                    disabled={purchasing !== null}
                    style={{
                      width: '100%',
                      padding: '12px 0',
                      borderRadius: 12,
                      border: 'none',
                      background: isYearly
                        ? 'linear-gradient(135deg, #A855F7, #7C3AED)'
                        : COLORS.accent,
                      color: isYearly ? '#fff' : '#000',
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: purchasing ? 'wait' : 'pointer',
                      opacity: purchasing && purchasing !== plan.id ? 0.5 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    {purchasing === plan.id ? (
                      'Processing...'
                    ) : (
                      <>
                        <Sparkles size={16} />
                        {isYearly ? 'Best value \u2014 Get PRO' : 'Subscribe'}
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Already PRO */}
      {isPro && (
        <Card>
          <div style={{ textAlign: 'center', padding: 12 }}>
            <Crown size={32} color={COLORS.gold} style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 15, fontWeight: 700, color: COLORS.accent, marginBottom: 4 }}>
              {'You are PRO!'}
            </p>
            <p style={{ fontSize: 13, color: COLORS.textDim }}>
              {'All premium features are unlocked. Thank you for your support!'}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
