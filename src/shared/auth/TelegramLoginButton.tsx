import { useEffect, useRef, useCallback } from 'react';
import type { TelegramAuthData } from '../../features/profile/types';

const TELEGRAM_BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_NAME || 'financeappka_bot';

// Расширяем Window для Telegram callback
declare global {
  interface Window {
    TelegramLoginWidget?: {
      dataOnauth: (user: TelegramAuthData) => void;
    };
  }
}

interface TelegramLoginButtonProps {
  onAuth: (data: TelegramAuthData) => void;
  buttonSize?: 'large' | 'medium' | 'small';
  cornerRadius?: number;
  showUserPhoto?: boolean;
  requestAccess?: 'write';
}

export function TelegramLoginButton({
  onAuth,
  buttonSize = 'large',
  cornerRadius = 8,
  showUserPhoto = true,
  requestAccess,
}: TelegramLoginButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  // Мемоизируем callback
  const handleAuth = useCallback(
    (user: TelegramAuthData) => {
      onAuth(user);
    },
    [onAuth]
  );

  useEffect(() => {
    if (!containerRef.current || scriptLoaded.current) return;

    // Создаём уникальное имя для callback
    const callbackName = `TelegramLoginCallback_${Date.now()}`;

    // Регистрируем callback в window
    (window as unknown as Record<string, (user: TelegramAuthData) => void>)[callbackName] = handleAuth;

    // Создаём script элемент для Telegram Widget
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', TELEGRAM_BOT_USERNAME);
    script.setAttribute('data-size', buttonSize);
    script.setAttribute('data-radius', cornerRadius.toString());
    script.setAttribute('data-onauth', `${callbackName}(user)`);

    if (showUserPhoto) {
      script.setAttribute('data-userpic', 'true');
    } else {
      script.setAttribute('data-userpic', 'false');
    }

    if (requestAccess) {
      script.setAttribute('data-request-access', requestAccess);
    }

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(script);
    scriptLoaded.current = true;

    return () => {
      // Cleanup callback
      delete (window as unknown as Record<string, unknown>)[callbackName];
      scriptLoaded.current = false;
    };
  }, [handleAuth, buttonSize, cornerRadius, showUserPhoto, requestAccess]);

  return <div ref={containerRef} />;
}
