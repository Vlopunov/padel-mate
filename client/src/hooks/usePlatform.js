import { useCallback, useEffect, useMemo } from 'react';

/**
 * Universal platform hook — works with both Telegram and MAX Mini Apps.
 *
 * Detection logic:
 * - MAX: window.WebApp exists AND window.Telegram?.WebApp?.initData is empty
 *        (MAX loads max-web-app.js which sets window.WebApp)
 * - Telegram: window.Telegram?.WebApp?.initData is non-empty
 *
 * Both SDKs expose a similar window.WebApp object, but MAX's is loaded
 * from st.max.ru and Telegram's from telegram.org.
 */

function detectPlatform() {
  const tg = window.Telegram?.WebApp;
  const max = window.WebApp;

  // Telegram has initData populated when launched from Telegram
  if (tg?.initData) {
    return 'telegram';
  }

  // MAX sets window.WebApp with its own initData
  if (max?.initData) {
    return 'max';
  }

  // If Telegram WebApp object exists but no initData — could be dev mode
  if (tg) {
    return 'telegram';
  }

  // MAX WebApp exists
  if (max) {
    return 'max';
  }

  return 'unknown';
}

function getWebApp() {
  const platform = detectPlatform();
  if (platform === 'telegram') {
    return window.Telegram?.WebApp;
  }
  // MAX and unknown both fall back to window.WebApp
  return window.WebApp;
}

export function usePlatform() {
  const platform = useMemo(() => detectPlatform(), []);
  const webapp = useMemo(() => getWebApp(), []);

  useEffect(() => {
    webapp?.ready?.();
    if (platform === 'telegram') {
      webapp?.expand?.();
      webapp?.setHeaderColor?.('#0A0E1A');
      webapp?.setBackgroundColor?.('#0A0E1A');
    }
  }, [platform, webapp]);

  const user = useMemo(() => {
    if (platform === 'telegram') {
      return webapp?.initDataUnsafe?.user || null;
    }
    if (platform === 'max') {
      // MAX initDataUnsafe has the same structure: { user: { id, first_name, ... } }
      return webapp?.initDataUnsafe?.user || null;
    }
    return null;
  }, [platform, webapp]);

  const initData = useMemo(() => {
    return webapp?.initData || '';
  }, [webapp]);

  const openLink = useCallback((url) => {
    if (platform === 'telegram' && webapp?.openTelegramLink) {
      webapp.openTelegramLink(url);
    } else if (platform === 'max' && webapp?.openMaxLink) {
      webapp.openMaxLink(url);
    } else {
      window.open(url, '_blank');
    }
  }, [platform, webapp]);

  const close = useCallback(() => {
    webapp?.close?.();
  }, [webapp]);

  const showAlert = useCallback((message) => {
    if (webapp?.showAlert) {
      webapp.showAlert(message);
    } else {
      alert(message);
    }
  }, [webapp]);

  const hapticFeedback = useCallback((type = 'impact', style = 'medium') => {
    try {
      const hf = webapp?.HapticFeedback;
      if (!hf) return;
      if (type === 'impact') hf.impactOccurred(style);
      else if (type === 'notification') hf.notificationOccurred(style);
      else if (type === 'selection') hf.selectionChanged();
    } catch (e) { /* Haptic not available */ }
  }, [webapp]);

  const shareContent = useCallback((text, link) => {
    if (platform === 'max' && webapp?.shareMaxContent) {
      webapp.shareMaxContent({ text, link });
    } else if (platform === 'telegram' && webapp?.switchInlineQuery) {
      webapp.switchInlineQuery(text);
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard?.writeText(link || text).catch(() => {});
    }
  }, [platform, webapp]);

  return {
    platform,       // 'telegram' | 'max' | 'unknown'
    webapp,         // raw WebApp object
    user,           // { id, first_name, last_name, username, ... }
    initData,       // URL-encoded string for server validation
    openLink,       // open URL in platform browser
    close,          // close mini-app
    showAlert,      // show native alert
    hapticFeedback, // haptic vibration
    shareContent,   // share via platform dialog
    // Keep backward compatibility with useTelegram
    tg: webapp,
    openTelegramLink: openLink,
  };
}
