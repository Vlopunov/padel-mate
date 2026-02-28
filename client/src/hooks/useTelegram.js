import { useCallback, useEffect, useMemo } from 'react';

const tg = window.Telegram?.WebApp;

export function useTelegram() {
  useEffect(() => {
    tg?.ready();
    tg?.expand();
    tg?.setHeaderColor('#0A0E1A');
    tg?.setBackgroundColor('#0A0E1A');
  }, []);

  const user = useMemo(() => {
    return tg?.initDataUnsafe?.user || null;
  }, []);

  const initData = useMemo(() => {
    return tg?.initData || '';
  }, []);

  const openTelegramLink = useCallback((url) => {
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(url);
    } else {
      window.open(url, '_blank');
    }
  }, []);

  const close = useCallback(() => {
    tg?.close();
  }, []);

  const showAlert = useCallback((message) => {
    if (tg?.showAlert) {
      tg.showAlert(message);
    } else {
      alert(message);
    }
  }, []);

  const hapticFeedback = useCallback((type = 'impact', style = 'medium') => {
    try {
      if (type === 'impact') tg?.HapticFeedback?.impactOccurred(style);
      else if (type === 'notification') tg?.HapticFeedback?.notificationOccurred(style);
      else if (type === 'selection') tg?.HapticFeedback?.selectionChanged();
    } catch (e) { /* Haptic not available outside Telegram */ }
  }, []);

  return { tg, user, initData, openTelegramLink, close, showAlert, hapticFeedback };
}
