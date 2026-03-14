import React, { useState, useEffect } from 'react';
import {
  Crown, BarChart3, Swords, Users, Trophy, Calendar, Star,
  Search, Bell, PenLine, Check, Zap, Sparkles, CreditCard,
  Bitcoin, ChevronDown, ChevronUp, X,
} from 'lucide-react';
import { COLORS } from '../config';
import { Card } from '../components/ui/Card';
import { Header } from '../components/ui/Header';
import { useTelegram } from '../hooks/useTelegram';
import { api } from '../services/api';

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

const PROVIDER_ICONS = {
  stars: Star,
  bepaid: CreditCard,
  yookassa: CreditCard,
  crypto: Bitcoin,
};

function formatPrice(priceObj) {
  if (!priceObj) return '';
  const { amount, currency } = priceObj;
  if (currency === 'XTR') return `${amount} Stars`;
  if (currency === 'BYN') return `${(amount / 100).toFixed(2)} BYN`;
  if (currency === 'RUB') return `${(amount / 100).toFixed(0)} \u20BD`;
  if (currency === 'USDT') return `${(amount / 100).toFixed(2)} USDT`;
  return `${amount} ${currency}`;
}

export function Premium({ user, onBack, onUpdate }) {
  const { tg } = useTelegram();
  const [subStatus, setSubStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [showFeatures, setShowFeatures] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    try {
      const data = await api.subscriptions.status();
      setSubStatus(data);
      // Default to yearly plan
      if (data.plans?.length) {
        setSelectedPlan(data.plans.find(p => p.id === 'pro_yearly') || data.plans[0]);
      }
      // Default to stars provider
      if (data.providers?.length) {
        setSelectedProvider(data.providers[0]);
      }
    } catch (err) {
      console.error('Load subscription status error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePurchase() {
    if (!selectedPlan || !selectedProvider || purchasing) return;
    setPurchasing(true);
    setError(null);

    try {
      const result = await api.subscriptions.createInvoice(selectedPlan.id, selectedProvider.id);

      if (result.type === 'invoice') {
        // Telegram Stars or crypto invoice — open natively
        if (tg?.openInvoice) {
          tg.openInvoice(result.invoiceLink, async (status) => {
            if (status === 'paid') {
              await loadStatus();
              if (onUpdate) onUpdate();
            }
            setPurchasing(false);
          });
        } else {
          window.open(result.invoiceLink, '_blank');
          setPurchasing(false);
        }
      } else if (result.type === 'redirect') {
        // YooKassa / bePaid — open payment page
        if (tg?.openLink) {
          tg.openLink(result.paymentUrl);
        } else {
          window.open(result.paymentUrl, '_blank');
        }
        setPurchasing(false);
        // After redirect, user comes back — we'll check status
        setTimeout(async () => {
          await loadStatus();
          if (onUpdate) onUpdate();
        }, 3000);
      } else if (result.type === 'manual_crypto') {
        // Show manual crypto instructions
        setError(`Send ${result.amount} ${result.currency} to:\n${result.wallet}\nThen contact @lopunow to confirm.`);
        setPurchasing(false);
      }
    } catch (err) {
      console.error('Purchase error:', err);
      setError(err.message || 'Payment error');
      setPurchasing(false);
    }
  }

  if (loading) {
    return (
      <div>
        <Header title="PRO" onBack={onBack} />
        <div style={{ textAlign: 'center', padding: 40, color: COLORS.textDim }}>Загрузка...</div>
      </div>
    );
  }

  const isPro = subStatus?.isPro;
  const plans = subStatus?.plans || [];
  const providers = subStatus?.providers || [];
  const currentPrice = selectedPlan && selectedProvider
    ? selectedPlan.prices?.[selectedProvider.id]
    : null;

  return (
    <div style={{ paddingBottom: 40 }}>
      <Header title="Padel GO PRO" onBack={onBack} />

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 50%, #6D28D9 100%)',
        borderRadius: 16, padding: '28px 20px', textAlign: 'center',
        marginBottom: 20, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', filter: 'blur(40px)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Sparkles size={40} color="#FFD700" style={{ marginBottom: 8 }} />
          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Padel GO PRO</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
            {isPro ? 'PRO-подписка активна!' : 'Расширенные функции для серьёзной игры'}
          </p>
          {isPro && subStatus.expiresAt && (
            <div style={{ marginTop: 12, padding: '8px 16px', borderRadius: 20, background: 'rgba(0,230,138,0.2)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Check size={14} color={COLORS.accent} />
              <span style={{ fontSize: 13, color: COLORS.accent, fontWeight: 600 }}>
                {'Активен до '}
                {new Date(subStatus.expiresAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Features */}
      <div style={{ marginBottom: 20 }}>
        <div
          onClick={() => setShowFeatures(!showFeatures)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: 8 }}
        >
          <p style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={18} color={COLORS.purple} /> Что включено
          </p>
          {showFeatures ? <ChevronUp size={18} color={COLORS.textDim} /> : <ChevronDown size={18} color={COLORS.textDim} />}
        </div>

        {showFeatures && (
          <Card>
            {FEATURES_RU.map((feat, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                borderBottom: i < FEATURES_RU.length - 1 ? `1px solid ${COLORS.border}` : 'none',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(168,85,247,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <feat.Icon size={18} color={COLORS.purple} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{feat.title}</p>
                  <p style={{ fontSize: 12, color: COLORS.textDim, marginTop: 1 }}>{feat.desc}</p>
                </div>
                <Check size={16} color={isPro ? COLORS.accent : COLORS.textMuted} />
              </div>
            ))}
          </Card>
        )}
      </div>

      {/* Purchase section */}
      {!isPro && plans.length > 0 && (
        <>
          {/* Plan selector */}
          <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.textDim, marginBottom: 8 }}>Выберите план</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {plans.map(plan => {
              const isSelected = selectedPlan?.id === plan.id;
              const isYearly = plan.id === 'pro_yearly';
              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  style={{
                    flex: 1, padding: '12px 10px', borderRadius: 12, cursor: 'pointer',
                    background: isSelected ? (isYearly ? 'rgba(168,85,247,0.15)' : 'rgba(0,230,138,0.1)') : COLORS.card,
                    border: `2px solid ${isSelected ? (isYearly ? COLORS.purple : COLORS.accent) : COLORS.border}`,
                    textAlign: 'center', position: 'relative',
                  }}
                >
                  {isYearly && (
                    <div style={{
                      position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
                      background: COLORS.accent, color: '#000', fontSize: 10, fontWeight: 700,
                      padding: '2px 8px', borderRadius: 6,
                    }}>-33%</div>
                  )}
                  <p style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginTop: isYearly ? 4 : 0 }}>{plan.label}</p>
                  {selectedProvider && plan.prices?.[selectedProvider.id] && (
                    <p style={{ fontSize: 12, color: COLORS.textDim, marginTop: 4 }}>
                      {formatPrice(plan.prices[selectedProvider.id])}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Provider selector */}
          <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.textDim, marginBottom: 8 }}>Способ оплаты</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
            {providers.map(prov => {
              const isSelected = selectedProvider?.id === prov.id;
              const ProvIcon = PROVIDER_ICONS[prov.id] || CreditCard;
              const price = selectedPlan?.prices?.[prov.id];

              return (
                <div
                  key={prov.id}
                  onClick={() => setSelectedProvider(prov)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                    background: isSelected ? 'rgba(168,85,247,0.1)' : COLORS.card,
                    border: `2px solid ${isSelected ? COLORS.purple : COLORS.border}`,
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: isSelected ? 'rgba(168,85,247,0.2)' : COLORS.surface,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <ProvIcon size={18} color={isSelected ? COLORS.purple : COLORS.textDim} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{prov.name}</p>
                    <p style={{ fontSize: 12, color: COLORS.textDim }}>{prov.description}</p>
                  </div>
                  {price && (
                    <p style={{ fontSize: 14, fontWeight: 700, color: isSelected ? COLORS.purple : COLORS.textDim, whiteSpace: 'nowrap' }}>
                      {formatPrice(price)}
                    </p>
                  )}
                  {isSelected && <Check size={18} color={COLORS.purple} />}
                </div>
              );
            })}
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(255,71,87,0.1)', border: `1px solid ${COLORS.danger}40`,
              borderRadius: 12, padding: 12, marginBottom: 16,
              display: 'flex', alignItems: 'flex-start', gap: 8,
            }}>
              <X size={16} color={COLORS.danger} style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 13, color: COLORS.danger, whiteSpace: 'pre-line' }}>{error}</p>
            </div>
          )}

          {/* Buy button */}
          <button
            onClick={handlePurchase}
            disabled={purchasing || !selectedPlan || !selectedProvider}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg, #A855F7, #7C3AED)',
              color: '#fff', fontSize: 16, fontWeight: 700, cursor: purchasing ? 'wait' : 'pointer',
              opacity: purchasing ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 20px rgba(168,85,247,0.3)',
            }}
          >
            {purchasing ? (
              'Обработка...'
            ) : (
              <>
                <Sparkles size={18} />
                {currentPrice ? `Оформить за ${formatPrice(currentPrice)}` : 'Оформить PRO'}
              </>
            )}
          </button>
        </>
      )}

      {/* Already PRO */}
      {isPro && (
        <Card>
          <div style={{ textAlign: 'center', padding: 12 }}>
            <Crown size={32} color={COLORS.gold} style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 15, fontWeight: 700, color: COLORS.accent, marginBottom: 4 }}>Вы PRO!</p>
            <p style={{ fontSize: 13, color: COLORS.textDim }}>
              Все премиум-функции разблокированы. Спасибо за поддержку!
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
